import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
  RefreshControl, LayoutChangeEvent,
} from 'react-native';
import Svg, { Polyline, Line, Circle as SvgCircle, Text as SvgText, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DemoGuideButton, GuideItem } from '../../components/ui/DemoGuide';
import { SENSOR_CONFIG } from '../../constants/sensorConfig';
import { THRESHOLDS } from '../../constants/thresholds';
import api from '../../services/api';
import { TrendPoint } from '../../types/reading';

// ─── Guide content ────────────────────────────────────────────────────────────
const GUIDE_ITEMS: GuideItem[] = [
  {
    icon: 'time-outline',
    title: 'Data Window — 1H / 6H / 24H / 48H',
    description:
      'Choose how far back in time to show data. 1H = last hour, 48H = last 2 days. Click a button to switch — the charts and stats update immediately.',
    type: 'action',
    example: 'e.g. Click "24H" to see the last 24 hours of sensor readings.',
  },
  {
    icon: 'hardware-chip-outline',
    title: 'Sensor Cards (PS-001, FS-002, ACS-003, IR-004)',
    description:
      'Each card is one physical sensor on the pipeline. PS = Pressure Sensor, FS = Flow meter, ACS = Acoustic emission sensor, IR = Infrared camera.',
    type: 'indicator',
    example: 'e.g. PS-001 is at Km 12.4, measuring pipe pressure in PSI.',
  },
  {
    icon: 'stats-chart-outline',
    title: 'MEAN stat',
    description:
      'The average reading over your selected time window. Compare this to the normal range — if MEAN is outside the green band on the chart, the sensor is consistently abnormal.',
    type: 'data',
    example: 'e.g. MEAN = 98.5 PSI → within the 85–115 PSI normal range.',
  },
  {
    icon: 'pulse-outline',
    title: 'STD DEV (Standard Deviation)',
    description:
      'How much readings fluctuate. LOW STD DEV = stable sensor. HIGH STD DEV = erratic, which usually means something physical is changing (pipe vibration, intermittent leak).',
    type: 'data',
    example: 'e.g. STD DEV = 12.3 → readings vary by ~12 units from the mean.',
  },
  {
    icon: 'arrow-down-circle-outline',
    title: 'MIN / MAX',
    description:
      'Lowest and highest reading recorded in the window. If MAX exceeded the red threshold, an alert was automatically raised. Check the Alerts tab for details.',
    type: 'data',
  },
  {
    icon: 'trending-up-outline',
    title: 'Trend Arrow (↑ ↓ →)',
    description:
      'Compares the second half of your time window to the first half. ↑ means values are rising, ↓ means falling, → means stable. The % shows how much it changed.',
    type: 'indicator',
    example: 'e.g. ↑ +4.2% means the sensor readings rose 4.2% compared to the start of the window.',
  },
  {
    icon: 'git-branch-outline',
    title: 'Line Chart',
    description:
      'Time series chart showing sensor readings. The GREEN BAND is the safe operating range. Values inside the band = normal. RED DOTS = anomalies detected by Z-score analysis.',
    type: 'chart',
    example: 'e.g. A dip below the green band on FS-002 suggests a flow loss event (possible leak).',
  },
  {
    icon: 'warning-outline',
    title: 'RED DOTS on chart — Anomalies',
    description:
      'Each red dot marks a reading that was statistically unusual — its Z-score exceeded 2.5 standard deviations from the mean. These are the same events that trigger Alerts.',
    type: 'warning',
    example: 'e.g. 3 red dots at 14:30 means 3 consecutive readings spiked abnormally at that time.',
  },
  {
    icon: 'list-outline',
    title: 'SHOW ANOMALY LIST button',
    description:
      'Tap the anomaly footer at the bottom of a card to see the exact timestamps of every anomaly detected in that sensor during your selected window.',
    type: 'action',
  },
  {
    icon: 'refresh-outline',
    title: 'Pull Down to Refresh',
    description:
      'Drag the screen downward to manually refresh all data from the backend. Data also auto-refreshes every 60 seconds.',
    type: 'action',
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const WINDOWS = [
  { label: '1H',  hours: 1  },
  { label: '6H',  hours: 6  },
  { label: '24H', hours: 24 },
  { label: '48H', hours: 48 },
];

const CH    = 130;
const PAD_L = 38;
const PAD_T = 10;
const PAD_B = 20;
const PAD_R = 10;

// ─── Trend helper ─────────────────────────────────────────────────────────────
function computeTrend(data: TrendPoint[]): { pct: number; dir: 'up' | 'down' | 'stable' } | null {
  if (data.length < 4) return null;
  const mid   = Math.floor(data.length / 2);
  const first = data.slice(0, mid);
  const second = data.slice(mid);
  const avg = (arr: TrendPoint[]) => arr.reduce((s, d) => s + d.value, 0) / arr.length;
  const f   = avg(first);
  const s   = avg(second);
  if (Math.abs(f) < 0.001) return null;
  const pct = ((s - f) / Math.abs(f)) * 100;
  return { pct, dir: pct > 1 ? 'up' : pct < -1 ? 'down' : 'stable' };
}

// ─── Chart ────────────────────────────────────────────────────────────────────
function MiniChart({
  data,
  color,
  gridColor,
  textColor,
  anomalyPoints,
  nominalMin,
  nominalMax,
  containerWidth,
}: {
  data: TrendPoint[];
  color: string;
  gridColor: string;
  textColor: string;
  anomalyPoints?: TrendPoint[];
  nominalMin?: number;
  nominalMax?: number;
  containerWidth: number;
}) {
  const W  = containerWidth - 24; // account for chartWrap padding
  const CW = W - PAD_L - PAD_R;

  if (W < 40 || data.length < 2) {
    return (
      <View style={{ height: CH, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="hourglass-outline" size={18} color={textColor} style={{ marginBottom: 6 }} />
        <Text style={{ color: textColor, fontFamily: 'monospace', fontSize: 9 }}>AWAITING DATA...</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const minV   = Math.min(...values);
  const maxV   = Math.max(...values) || minV + 1;

  // Expand range to include threshold band so it's always visible
  const domainMin = nominalMin != null ? Math.min(minV, nominalMin * 0.95) : minV;
  const domainMax = nominalMax != null ? Math.max(maxV, nominalMax * 1.05) : maxV;
  const range     = domainMax - domainMin || 1;
  const chartH    = CH - PAD_T - PAD_B;

  const toY = (v: number) => PAD_T + (1 - (v - domainMin) / range) * chartH;
  const toX = (i: number) => PAD_L + (i / (data.length - 1)) * CW;

  const pts = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');

  const gridYs = [0, 0.5, 1].map((g) => ({
    y:     PAD_T + g * chartH,
    label: (domainMax - g * range).toFixed(0),
  }));

  // Threshold band
  const bandTop    = nominalMax != null ? toY(nominalMax) : null;
  const bandBottom = nominalMin != null ? toY(nominalMin) : null;

  return (
    <Svg width={W} height={CH}>
      {/* Normal range band (green tint) */}
      {bandTop != null && bandBottom != null && (
        <Rect
          x={PAD_L}
          y={bandTop}
          width={CW}
          height={bandBottom - bandTop}
          fill="rgba(0,255,136,0.07)"
        />
      )}

      {/* Grid lines */}
      {gridYs.map((g, i) => (
        <React.Fragment key={i}>
          <Line x1={PAD_L} y1={g.y} x2={W - PAD_R} y2={g.y} stroke={gridColor} strokeWidth={1} />
          <SvgText
            x={PAD_L - 4}
            y={g.y + 3}
            fill={textColor}
            fontSize={7}
            textAnchor="end"
            fontFamily="monospace"
          >
            {g.label}
          </SvgText>
        </React.Fragment>
      ))}

      {/* Threshold lines */}
      {nominalMax != null && (
        <Line
          x1={PAD_L} y1={toY(nominalMax)}
          x2={W - PAD_R} y2={toY(nominalMax)}
          stroke="rgba(0,255,136,0.4)"
          strokeWidth={1}
          strokeDasharray="4,3"
        />
      )}
      {nominalMin != null && (
        <Line
          x1={PAD_L} y1={toY(nominalMin)}
          x2={W - PAD_R} y2={toY(nominalMin)}
          stroke="rgba(0,255,136,0.4)"
          strokeWidth={1}
          strokeDasharray="4,3"
        />
      )}

      {/* Data line */}
      <Polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeOpacity={0.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Anomaly dots */}
      {(anomalyPoints || []).map((ap, i) => {
        const idx = data.findIndex((d) => d.timestamp === ap.timestamp);
        if (idx < 0) return null;
        return (
          <SvgCircle
            key={i}
            cx={toX(idx)}
            cy={toY(ap.value)}
            r={4}
            fill="#ff1744"
            opacity={0.9}
          />
        );
      })}
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const [windowHours, setWindowHours] = useState(24);
  const [trends,    setTrends]    = useState<Record<string, TrendPoint[]>>({});
  const [stats,     setStats]     = useState<Record<string, any>>({});
  const [anomalies, setAnomalies] = useState<Record<string, any[]>>({});
  const [loading,   setLoading]   = useState(false);
  const [expanded,  setExpanded]  = useState<Record<string, boolean>>({});
  const [cardWidth, setCardWidth] = useState(340);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        SENSOR_CONFIG.map(async (s) => {
          const [trend, stat, anom] = await Promise.all([
            api.getSensorTrend(s.id, windowHours),
            api.getSensorStatistics(s.id, windowHours),
            api.getSensorAnomalies(s.id, windowHours),
          ]);
          return { id: s.id, trend, stat, anom };
        })
      );
      const t: Record<string, TrendPoint[]> = {};
      const st: Record<string, any>         = {};
      const an: Record<string, any[]>       = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          t[r.value.id]  = Array.isArray(r.value.trend) ? r.value.trend : [];
          st[r.value.id] = r.value.stat  || {};
          an[r.value.id] = Array.isArray(r.value.anom) ? r.value.anom : [];
        }
      });
      setTrends(t);
      setStats(st);
      setAnomalies(an);
    } catch (err) {
      console.warn('[Analytics] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [windowHours]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Totals for summary banner
  const totalAnomalies = Object.values(anomalies).reduce((s, a) => s + (a?.length ?? 0), 0);
  const sensorsWithIssues = SENSOR_CONFIG.filter(
    (s) => (anomalies[s.id]?.length ?? 0) > 0
  ).length;

  function onCardLayout(e: LayoutChangeEvent) {
    setCardWidth(e.nativeEvent.layout.width);
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchAll} tintColor={colors.magenta} />
      }
    >
      {/* ── Window selector + Guide ── */}
      <View style={styles.topRow}>
        <View style={styles.windowRow}>
          <Text style={[styles.windowLabel, { color: colors.textMuted }]}>DATA WINDOW:</Text>
          {WINDOWS.map((w) => (
            <TouchableOpacity
              key={w.hours}
              style={[
                styles.winBtn,
                { borderColor: colors.border },
                windowHours === w.hours && {
                  borderColor: colors.magenta,
                  backgroundColor: colors.magenta + '18',
                },
              ]}
              onPress={() => setWindowHours(w.hours)}
            >
              <Text
                style={[
                  styles.winBtnText,
                  { color: windowHours === w.hours ? colors.magenta : colors.textMuted },
                ]}
              >
                {w.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <DemoGuideButton screenTitle="Analytics" items={GUIDE_ITEMS} />
      </View>

      {/* ── Summary banner ── */}
      {totalAnomalies > 0 ? (
        <View style={[styles.summaryBanner, { backgroundColor: colors.red + '12', borderColor: colors.red + '35' }]}>
          <Ionicons name="warning" size={13} color={colors.red} />
          <Text style={[styles.summaryText, { color: colors.red }]}>
            {totalAnomalies} ANOMALIES detected across {sensorsWithIssues} sensor{sensorsWithIssues !== 1 ? 's' : ''} in the last {windowHours}h
          </Text>
        </View>
      ) : (
        <View style={[styles.summaryBanner, { backgroundColor: colors.green + '10', borderColor: colors.green + '30' }]}>
          <Ionicons name="checkmark-circle" size={13} color={colors.green} />
          <Text style={[styles.summaryText, { color: colors.green }]}>
            ALL SENSORS NOMINAL — No anomalies in the last {windowHours}h
          </Text>
        </View>
      )}

      {/* ── Sensor cards ── */}
      {SENSOR_CONFIG.map((config) => {
        const s          = stats[config.id]     || {};
        const t          = trends[config.id]    || [];
        const a          = anomalies[config.id] || [];
        const hasAnomaly = (s.anomaly_count ?? a.length) > 0;
        const trend      = computeTrend(t);
        const isExpanded = expanded[config.id] ?? false;

        const threshKey = config.type as keyof typeof THRESHOLDS;
        const thresh    = THRESHOLDS[threshKey] as any;

        // Trend arrow icon & color
        const trendIcon =
          trend == null    ? 'remove-outline' :
          trend.dir === 'up'   ? 'trending-up-outline' :
          trend.dir === 'down' ? 'trending-down-outline' :
                                 'remove-outline';
        const trendColor =
          trend == null ? colors.textMuted :
          trend.dir === 'stable' ? colors.textMuted :
          (config.type === 'PRESSURE' || config.type === 'FLOW')
            ? (trend.dir === 'up' ? colors.amber : colors.green)
            : (trend.dir === 'up' ? colors.red : colors.green);

        return (
          <View
            key={config.id}
            style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
            onLayout={onCardLayout}
          >
            <SectionHeader
              title={`${config.id} — ${config.shortLabel.toUpperCase()}`}
              subtitle={config.locationLabel}
              accentColor={config.color}
              right={
                <View style={styles.cardTopRight}>
                  {/* Trend arrow */}
                  {trend != null && (
                    <View style={styles.trendChip}>
                      <Ionicons name={trendIcon as any} size={12} color={trendColor} />
                      <Text style={[styles.trendPct, { color: trendColor }]}>
                        {trend.pct > 0 ? '+' : ''}{trend.pct.toFixed(1)}%
                      </Text>
                    </View>
                  )}
                  <StatusBadge
                    status={hasAnomaly ? 'WARNING' : 'NOMINAL'}
                    label={hasAnomaly ? `${s.anomaly_count ?? a.length} ANOM` : 'NOMINAL'}
                    small
                  />
                </View>
              }
            />

            {/* Stats row */}
            <View style={styles.statsRow}>
              {[
                { label: 'MEAN',    val: s.mean != null ? s.mean.toFixed(2) : '--', color: config.color },
                { label: 'STD DEV',val: s.std  != null ? s.std.toFixed(2)  : '--', color: config.color },
                { label: 'MIN',    val: s.min  != null ? s.min.toFixed(1)  : '--', color: colors.teal  },
                { label: 'MAX',    val: s.max  != null ? s.max.toFixed(1)  : '--', color: colors.amber },
                { label: 'READINGS',val: String(s.count ?? '--'),                  color: colors.textPrimary },
              ].map((item) => (
                <View
                  key={item.label}
                  style={[styles.statItem, { backgroundColor: colors.bgSurface2, borderColor: colors.border }]}
                >
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>{item.label}</Text>
                  <Text style={[styles.statVal,   { color: item.color }]}>{item.val}</Text>
                  <Text style={[styles.statUnit,  { color: colors.textMuted }]}>{config.unit}</Text>
                </View>
              ))}
            </View>

            {/* Normal range hint */}
            <View style={styles.rangeHint}>
              <Ionicons name="radio-button-on-outline" size={10} color={colors.green} />
              <Text style={[styles.rangeHintText, { color: colors.textMuted }]}>
                NORMAL RANGE: {thresh?.nominal_min ?? config.nominalMin}–{thresh?.nominal_max ?? config.nominalMax} {config.unit}
                {'  ·  '}
                <Text style={{ color: colors.green + 'cc' }}>GREEN BAND on chart</Text>
              </Text>
            </View>

            {/* Chart */}
            <View style={styles.chartWrap}>
              <MiniChart
                data={t}
                color={config.color}
                gridColor={colors.border + 'cc'}
                textColor={colors.textMuted}
                anomalyPoints={a}
                nominalMin={thresh?.nominal_min ?? config.nominalMin}
                nominalMax={thresh?.nominal_max ?? config.nominalMax}
                containerWidth={cardWidth}
              />
            </View>

            {/* Anomaly footer */}
            {a.length > 0 && (
              <TouchableOpacity
                style={[styles.anomalyBar, { backgroundColor: colors.red + '10', borderTopColor: colors.red + '30' }]}
                onPress={() => setExpanded((prev) => ({ ...prev, [config.id]: !isExpanded }))}
                activeOpacity={0.7}
              >
                <Ionicons name="warning" size={11} color={colors.red} />
                <Text style={[styles.anomalyText, { color: colors.red }]}>
                  {a.length} ANOMALIES — RED DOTS ON CHART
                </Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={13}
                  color={colors.red}
                  style={styles.anomalyChevron}
                />
              </TouchableOpacity>
            )}

            {/* Expanded anomaly list */}
            {isExpanded && a.length > 0 && (
              <View style={[styles.anomalyList, { borderTopColor: colors.red + '20' }]}>
                <Text style={[styles.anomalyListTitle, { color: colors.textMuted }]}>
                  ANOMALY TIMESTAMPS (showing first 10):
                </Text>
                {a.slice(0, 10).map((ap: any, i: number) => (
                  <View key={i} style={styles.anomalyListRow}>
                    <SvgCircle cx={0} cy={0} r={0} />
                    <View style={[styles.anomalyDot, { backgroundColor: colors.red }]} />
                    <Text style={[styles.anomalyListTs, { color: colors.textSecondary }]}>
                      {new Date(ap.timestamp).toLocaleTimeString([], {
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        month: 'short', day: 'numeric',
                      })}
                    </Text>
                    <Text style={[styles.anomalyListVal, { color: colors.amber }]}>
                      {typeof ap.value === 'number' ? ap.value.toFixed(2) : ''} {config.unit}
                    </Text>
                  </View>
                ))}
                {a.length > 10 && (
                  <Text style={[styles.anomalyMore, { color: colors.textMuted }]}>
                    + {a.length - 10} more anomalies — switch to a shorter window to narrow down.
                  </Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1 },
  content:  { padding: 14, paddingBottom: 40 },

  topRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  windowRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' },
  windowLabel: { fontFamily: 'monospace', fontSize: 8, letterSpacing: 1.5, marginRight: 2 },
  winBtn:      { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  winBtnText:  { fontFamily: 'monospace', fontSize: 9, fontWeight: '700' },

  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  summaryText: { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, flex: 1 },

  card:      { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginBottom: 14 },

  cardTopRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendChip:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendPct:     { fontFamily: 'monospace', fontSize: 9, fontWeight: '700' },

  statsRow:  { flexDirection: 'row', padding: 12, gap: 5 },
  statItem:  { flex: 1, borderRadius: 6, padding: 7, alignItems: 'center', borderWidth: 1 },
  statLabel: { fontFamily: 'monospace', fontSize: 6, letterSpacing: 0.8, marginBottom: 3 },
  statVal:   { fontFamily: 'monospace', fontSize: 13, fontWeight: '900' },
  statUnit:  { fontFamily: 'monospace', fontSize: 6, marginTop: 1 },

  rangeHint:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingBottom: 6 },
  rangeHintText: { fontFamily: 'monospace', fontSize: 8, letterSpacing: 0.3 },

  chartWrap: { paddingHorizontal: 12, paddingBottom: 6 },

  anomalyBar: {
    borderTopWidth: 1,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  anomalyText:    { fontFamily: 'monospace', fontSize: 9, letterSpacing: 0.8, flex: 1 },
  anomalyChevron: { marginLeft: 'auto' },

  anomalyList:      { padding: 12, borderTopWidth: 1 },
  anomalyListTitle: { fontFamily: 'monospace', fontSize: 8, letterSpacing: 1, marginBottom: 8 },
  anomalyListRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  anomalyDot:       { width: 6, height: 6, borderRadius: 3 },
  anomalyListTs:    { fontFamily: 'monospace', fontSize: 9, flex: 1 },
  anomalyListVal:   { fontFamily: 'monospace', fontSize: 9, fontWeight: '700' },
  anomalyMore:      { fontFamily: 'monospace', fontSize: 8, marginTop: 6, fontStyle: 'italic' },
});
