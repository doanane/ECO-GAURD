import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const REPORT_TYPES = [
  { key: 'DAILY',        label: 'Daily Summary',    hours: 24  },
  { key: 'WEEKLY',       label: 'Weekly Report',    hours: 168 },
  { key: 'INCIDENT',     label: 'Incident Report',  hours: 24  },
  { key: 'COMPLIANCE',   label: 'Compliance Export', hours: 720 },
  { key: 'SENSOR_HEALTH', label: 'Sensor Health',   hours: 24  },
];

function HealthRow({ item, colors }: { item: any; colors: any }) {
  const health      = Math.max(0, Math.min(100, 100 - (item.anomaly_rate || 0)));
  const healthColor = health > 95 ? colors.green : health > 80 ? colors.amber : colors.red;

  return (
    <View style={[styles.healthRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.healthId, { color: colors.cyan }]}>{item.sensor_id}</Text>
      <View style={[styles.healthBar, { backgroundColor: colors.border }]}>
        {/* width MUST be set inline — percentage string works in RN */}
        <View style={[styles.healthFill, { width: `${health}%`, backgroundColor: healthColor }]} />
      </View>
      <Text style={[styles.healthPct, { color: healthColor }]}>{health.toFixed(0)}%</Text>
      <Text style={[styles.healthCount, { color: colors.textMuted }]}>{item.reading_count}</Text>
    </View>
  );
}

export default function ReportsScreen() {
  const { colors }              = useTheme();
  const [reports, setReports]   = useState<any[]>([]);
  const [health, setHealth]     = useState<any[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  // Guard against React StrictMode / tab double-mount causing duplicate data
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    try {
      const [r, h] = await Promise.all([api.getReports(), api.getSensorHealth()]);
      if (!mountedRef.current) return;
      // Deduplicate by id / sensor_id in case API returns dupes
      const dedupedReports = Array.isArray(r)
        ? r.filter((item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx)
        : [];
      const dedupedHealth = Array.isArray(h)
        ? h.filter((item, idx, arr) => arr.findIndex((x) => x.sensor_id === item.sensor_id) === idx)
        : [];
      setReports(dedupedReports);
      setHealth(dedupedHealth);
    } catch (err) {
      console.warn('[Reports] Fetch failed:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleGenerate(key: string, hours: number) {
    setGenerating(key);
    try {
      const report = await api.generateReport(key, hours);
      Alert.alert('Report Generated', report.title ?? 'Report saved.');
      await fetchData();
    } catch {
      Alert.alert('Error', 'Failed to generate report. Make sure the backend is running.');
    } finally {
      setGenerating(null);
    }
  }

  function formatDate(ts: string) {
    try {
      return new Date(ts).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    } catch { return '--'; }
  }

  const reportTypeColors: Record<string, string> = {
    DAILY:         colors.cyan,
    WEEKLY:        colors.magenta,
    INCIDENT:      colors.red,
    COMPLIANCE:    colors.amber,
    SENSOR_HEALTH: colors.green,
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={[styles.scrollOuter, Platform.OS === 'web' && styles.scrollOuterWeb]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={colors.amber} />}
    >
      <View style={styles.content}>
      {/* Sensor Health */}
      <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
        <SectionHeader
          title="SENSOR HEALTH — 24H"
          accentColor={colors.green}
          right={<Text style={[styles.subtleLabel, { color: colors.textMuted }]}>anomaly-free uptime</Text>}
        />
        <View style={styles.cardBody}>
          <View style={[styles.healthHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.healthHLabel, { color: colors.textMuted, width: 70 }]}>SENSOR</Text>
            <Text style={[styles.healthHLabel, { color: colors.textMuted, flex: 1 }]}>UPTIME BAR</Text>
            <Text style={[styles.healthHLabel, { color: colors.textMuted, width: 36 }]}>PCT</Text>
            <Text style={[styles.healthHLabel, { color: colors.textMuted, width: 52 }]}>READINGS</Text>
          </View>
          {health.length === 0 ? (
            <Text style={[styles.emptyLabel, { color: colors.textMuted }]}>No health data yet — data appears after the first minute</Text>
          ) : (
            health.map((h) => <HealthRow key={h.sensor_id} item={h} colors={colors} />)
          )}
        </View>
      </View>

      {/* Generate Reports */}
      <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
        <SectionHeader
          title="GENERATE REPORT"
          accentColor={colors.amber}
          right={<Ionicons name="document-outline" size={14} color={colors.amber} />}
        />
        <View style={styles.cardBody}>
          <Text style={[styles.genHint, { color: colors.textMuted }]}>
            Tap any report type to generate and store a JSON summary.
          </Text>
          <View style={styles.reportTypeGrid}>
            {REPORT_TYPES.map((rt) => {
              const rtColor = reportTypeColors[rt.key] ?? colors.cyan;
              const isGenerating = generating === rt.key;
              return (
                <TouchableOpacity
                  key={rt.key}
                  style={[styles.rtBtn, { borderColor: rtColor + '50', backgroundColor: rtColor + '08' }]}
                  onPress={() => handleGenerate(rt.key, rt.hours)}
                  disabled={isGenerating}
                >
                  <View style={[styles.rtDot, { backgroundColor: rtColor }]} />
                  <Text style={[styles.rtLabel, { color: rtColor }]}>{rt.label.toUpperCase()}</Text>
                  <Text style={[styles.rtSub, { color: colors.textMuted }]}>
                    {rt.hours < 48 ? `${rt.hours}h data` : `${rt.hours / 24}d data`}
                  </Text>
                  {isGenerating ? (
                    <Text style={[styles.rtGenerating, { color: rtColor }]}>GENERATING...</Text>
                  ) : (
                    <Ionicons name="add-circle-outline" size={11} color={rtColor + 'aa'} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Report List */}
      <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
        <SectionHeader
          title="GENERATED REPORTS"
          accentColor={colors.cyan}
          right={
            <View style={[styles.countBadge, { borderColor: colors.cyan + '40', backgroundColor: colors.cyan + '08' }]}>
              <Text style={[styles.countBadgeText, { color: colors.cyan }]}>{reports.length} TOTAL</Text>
            </View>
          }
        />
        <View style={styles.cardBody}>
          {reports.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>NO REPORTS YET</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Use the panel above to generate your first report
              </Text>
            </View>
          ) : (
            reports.map((r) => {
              const rColor = reportTypeColors[r.report_type] ?? colors.cyan;
              return (
                <View key={String(r.id)} style={[styles.reportRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.reportTypeTag, { backgroundColor: rColor + '12', borderColor: rColor + '40' }]}>
                    <Text style={[styles.reportTypeText, { color: rColor }]}>{r.report_type}</Text>
                  </View>
                  <View style={styles.reportLeft}>
                    <Text style={[styles.reportTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text style={[styles.reportDate, { color: colors.textMuted }]}>{formatDate(r.generated_at)}</Text>
                  </View>
                  <StatusBadge status="INFO" label="JSON" small />
                </View>
              );
            })
          )}
        </View>
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:         { flex: 1 },
  scrollOuter:    { flexGrow: 1 },
  scrollOuterWeb: { alignItems: 'center' },
  content:        { padding: 14, paddingBottom: 40, width: '100%', maxWidth: 900 },
  card:     { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginBottom: 14 },
  cardBody: { padding: 14 },

  healthHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1 },
  healthHLabel:  { fontFamily: 'monospace', fontSize: 7, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
  healthRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  healthId:      { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', width: 70 },
  healthBar:     { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', marginHorizontal: 6 },
  healthFill:    { height: '100%', borderRadius: 3 },
  healthPct:     { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', width: 36, textAlign: 'right' },
  healthCount:   { fontFamily: 'monospace', fontSize: 8, width: 52, textAlign: 'right' },

  genHint:        { fontFamily: 'monospace', fontSize: 8, marginBottom: 12, lineHeight: 13 },
  reportTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rtBtn:          { width: '48%', borderWidth: 1, borderRadius: 8, padding: 12 },
  rtDot:          { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  rtLabel:        { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 3 },
  rtSub:          { fontFamily: 'monospace', fontSize: 8, marginBottom: 4 },
  rtGenerating:   { fontFamily: 'monospace', fontSize: 7, letterSpacing: 1, marginTop: 2 },

  countBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  countBadgeText: { fontFamily: 'monospace', fontSize: 8, fontWeight: '700', letterSpacing: 1 },

  reportRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  reportTypeTag:  { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  reportTypeText: { fontFamily: 'monospace', fontSize: 7, fontWeight: '700', letterSpacing: 1 },
  reportLeft:     { flex: 1 },
  reportTitle:    { fontFamily: 'monospace', fontSize: 10, fontWeight: '600', marginBottom: 2 },
  reportDate:     { fontFamily: 'monospace', fontSize: 8 },

  subtleLabel:  { fontFamily: 'monospace', fontSize: 7, letterSpacing: 0.5 },
  emptyLabel:   { fontFamily: 'monospace', fontSize: 9, textAlign: 'center', paddingVertical: 12, lineHeight: 14 },
  emptyState:   { padding: 24, alignItems: 'center', gap: 8 },
  emptyText:    { fontFamily: 'monospace', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  emptySub:     { fontFamily: 'monospace', fontSize: 9, textAlign: 'center', lineHeight: 14 },
});
