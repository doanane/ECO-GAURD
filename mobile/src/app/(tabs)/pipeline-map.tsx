import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, LayoutChangeEvent, Platform } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SENSOR_CONFIG } from '../../constants/sensorConfig';
import { useSensorData } from '../../context/SensorDataContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { PipelineNode, PipelineTopology } from '../../types/pipeline';

const MAP_H  = 260;

export default function PipelineMapScreen() {
  const { colors } = useTheme();
  const [topology, setTopology] = useState<PipelineTopology | null>(null);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState<PipelineNode | null>(null);
  const [mapW, setMapW]         = useState(340);
  const { latestReadings, leakRiskPercent } = useSensorData();

  function onMapLayout(e: LayoutChangeEvent) {
    setMapW(e.nativeEvent.layout.width);
  }

  const NODE_COLORS: Record<string, string> = {
    NORMAL:   colors.green,
    WARNING:  colors.amber,
    CRITICAL: colors.red,
    ISOLATED: colors.textMuted,
  };

  const NODE_TYPE_SYMBOL: Record<string, string> = {
    PUMP:          'P',
    JUNCTION:      'J',
    VALVE:         'V',
    ENDPOINT:      'E',
    SENSOR_POINT:  'S',
  };

  const fetchTopology = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getPipelineTopology();
      setTopology(data);
    } catch (err) {
      console.warn('[PipelineMap] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopology();
    const interval = setInterval(fetchTopology, 30000);
    return () => clearInterval(interval);
  }, [fetchTopology]);

  function getNodeStatus(node: PipelineNode): string {
    if (node.sensor_id && latestReadings[node.sensor_id]) {
      const r = latestReadings[node.sensor_id];
      if (r.leak_probability > 0.7) return 'CRITICAL';
      if (r.leak_probability > 0.4) return 'WARNING';
    }
    return node.status;
  }

  function renderMap() {
    if (!topology) return null;
    const nodes = topology.nodes;
    const edges = topology.edges;

    const nodeMap: Record<string, PipelineNode> = {};
    nodes.forEach((n) => { nodeMap[n.node_id] = n; });

    return (
      <Svg width={mapW} height={MAP_H}>
        {/* Background grid lines */}
        {[0.25, 0.5, 0.75].map((g) => (
          <Line
            key={g}
            x1={g * mapW} y1={0} x2={g * mapW} y2={MAP_H}
            stroke={colors.border} strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* Pipe edges */}
        {edges.map((e, i) => {
          const from = nodeMap[e.from];
          const to = nodeMap[e.to];
          if (!from || !to) return null;
          const fx = from.x_position * mapW;
          const fy = from.y_position * MAP_H;
          const tx = to.x_position * mapW;
          const ty = to.y_position * MAP_H;
          const toStatus = getNodeStatus(to);
          const pipeColor =
            toStatus === 'CRITICAL' ? colors.red + 'a0' :
            toStatus === 'WARNING'  ? colors.amber + '80' :
                                     colors.teal + '60';

          return (
            <Line key={i} x1={fx} y1={fy} x2={tx} y2={ty}
              stroke={pipeColor} strokeWidth={3} strokeLinecap="round" />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const x  = node.x_position * mapW;
          const y  = node.y_position * MAP_H;
          const st = getNodeStatus(node);
          const col = NODE_COLORS[st] || colors.green;
          const isSelected = selected?.node_id === node.node_id;
          const r = node.node_type === 'SENSOR_POINT' ? 10 : 8;

          return (
            <React.Fragment key={node.node_id}>
              <Circle cx={x} cy={y} r={r + 5} fill={col} opacity={0.12} />
              <Circle
                cx={x} cy={y} r={r}
                fill={colors.bgSurface2}
                stroke={isSelected ? colors.textPrimary : col}
                strokeWidth={isSelected ? 2.5 : 1.5}
                onPress={() => setSelected(node)}
              />
              <SvgText x={x} y={y + 3} textAnchor="middle"
                fill={col} fontSize={7} fontFamily="monospace" fontWeight="700">
                {NODE_TYPE_SYMBOL[node.node_type] || '?'}
              </SvgText>
              {node.km_marker > 0 && (
                <SvgText x={x} y={y + r + 10} textAnchor="middle"
                  fill={colors.textMuted} fontSize={6} fontFamily="monospace">
                  {node.km_marker}km
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTopology} tintColor={colors.teal} />}
    >
      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'TOTAL LENGTH', val: '48 km',    color: colors.teal  },
          { label: 'NODES',        val: String(topology?.nodes?.length ?? '--'), color: colors.cyan },
          { label: 'LEAK RISK',    val: leakRiskPercent.toFixed(0) + '%',
            color: leakRiskPercent > 50 ? colors.red : colors.green },
        ].map((item) => (
          <View key={item.label} style={[styles.statCard, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: item.color }]}>{item.val}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Pipeline Map */}
      <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
        <SectionHeader
          title="PIPELINE TOPOLOGY — SECTOR 7"
          subtitle="Km 0 to Km 48 — tap a node to inspect"
          accentColor={colors.teal}
        />
        <View style={[styles.mapWrap, { backgroundColor: colors.bgSurface2 }]} onLayout={onMapLayout}>
          {topology ? renderMap() : (
            <View style={[styles.mapWrap, { justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: colors.textMuted, fontFamily: 'monospace', fontSize: 9 }}>LOADING TOPOLOGY...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Selected node details */}
      {selected && (
        <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
          <SectionHeader title={`NODE: ${selected.node_id}`} accentColor={colors.cyan} />
          <View style={styles.nodeDetail}>
            {[
              { label: 'LABEL',      val: selected.label, color: colors.textPrimary },
              { label: 'TYPE',       val: selected.node_type, color: colors.cyan },
              { label: 'KM MARKER',  val: `${selected.km_marker} km`, color: colors.teal },
            ].map((item) => (
              <View key={item.label} style={[styles.nodeDetailRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.ndLabel, { color: colors.textMuted }]}>{item.label}</Text>
                <Text style={[styles.ndValue, { color: item.color }]}>{item.val}</Text>
              </View>
            ))}
            <View style={[styles.nodeDetailRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.ndLabel, { color: colors.textMuted }]}>STATUS</Text>
              <StatusBadge status={selected.status as any} small />
            </View>

            {selected.sensor_id && latestReadings[selected.sensor_id] && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border2 }]} />
                <Text style={[styles.ndSensorLabel, { color: colors.cyan }]}>ATTACHED SENSOR: {selected.sensor_id}</Text>
                {[
                  { label: 'CURRENT VALUE',    val: `${latestReadings[selected.sensor_id].value.toFixed(2)} ${latestReadings[selected.sensor_id].unit}`, color: colors.amber },
                  { label: 'LEAK PROBABILITY', val: `${(latestReadings[selected.sensor_id].leak_probability * 100).toFixed(1)}%`,
                    color: latestReadings[selected.sensor_id].leak_probability > 0.5 ? colors.red : colors.green },
                  { label: 'ANOMALY DETECTED', val: latestReadings[selected.sensor_id].is_anomaly ? 'YES' : 'NO',
                    color: latestReadings[selected.sensor_id].is_anomaly ? colors.red : colors.green },
                ].map((item) => (
                  <View key={item.label} style={[styles.nodeDetailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.ndLabel, { color: colors.textMuted }]}>{item.label}</Text>
                    <Text style={[styles.ndValue, { color: item.color }]}>{item.val}</Text>
                  </View>
                ))}
              </>
            )}

            <TouchableOpacity style={[styles.closeBtn, { borderColor: colors.border }]} onPress={() => setSelected(null)}>
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>CLOSE DETAILS</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Legend */}
      <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
        <SectionHeader title="MAP LEGEND" accentColor={colors.textSecondary} />
        <View style={styles.legendBody}>
          {Object.entries(NODE_COLORS).map(([status, color]) => (
            <View key={status} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>{status}</Text>
            </View>
          ))}
        </View>
        <View style={styles.sensorList}>
          {SENSOR_CONFIG.map((s) => (
            <View key={s.id} style={[styles.sensorItem, { borderLeftColor: s.color, backgroundColor: colors.bgSurface2 }]}>
              <Text style={[styles.sensorItemId, { color: s.color }]}>{s.id}</Text>
              <Text style={[styles.sensorItemLoc, { color: colors.textMuted }]}>{s.locationLabel}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1 },
  content:    { padding: 14, paddingBottom: 40, ...(Platform.OS === 'web' ? { maxWidth: 960, alignSelf: 'center' as any, width: '100%' } : {}) },
  statsRow:   { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard:   { flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  statNum:    { fontFamily: 'monospace', fontSize: 18, fontWeight: '900' },
  statLabel:  { fontFamily: 'monospace', fontSize: 7, letterSpacing: 1, marginTop: 3 },
  card:       { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginBottom: 14 },
  mapWrap:    { height: MAP_H },
  nodeDetail: { padding: 14 },
  nodeDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1 },
  ndLabel:    { fontFamily: 'monospace', fontSize: 8, letterSpacing: 1.5 },
  ndValue:    { fontFamily: 'monospace', fontSize: 10, fontWeight: '700' },
  divider:    { height: 1, marginVertical: 8 },
  ndSensorLabel: { fontFamily: 'monospace', fontSize: 8, letterSpacing: 1, marginBottom: 6 },
  closeBtn:   { marginTop: 12, padding: 10, borderWidth: 1, borderRadius: 4, alignItems: 'center' },
  closeBtnText: { fontFamily: 'monospace', fontSize: 9, letterSpacing: 1.5 },
  legendBody: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: 'monospace', fontSize: 9 },
  sensorList: { paddingHorizontal: 14, paddingBottom: 14, gap: 6 },
  sensorItem: { borderLeftWidth: 2, paddingLeft: 10, paddingVertical: 5, borderRadius: 4, flexDirection: 'row', justifyContent: 'space-between' },
  sensorItemId:  { fontFamily: 'monospace', fontSize: 9, fontWeight: '700' },
  sensorItemLoc: { fontFamily: 'monospace', fontSize: 8 },
});
