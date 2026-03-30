import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, ScrollView, StyleSheet, Text, View,
  LayoutChangeEvent, Platform,
} from 'react-native';
import Svg, {
  Circle, Defs, Line, LinearGradient, Path,
  Polyline, Rect, Stop, Text as SvgText,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LiveIndicator } from '../../components/ui/LiveIndicator';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DemoGuideButton, GuideItem } from '../../components/ui/DemoGuide';
import { SENSOR_CONFIG } from '../../constants/sensorConfig';
import { THRESHOLDS, getStatusFromValue } from '../../constants/thresholds';
import { useSensorData } from '../../context/SensorDataContext';
import { useTheme } from '../../context/ThemeContext';

// ─── Guide ────────────────────────────────────────────────────────────────────
const SENSORS_GUIDE: GuideItem[] = [
  {
    icon: 'hardware-chip-outline',
    title: 'Sensor Cards',
    description:
      'Each card is one physical sensor on the pipeline. The colored left border matches the sensor type: Cyan=Pressure, Amber=Flow, Green=Acoustic, Magenta=Infrared.',
    type: 'indicator',
  },
  {
    icon: 'speedometer-outline',
    title: 'Gauge (PS-001 Pressure)',
    description:
      'Half-circle arc gauge showing current PSI. The needle and arc fill show where you are within the 70–130 PSI full range. The dashed lines mark the normal zone (85–115 PSI).',
    type: 'chart',
    example: 'e.g. Needle pointing straight up = ~100 PSI = normal.',
  },
  {
    icon: 'bar-chart-outline',
    title: 'Bar Chart (FS-002 Flow)',
    description:
      'Vertical bars showing recent flow rate history. Each bar is one reading. Taller bars = higher flow. The green band marks the normal 180–220 L/min range.',
    type: 'chart',
  },
  {
    icon: 'pulse-outline',
    title: 'Waveform (ACS-003 Acoustic)',
    description:
      'Oscilloscope-style line showing acoustic emission level in dB. Spikes above the threshold line indicate high-frequency stress waves (possible micro-fractures in pipe).',
    type: 'chart',
  },
  {
    icon: 'thermometer-outline',
    title: 'Heat Bars (IR-004 Infrared)',
    description:
      'Color-coded bars showing surface temperature history. Teal = cool/normal, Amber = warm/warning, Red = hot/critical. Rising temperatures indicate pressurized fluid leaking underground.',
    type: 'chart',
  },
  {
    icon: 'flask-outline',
    title: 'AGENT STATE',
    description:
      'The AI agent\'s current decision: NORMAL = no anomaly, MONITORING = elevated readings, LEAK = leak event detected. This drives alert generation.',
    type: 'indicator',
    example: 'e.g. LEAK → a CRITICAL alert is auto-generated and sent to the Alerts tab.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'CONFIDENCE score',
    description:
      'How certain the AI agent is about its current assessment (0–100%). High confidence + LEAK state = very likely a real event. Low confidence = ambiguous reading.',
    type: 'data',
  },
  {
    icon: 'water-outline',
    title: 'LEAK PROBABILITY bar',
    description:
      'Composite probability (0–100%) that a leak is occurring right now. Green = safe, Amber = warning (40–70%), Red = critical (>70%). Updated with every sensor reading.',
    type: 'indicator',
  },
];

// ─── Gauge (Pressure) ─────────────────────────────────────────────────────────
const GAUGE_H = 110;
const ARC_R   = 52;

function PressureGauge({
  value, color, w,
  nominalMin, nominalMax, rangeMin, rangeMax,
}: {
  value: number; color: string; w: number;
  nominalMin: number; nominalMax: number;
  rangeMin: number; rangeMax: number;
}) {
  const anim  = useRef(new Animated.Value(0)).current;
  const range = rangeMax - rangeMin || 1;
  const pct   = Math.max(0, Math.min(1, (value - rangeMin) / range));

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 600, useNativeDriver: false }).start();
  }, [pct]);

  const cx = w / 2;
  const cy = GAUGE_H - 16;

  // Arc helpers (left = -180°, right = 0°)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPt = (r: number, pct: number) => {
    const a = toRad(-180 + pct * 180);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const arcPath = (r: number, p1: number, p2: number) => {
    const s = arcPt(r, p1);
    const e = arcPt(r, p2);
    const large = p2 - p1 > 0.5 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  // Normal range arc
  const nMin = (nominalMin - rangeMin) / range;
  const nMax = (nominalMax - rangeMin) / range;

  // Needle
  const needleLen = ARC_R - 8;
  const needleAngle = -180 + pct * 180;
  const nr = toRad(needleAngle);
  const nx = cx + needleLen * Math.cos(nr);
  const ny = cy + needleLen * Math.sin(nr);

  // Tick marks (5 ticks)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => {
    const inner = arcPt(ARC_R - 5, p);
    const outer = arcPt(ARC_R + 3, p);
    const label = arcPt(ARC_R + 14, p);
    const val = (rangeMin + p * range).toFixed(0);
    return { inner, outer, label, val };
  });

  return (
    <Svg width={w} height={GAUGE_H}>
      {/* Background arc */}
      <Path
        d={arcPath(ARC_R, 0, 1)}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* Normal range highlight */}
      <Path
        d={arcPath(ARC_R, nMin, nMax)}
        fill="none"
        stroke="rgba(0,255,136,0.12)"
        strokeWidth={12}
        strokeLinecap="round"
      />
      {/* Value arc */}
      <Path
        d={arcPath(ARC_R, 0, pct)}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        opacity={0.85}
      />
      {/* Ticks */}
      {ticks.map((t, i) => (
        <React.Fragment key={i}>
          <Line
            x1={t.inner.x} y1={t.inner.y}
            x2={t.outer.x} y2={t.outer.y}
            stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}
          />
          <SvgText
            x={t.label.x} y={t.label.y}
            fill="rgba(109,155,190,0.6)"
            fontSize={7} textAnchor="middle"
            fontFamily="monospace"
          >
            {t.val}
          </SvgText>
        </React.Fragment>
      ))}
      {/* Needle */}
      <Line
        x1={cx} y1={cy} x2={nx} y2={ny}
        stroke="white" strokeWidth={2}
        strokeLinecap="round" opacity={0.9}
      />
      <Circle cx={cx} cy={cy} r={5} fill="#091828" stroke={color} strokeWidth={2} />
      {/* Center value */}
      <SvgText
        x={cx} y={cy - 18}
        textAnchor="middle"
        fill={color}
        fontSize={22}
        fontFamily="monospace"
        fontWeight="700"
      >
        {value.toFixed(1)}
      </SvgText>
      <SvgText
        x={cx} y={cy - 6}
        textAnchor="middle"
        fill="rgba(109,155,190,0.6)"
        fontSize={8}
        fontFamily="monospace"
      >
        PSI
      </SvgText>
    </Svg>
  );
}

// ─── Flow bar chart ───────────────────────────────────────────────────────────
const CHART_H = 90;

function FlowBars({
  value, history, color, w,
  nominalMin, nominalMax, rangeMin, rangeMax,
}: {
  value: number; history: number[]; color: string; w: number;
  nominalMin: number; nominalMax: number; rangeMin: number; rangeMax: number;
}) {
  const bars  = history.slice(-28);
  const range = rangeMax - rangeMin || 1;
  const nMinY = CHART_H - 14 - ((nominalMin - rangeMin) / range) * (CHART_H - 20);
  const nMaxY = CHART_H - 14 - ((nominalMax - rangeMin) / range) * (CHART_H - 20);
  const barW  = (w - 8) / Math.max(bars.length, 1);

  return (
    <Svg width={w} height={CHART_H + 4}>
      {/* Normal band */}
      <Rect
        x={4} y={nMaxY}
        width={w - 8} height={nMinY - nMaxY}
        fill="rgba(0,255,136,0.06)"
      />
      {/* Bars */}
      {bars.map((v, i) => {
        const pct  = Math.max(0, Math.min(1, (v - rangeMin) / range));
        const barH = Math.max(3, pct * (CHART_H - 20));
        const bx   = 4 + i * barW + barW * 0.15;
        const bw   = barW * 0.7;
        const by   = CHART_H - 14 - barH;
        const isLast = i === bars.length - 1;
        return (
          <Rect
            key={i}
            x={bx} y={by}
            width={bw} height={barH}
            rx={2}
            fill={color}
            opacity={isLast ? 1 : 0.35 + (i / bars.length) * 0.55}
          />
        );
      })}
      {/* Normal range lines */}
      <Line x1={4} y1={nMinY} x2={w - 4} y2={nMinY} stroke="rgba(0,255,136,0.3)" strokeWidth={1} strokeDasharray="3,2" />
      <Line x1={4} y1={nMaxY} x2={w - 4} y2={nMaxY} stroke="rgba(0,255,136,0.3)" strokeWidth={1} strokeDasharray="3,2" />
      {/* Value label */}
      <SvgText
        x={w / 2} y={CHART_H + 2}
        textAnchor="middle"
        fill={color}
        fontSize={14}
        fontFamily="monospace"
        fontWeight="700"
      >
        {value.toFixed(1)} L/min
      </SvgText>
    </Svg>
  );
}

// ─── Waveform (Acoustic) ──────────────────────────────────────────────────────
function AcousticWave({
  value, history, color, w, nominalMax,
}: {
  value: number; history: number[]; color: string; w: number; nominalMax: number;
}) {
  const pts = history.slice(-36).map((v, i, arr) => {
    const x    = 4 + (i / Math.max(arr.length - 1, 1)) * (w - 8);
    const norm = Math.max(0, Math.min(1, v / 100));
    const y    = 8 + (1 - norm) * 58;
    return `${x},${y}`;
  }).join(' ');

  const threshY = 8 + (1 - nominalMax / 100) * 58;

  return (
    <Svg width={w} height={CHART_H}>
      {/* Threshold line */}
      <Line
        x1={4} y1={threshY} x2={w - 4} y2={threshY}
        stroke="rgba(0,255,136,0.35)" strokeWidth={1} strokeDasharray="4,3"
      />
      <SvgText x={w - 6} y={threshY - 3} textAnchor="end" fill="rgba(0,255,136,0.5)" fontSize={7} fontFamily="monospace">
        THRESHOLD
      </SvgText>
      {/* Waveform */}
      {pts ? (
        <Polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeOpacity={0.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {/* Current value */}
      <SvgText
        x={w / 2} y={CHART_H - 4}
        textAnchor="middle"
        fill={color}
        fontSize={14}
        fontFamily="monospace"
        fontWeight="700"
      >
        {value.toFixed(1)} dB
      </SvgText>
    </Svg>
  );
}

// ─── Heat bars (IR) ───────────────────────────────────────────────────────────
function IRHeatBars({
  value, history, w,
  redColor, amberColor, tealColor,
}: {
  value: number; history: number[]; w: number;
  redColor: string; amberColor: string; tealColor: string;
}) {
  const bars = history.slice(-28);
  const barW = (w - 8) / Math.max(bars.length, 1);

  const heatColor = (v: number) => {
    if (v >= 35) return redColor;
    if (v >= 25) return amberColor;
    return tealColor;
  };

  const curColor = heatColor(value);

  return (
    <Svg width={w} height={CHART_H}>
      {bars.map((v, i) => {
        const pct  = Math.max(0, Math.min(1, (v - 10) / 40));
        const barH = Math.max(3, pct * 64);
        const bx   = 4 + i * barW + barW * 0.15;
        const bw   = barW * 0.7;
        const isLast = i === bars.length - 1;
        return (
          <Rect
            key={i}
            x={bx} y={CHART_H - 20 - barH}
            width={bw} height={barH}
            rx={2}
            fill={heatColor(v)}
            opacity={isLast ? 1 : 0.3 + (i / bars.length) * 0.6}
          />
        );
      })}
      <SvgText
        x={w / 2} y={CHART_H - 4}
        textAnchor="middle"
        fill={curColor}
        fontSize={14}
        fontFamily="monospace"
        fontWeight="700"
      >
        {value.toFixed(1)} °C
      </SvgText>
    </Svg>
  );
}

// ─── Leak probability bar ─────────────────────────────────────────────────────
function LeakBar({ pct, colors }: { pct: number; colors: any }) {
  const color = pct > 0.7 ? colors.red : pct > 0.4 ? colors.amber : colors.green;
  const label = pct > 0.7 ? 'CRITICAL' : pct > 0.4 ? 'WARNING' : 'NOMINAL';
  const segments = 20;

  return (
    <View style={lbStyles.row}>
      <Text style={[lbStyles.label, { color: colors.textMuted }]}>LEAK PROBABILITY</Text>
      <View style={lbStyles.segRow}>
        {Array.from({ length: segments }).map((_, i) => {
          const filled = i / segments < pct;
          return (
            <View
              key={i}
              style={[
                lbStyles.seg,
                {
                  backgroundColor: filled ? color : colors.bgSurface2,
                  borderColor: filled ? color + '60' : colors.border,
                  opacity: filled ? (0.5 + (i / segments) * 0.5) : 0.3,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={lbStyles.pctRow}>
        <Text style={[lbStyles.pct, { color }]}>{(pct * 100).toFixed(1)}%</Text>
        <View style={[lbStyles.statusPill, { backgroundColor: color + '18', borderColor: color + '40' }]}>
          <Text style={[lbStyles.statusPillText, { color }]}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const lbStyles = StyleSheet.create({
  row:        { paddingHorizontal: 14, paddingVertical: 10 },
  label:      { fontFamily: 'monospace', fontSize: 7, letterSpacing: 1.2, marginBottom: 6 },
  segRow:     { flexDirection: 'row', gap: 2, marginBottom: 6 },
  seg:        { flex: 1, height: 8, borderRadius: 3, borderWidth: 1 },
  pctRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pct:        { fontFamily: 'monospace', fontSize: 16, fontWeight: '900' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusPillText: { fontFamily: 'monospace', fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SensorsScreen() {
  const { colors } = useTheme();
  const { latestReadings, readingHistory } = useSensorData();
  const [cardW, setCardW] = useState(340);

  function onLayout(e: LayoutChangeEvent) {
    setCardW(e.nativeEvent.layout.width);
  }

  const vizW = cardW - 28; // inner padding

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.webContent]}
    >
      {/* Header row with guide */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>SENSOR ARRAY</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            4 AUTONOMOUS AGENTS  ·  SECTOR 7  ·  48 KM PIPELINE
          </Text>
        </View>
        <DemoGuideButton screenTitle="Sensors" items={SENSORS_GUIDE} />
      </View>

      {SENSOR_CONFIG.map((config) => {
        const reading    = latestReadings[config.id];
        const value      = reading?.value ?? config.nominalMin + (config.nominalMax - config.nominalMin) / 2;
        const history    = readingHistory[config.id] || [];
        const status     = reading ? getStatusFromValue(value, config.type) : 'NOMINAL';
        const leakProb   = reading?.leak_probability ?? 0;
        const agentState = reading?.agent_state ?? 'NORMAL';
        const confidence = reading?.confidence_score ?? 0;

        const threshKey = config.type as keyof typeof THRESHOLDS;
        const thresh    = THRESHOLDS[threshKey] as any;

        const agentColor =
          agentState === 'LEAK'       ? colors.red :
          agentState === 'MONITORING' ? colors.amber :
          colors.green;

        return (
          <View
            key={config.id}
            style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
            onLayout={onLayout}
          >
            {/* Accent border left */}
            <View style={[styles.accentBar, { backgroundColor: config.color }]} />

            {/* Card header */}
            <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.idRow}>
                  <Text style={[styles.sensorId, { color: config.color }]}>{config.id}</Text>
                  <LiveIndicator color={config.color} size={6} />
                </View>
                <Text style={[styles.sensorName, { color: colors.textPrimary }]}>{config.label}</Text>
                <Text style={[styles.sensorLoc, { color: colors.textMuted }]}>{config.locationLabel}</Text>
              </View>
              <View style={styles.cardHeaderRight}>
                <StatusBadge status={status} small />
                <View style={[styles.agentPill, { backgroundColor: agentColor + '18', borderColor: agentColor + '50' }]}>
                  <View style={[styles.agentDot, { backgroundColor: agentColor }]} />
                  <Text style={[styles.agentText, { color: agentColor }]}>{agentState}</Text>
                </View>
              </View>
            </View>

            {/* Visualization */}
            <View style={[styles.vizWrap, { backgroundColor: colors.bg }]}>
              {config.id === 'PS-001' && (
                <PressureGauge
                  value={value} color={config.color} w={vizW}
                  nominalMin={thresh?.nominal_min ?? config.nominalMin}
                  nominalMax={thresh?.nominal_max ?? config.nominalMax}
                  rangeMin={thresh?.critical_low ?? 60}
                  rangeMax={thresh?.critical_high ?? 140}
                />
              )}
              {config.id === 'FS-002' && (
                <FlowBars
                  value={value} history={history} color={config.color} w={vizW}
                  nominalMin={thresh?.nominal_min ?? config.nominalMin}
                  nominalMax={thresh?.nominal_max ?? config.nominalMax}
                  rangeMin={thresh?.critical_low ?? 120}
                  rangeMax={thresh?.critical_high ?? 280}
                />
              )}
              {config.id === 'ACS-003' && (
                <AcousticWave
                  value={value} history={history} color={config.color} w={vizW}
                  nominalMax={thresh?.warning_high ?? 70}
                />
              )}
              {config.id === 'IR-004' && (
                <IRHeatBars
                  value={value} history={history} w={vizW}
                  redColor={colors.red}
                  amberColor={colors.amber}
                  tealColor={colors.teal}
                />
              )}
            </View>

            {/* Stats grid */}
            <View style={[styles.statsGrid, { borderTopColor: colors.border }]}>
              {[
                {
                  label: 'CURRENT VALUE',
                  val: `${value.toFixed(2)} ${config.unit}`,
                  color: config.color,
                  icon: 'radio-button-on-outline',
                },
                {
                  label: 'NORMAL RANGE',
                  val: `${config.nominalMin}–${config.nominalMax} ${config.unit}`,
                  color: colors.green,
                  icon: 'checkmark-circle-outline',
                },
                {
                  label: 'AGENT STATE',
                  val: agentState,
                  color: agentColor,
                  icon: 'cpu-outline',
                },
                {
                  label: 'CONFIDENCE',
                  val: `${(confidence * 100).toFixed(1)}%`,
                  color: colors.teal,
                  icon: 'shield-checkmark-outline',
                },
              ].map((item) => (
                <View
                  key={item.label}
                  style={[styles.statCell, { backgroundColor: colors.bgSurface2, borderColor: colors.border }]}
                >
                  <View style={styles.statCellTop}>
                    <Ionicons name={item.icon as any} size={11} color={item.color} />
                    <Text style={[styles.statCellLabel, { color: colors.textMuted }]}>{item.label}</Text>
                  </View>
                  <Text style={[styles.statCellVal, { color: item.color }]}>{item.val}</Text>
                </View>
              ))}
            </View>

            {/* Leak probability */}
            <View style={[styles.leakSection, { borderTopColor: colors.border }]}>
              <LeakBar pct={leakProb} colors={colors} />
            </View>

            {/* Description */}
            <View style={[styles.descBox, { backgroundColor: colors.bgSurface2, borderTopColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={11} color={colors.textMuted} style={{ marginTop: 1 }} />
              <Text style={[styles.descText, { color: colors.textSecondary }]}>{config.description}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1 },
  content:     { padding: 14, paddingBottom: 40 },
  webContent:  { maxWidth: 900, alignSelf: 'center', width: '100%' },

  pageHeader:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  pageTitle:    { fontFamily: 'monospace', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  pageSubtitle: { fontFamily: 'monospace', fontSize: 8, letterSpacing: 1, marginTop: 3 },

  card:      { borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 16, flexDirection: 'column' },
  accentBar: { height: 3, width: '100%' },

  cardHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, borderBottomWidth: 1 },
  cardHeaderLeft:  { flex: 1 },
  cardHeaderRight: { alignItems: 'flex-end', gap: 8 },
  idRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  sensorId:        { fontFamily: 'monospace', fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  sensorName:      { fontFamily: 'monospace', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  sensorLoc:       { fontFamily: 'monospace', fontSize: 9, letterSpacing: 0.5 },

  agentPill:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  agentDot:      { width: 6, height: 6, borderRadius: 3 },
  agentText:     { fontFamily: 'monospace', fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },

  vizWrap:   { padding: 14, alignItems: 'center' },

  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 8, borderTopWidth: 1 },
  statCell:     { flex: 1, minWidth: '45%', borderRadius: 8, padding: 10, borderWidth: 1 },
  statCellTop:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  statCellLabel:{ fontFamily: 'monospace', fontSize: 7, letterSpacing: 0.8 },
  statCellVal:  { fontFamily: 'monospace', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },

  leakSection: { borderTopWidth: 1 },

  descBox:  { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, alignItems: 'flex-start' },
  descText: { fontFamily: 'monospace', fontSize: 9, lineHeight: 15, flex: 1 },
});
