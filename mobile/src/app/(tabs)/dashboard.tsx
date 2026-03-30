import React, { useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { KPICard } from '../../components/ui/KPICard';
import { SensorGrid } from '../../components/dashboard/SensorGrid';
import { LeakRiskGauge } from '../../components/dashboard/LeakRiskGauge';
import { TrendChart } from '../../components/dashboard/TrendChart';
import { EventLog } from '../../components/dashboard/EventLog';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LiveIndicator } from '../../components/ui/LiveIndicator';
import { useSensorData } from '../../context/SensorDataContext';
import { getStatusFromValue } from '../../constants/thresholds';
import { DemoGuideButton, GuideItem } from '../../components/ui/DemoGuide';
import api from '../../services/api';

const DASHBOARD_GUIDE: GuideItem[] = [
  {
    icon: 'warning-outline',
    title: 'SIMULATE LEAK button',
    description:
      'Injects an artificial leak signal into all 4 sensor agents for ~30 seconds. Use this to test that alerts fire correctly and to see how the app responds to an emergency.',
    type: 'action',
    example: 'e.g. Press it, then go to the Alerts tab — you should see new CRITICAL alerts appear within 5 seconds.',
  },
  {
    icon: 'refresh-outline',
    title: 'RESET SYSTEM button',
    description:
      'Clears any active simulated leak and returns all sensors to normal (nominal) readings. Does NOT delete historical data or past alerts.',
    type: 'action',
  },
  {
    icon: 'speedometer-outline',
    title: 'KPI Cards — Pressure / Flow / Acoustic / Infrared',
    description:
      'These 4 boxes show the latest live reading from each sensor. They update automatically via WebSocket every time a sensor reports. Color indicates status: CYAN=normal, AMBER=warning, RED=critical.',
    type: 'indicator',
    example: 'e.g. Pressure = 98.5 PSI  ·  Flow = 202 L/min  ·  Both inside normal range.',
  },
  {
    icon: 'radio-outline',
    title: 'LIVE badge (top right)',
    description:
      'Green dot + "LIVE" = the app has an active WebSocket connection and is receiving sensor data in real time. Red "OFFLINE" = WebSocket disconnected, data is stale.',
    type: 'indicator',
  },
  {
    icon: 'analytics-outline',
    title: 'Composite Leak Risk Gauge',
    description:
      'A combined risk score (0–100%) computed from all 4 sensors using weighted scoring: Pressure 35%, Flow 30%, Acoustic 25%, Infrared 10%. Above 40% = WARNING. Above 70% = CRITICAL.',
    type: 'chart',
    example: 'e.g. Risk = 72% → CRITICAL → check Alerts tab immediately.',
  },
  {
    icon: 'pulse-outline',
    title: 'Sensor Array — Real-Time grid',
    description:
      'Shows all 4 sensors with their current value, status badge, and a small sparkline. Each row is one sensor agent running autonomously in the backend.',
    type: 'indicator',
  },
  {
    icon: 'trending-up-outline',
    title: 'Live Sensor Trend chart',
    description:
      'A real-time chart plotting the last 50 readings for each sensor. Lines update every time a new reading arrives over WebSocket — you can watch the live fluctuations.',
    type: 'chart',
  },
  {
    icon: 'list-outline',
    title: 'Event Log',
    description:
      'Chronological list of system events: sensor readings, alerts raised, alerts acknowledged, leak simulations. Most recent event is at the top.',
    type: 'indicator',
  },
  {
    icon: 'moon-outline',
    title: 'DARK / LIGHT / SYSTEM theme toggle (top right)',
    description:
      'Cycles between Dark mode, Light mode, and System mode (follows your phone\'s system setting). Tap the button next to the LIVE badge to switch.',
    type: 'action',
  },
];


export default function DashboardScreen() {
  const { colors } = useTheme();
  const { latestReadings, leakRiskPercent, riskLevel, refresh } = useSensorData();
  const [refreshing, setRefreshing] = useState(false);

  const pressure = latestReadings['PS-001'];
  const flow = latestReadings['FS-002'];
  const acoustic = latestReadings['ACS-003'];
  const infrared = latestReadings['IR-004'];

  const psStatus = pressure ? getStatusFromValue(pressure.value, 'PRESSURE') : 'NOMINAL';
  const fsStatus = flow ? getStatusFromValue(flow.value, 'FLOW') : 'NOMINAL';
  const acStatus = acoustic ? getStatusFromValue(acoustic.value, 'ACOUSTIC') : 'NOMINAL';
  const irStatus = infrared ? getStatusFromValue(infrared.value, 'INFRARED') : 'NOMINAL';

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function onSimLeak() {
    Alert.alert(
      'SIMULATE LEAK EVENT',
      'This injects a leak signal across all sensor agents for ~30 seconds.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'INJECT LEAK',
          style: 'destructive',
          onPress: async () => {
            try { await api.injectAllLeaks(15); } catch {}
          },
        },
      ]
    );
  }

  async function onReset() {
    Alert.alert('RESET ALL AGENTS', 'Reset all sensor agents to nominal state.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'RESET', onPress: async () => { try { await api.resetAllSensors(); } catch {} } },
    ]);
  }

  const isWeb = Platform.OS === 'web';

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={[styles.content, isWeb && styles.webContent]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} />
      }
    >
      {/* Action Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.simBtn, { borderColor: colors.red + '60', backgroundColor: colors.red + '12' }]} onPress={onSimLeak}>
          <Ionicons name="warning-outline" size={14} color={colors.red} />
          <Text style={[styles.simBtnText, { color: colors.red }]}>SIMULATE LEAK</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.rstBtn, { borderColor: colors.border, backgroundColor: colors.bgSurface2 }]} onPress={onReset}>
          <Ionicons name="refresh-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.rstBtnText, { color: colors.textSecondary }]}>RESET SYSTEM</Text>
        </TouchableOpacity>
        <DemoGuideButton screenTitle="Dashboard" items={DASHBOARD_GUIDE} />
      </View>

      {/* KPI Cards — 2x2 grid */}
      <View style={[styles.kpiGrid, isWeb && styles.kpiGridWeb]}>
        <View style={styles.kpiRow}>
          <KPICard
            label="Pressure"
            value={pressure ? pressure.value.toFixed(1) : '--'}
            unit="PSI — PS-001"
            accentColor={colors.cyan}
            status={psStatus}
            isLive
          />
          <KPICard
            label="Flow Rate"
            value={flow ? flow.value.toFixed(1) : '--'}
            unit="L/min — FS-002"
            accentColor={colors.amber}
            status={fsStatus}
            isLive
          />
        </View>
        <View style={styles.kpiRow}>
          <KPICard
            label="Acoustic"
            value={acoustic ? acoustic.value.toFixed(1) : '--'}
            unit="dB — ACS-003"
            accentColor={colors.green}
            status={acStatus}
            isLive
          />
          <KPICard
            label="Infrared"
            value={infrared ? infrared.value.toFixed(1) : '--'}
            unit="°C — IR-004"
            accentColor={colors.magenta}
            status={irStatus}
            isLive
          />
        </View>
      </View>

      {/* Two-column layout on web */}
      {isWeb ? (
        <View style={styles.webTwoCol}>
          {/* Left column */}
          <View style={styles.webCol}>
            {/* Leak Risk Gauge */}
            <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
              <SectionHeader
                title="Composite Leak Risk"
                accentColor={colors.amber}
                right={<StatusBadge status={riskLevel} label={`${leakRiskPercent.toFixed(1)}%`} />}
              />
              <View style={styles.cardBody}>
                <LeakRiskGauge />
              </View>
            </View>

            {/* Live Trend */}
            <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
              <SectionHeader
                title="Live Sensor Trend"
                accentColor={colors.teal}
                right={<LiveIndicator color={colors.green} size={7} />}
              />
              <View style={styles.cardBody}>
                <TrendChart />
              </View>
            </View>
          </View>

          {/* Right column */}
          <View style={styles.webCol}>
            {/* Sensor Array */}
            <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
              <SectionHeader
                title="Sensor Array — Real-Time"
                accentColor={colors.cyan}
                right={<StatusBadge status="ONLINE" label="4 ONLINE" />}
              />
              <View style={styles.cardBody}>
                <SensorGrid />
              </View>
            </View>

            {/* Event Log */}
            <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
              <SectionHeader title="Event Log" accentColor={colors.red} />
              <View style={styles.cardBody}>
                <EventLog />
              </View>
            </View>
          </View>
        </View>
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
            <SectionHeader
              title="Composite Leak Risk"
              accentColor={colors.amber}
              right={<StatusBadge status={riskLevel} label={`${leakRiskPercent.toFixed(1)}%`} />}
            />
            <View style={styles.cardBody}><LeakRiskGauge /></View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
            <SectionHeader
              title="Sensor Array — Real-Time"
              accentColor={colors.cyan}
              right={<StatusBadge status="ONLINE" label="4 ONLINE" />}
            />
            <View style={styles.cardBody}><SensorGrid /></View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
            <SectionHeader
              title="Live Sensor Trend"
              accentColor={colors.teal}
              right={<LiveIndicator color={colors.green} size={7} />}
            />
            <View style={styles.cardBody}><TrendChart /></View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
            <SectionHeader title="Event Log" accentColor={colors.red} />
            <View style={styles.cardBody}><EventLog /></View>
          </View>
        </>
      )}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          EcoGuard Technologies  ·  Pipeline Integrity Platform  ·  Sector 7  ·  48 km
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  webContent: { maxWidth: 1400, alignSelf: 'center', width: '100%' },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  simBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 11,
    borderWidth: 1,
    borderRadius: 8,
  },
  simBtnText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  rstBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 11,
    borderWidth: 1,
    borderRadius: 8,
  },
  rstBtnText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  kpiGrid: { marginBottom: 14 },
  kpiGridWeb: {},
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  cardBody: { padding: 14 },
  webTwoCol: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  webCol: { flex: 1 },
  footer: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  footerText: {
    fontFamily: 'monospace',
    fontSize: 9,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
