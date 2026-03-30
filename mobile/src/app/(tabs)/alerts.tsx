import React, { useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, Alert as RNAlert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAlerts } from '../../context/AlertContext';
import { useTheme } from '../../context/ThemeContext';
import { Alert, ActionType } from '../../types/alert';

const PAGE_SIZE = 25; // show 25 alerts at a time

const ACTIONS: Array<{ key: ActionType; label: string; icon: string }> = [
  { key: 'ISOLATE_VALVE',       label: 'ISOLATE VALVE',   icon: 'lock-closed-outline'  },
  { key: 'DISPATCH_FIELD_TEAM', label: 'DISPATCH TEAM',   icon: 'people-outline'       },
  { key: 'REDUCE_PRESSURE',     label: 'REDUCE PRESSURE', icon: 'arrow-down-outline'   },
  { key: 'NOTIFY_HQ',           label: 'NOTIFY HQ',       icon: 'megaphone-outline'    },
];

function AlertCard({ alert, onAck, onResolve }: {
  alert: Alert;
  onAck: (id: number) => void;
  onResolve: (id: number, action: string) => void;
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: colors.red,
    WARNING:  colors.amber,
    INFO:     colors.cyan,
  };
  const ACTION_COLORS: Record<ActionType, string> = {
    ISOLATE_VALVE:       colors.red,
    DISPATCH_FIELD_TEAM: colors.amber,
    REDUCE_PRESSURE:     colors.cyan,
    NOTIFY_HQ:           colors.green,
  };

  const color = SEVERITY_COLORS[alert.severity] ?? colors.cyan;

  function formatTime(ts: string) {
    try {
      const d = new Date(ts);
      const now = Date.now();
      const diff = now - d.getTime();
      if (diff < 60000) return 'just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return d.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    } catch { return '--'; }
  }

  function handleResolve(action: ActionType) {
    RNAlert.alert(
      `EXECUTE: ${action.replace(/_/g, ' ')}`,
      'This will resolve the alert and dispatch the selected response.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'CONFIRM', onPress: () => onResolve(alert.id, action) },
      ]
    );
  }

  if (alert.resolved) {
    return (
      <View style={[styles.alertCard, {
        backgroundColor: colors.bgSurface2,
        borderColor: colors.border,
        opacity: 0.55,
      }]}>
        <View style={[styles.alertAccent, { backgroundColor: colors.green }]} />
        <View style={styles.alertBody}>
          <Text style={[styles.alertTitle, { color: colors.textMuted, fontSize: 9 }]}>
            {alert.alert_type.replace(/_/g, ' ')}
          </Text>
          <Text style={[styles.alertMeta, { color: colors.textMuted }]}>
            {alert.sensor_id} · RESOLVED · {alert.action_taken ?? 'N/A'}
          </Text>
        </View>
        <View style={styles.alertRight}>
          <StatusBadge status="NOMINAL" label="OK" small />
        </View>
      </View>
    );
  }

  const isCritical = alert.severity === 'CRITICAL';

  return (
    <TouchableOpacity
      style={[styles.alertCard, {
        backgroundColor: isCritical ? colors.red + '08' : colors.bgSurface2,
        borderColor: isCritical ? colors.red + '50' : colors.border,
      }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
    >
      <View style={[styles.alertAccent, { backgroundColor: color }]} />
      <View style={styles.alertBody}>
        <View style={styles.alertTitleRow}>
          <Text style={[styles.alertTitle, { color }]} numberOfLines={1}>
            {alert.alert_type.replace(/_/g, ' ')}
          </Text>
          <StatusBadge status={alert.severity} small />
        </View>

        <Text style={[styles.alertDesc, { color: colors.textSecondary }]} numberOfLines={expanded ? undefined : 2}>
          {alert.message}
        </Text>

        <View style={styles.alertFooter}>
          <Text style={[styles.alertMeta, { color: colors.textMuted }]}>
            {alert.sensor_id}  ·  {formatTime(alert.timestamp)}  ·  {alert.value_at_trigger.toFixed(2)}
          </Text>
          {!alert.acknowledged && (
            <View style={[styles.unackDot, { backgroundColor: colors.red }]} />
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={colors.textMuted}
          />
        </View>

        {alert.location_label ? (
          <Text style={[styles.alertLocation, { color: colors.cyan }]}>{alert.location_label}</Text>
        ) : null}

        {expanded && (
          <View style={[styles.actionPanel, { borderTopColor: colors.border }]}>
            {!alert.acknowledged && (
              <TouchableOpacity
                style={[styles.ackBtn, { borderColor: colors.cyan + '50', backgroundColor: colors.cyan + '08' }]}
                onPress={() => onAck(alert.id)}
              >
                <Ionicons name="checkmark-circle-outline" size={13} color={colors.cyan} />
                <Text style={[styles.ackBtnText, { color: colors.cyan }]}>ACKNOWLEDGE</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.actionLabel, { color: colors.textMuted }]}>RESPONSE ACTIONS</Text>
            <View style={styles.actionGrid}>
              {ACTIONS.map((a) => {
                const ac = ACTION_COLORS[a.key];
                return (
                  <TouchableOpacity
                    key={a.key}
                    style={[styles.actionBtn, { borderColor: ac + '50', backgroundColor: ac + '0d' }]}
                    onPress={() => handleResolve(a.key)}
                  >
                    <Ionicons name={a.icon as any} size={12} color={ac} />
                    <Text style={[styles.actionBtnText, { color: ac }]}>{a.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function AlertsScreen() {
  const { colors } = useTheme();
  const { activeAlerts, allAlerts, criticalCount, warningCount, unacknowledgedCount, acknowledgeAlert, resolveAlert, refresh } = useAlerts();
  const [filter, setFilter]     = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [showAll, setShowAll]   = useState(false);
  const [page, setPage]         = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const displayAlerts = showAll ? allAlerts : activeAlerts;
  const filtered = filter === 'ALL'
    ? displayAlerts
    : displayAlerts.filter((a) => a.severity === filter);

  const visibleAlerts = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visibleAlerts.length < filtered.length;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />}
    >
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.red }]}>{criticalCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>CRITICAL</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.amber }]}>{warningCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>WARNINGS</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: unacknowledgedCount > 0 ? colors.red : colors.green }]}>
            {unacknowledgedCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>UNACKED</Text>
        </View>
      </View>

      {/* Filter bar */}
      <View style={styles.filterRow}>
        {(['ALL', 'CRITICAL', 'WARNING'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterBtn,
              { borderColor: colors.border },
              filter === f && { borderColor: colors.red + '70', backgroundColor: colors.red + '10' },
            ]}
            onPress={() => { setFilter(f); setPage(1); }}
          >
            <Text style={[styles.filterText, { color: filter === f ? colors.red : colors.textMuted }]}>{f}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.filterBtn,
            { borderColor: colors.border },
            showAll && { borderColor: colors.amber + '70', backgroundColor: colors.amber + '10' },
          ]}
          onPress={() => { setShowAll(!showAll); setPage(1); }}
        >
          <Text style={[styles.filterText, { color: showAll ? colors.amber : colors.textMuted }]}>
            {showAll ? 'ACTIVE ONLY' : 'HISTORY'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alert List */}
      <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
        <SectionHeader
          title={showAll ? 'ALERT HISTORY' : 'ACTIVE ALERTS'}
          accentColor={colors.red}
          right={
            <View style={styles.countRow}>
              <View style={[styles.liveTag, { borderColor: colors.red + '40', backgroundColor: colors.red + '08' }]}>
                <View style={[styles.liveDot, { backgroundColor: colors.red }]} />
                <Text style={[styles.liveText, { color: colors.red }]}>LIVE</Text>
              </View>
              <Text style={[styles.countText, { color: colors.textMuted }]}>{filtered.length}</Text>
            </View>
          }
        />
        <View style={styles.cardBody}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={38} color={colors.green} />
              <Text style={[styles.emptyText, { color: colors.green }]}>ALL CLEAR</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                No {filter !== 'ALL' ? filter.toLowerCase() + ' ' : ''}alerts detected
              </Text>
            </View>
          ) : (
            <>
              {visibleAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAck={acknowledgeAlert}
                  onResolve={resolveAlert}
                />
              ))}
              {hasMore && (
                <TouchableOpacity
                  style={[styles.loadMore, { borderColor: colors.border, backgroundColor: colors.bgSurface2 }]}
                  onPress={() => setPage((p) => p + 1)}
                >
                  <Text style={[styles.loadMoreText, { color: colors.textSecondary }]}>
                    LOAD MORE  ({filtered.length - visibleAlerts.length} remaining)
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1 },
  content:   { padding: 14, paddingBottom: 40, ...(require('react-native').Platform.OS === 'web' ? { maxWidth: 900, alignSelf: 'center' as any, width: '100%' } : {}) },
  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard:  { flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  statNum:   { fontFamily: 'monospace', fontSize: 22, fontWeight: '900' },
  statLabel: { fontFamily: 'monospace', fontSize: 7, letterSpacing: 1.5, marginTop: 3 },

  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1 },
  filterText: { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', letterSpacing: 1 },

  card:     { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginBottom: 14 },
  cardBody: { padding: 10 },

  countRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveTag:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  liveDot:  { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontFamily: 'monospace', fontSize: 7, fontWeight: '700', letterSpacing: 1 },
  countText: { fontFamily: 'monospace', fontSize: 8 },

  alertCard:     { flexDirection: 'row', borderWidth: 1, borderRadius: 8, marginBottom: 6, overflow: 'hidden' },
  alertAccent:   { width: 3, alignSelf: 'stretch' },
  alertBody:     { flex: 1, padding: 10 },
  alertRight:    { justifyContent: 'center', paddingRight: 10 },
  alertTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  alertTitle:    { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, flex: 1, marginRight: 6 },
  alertDesc:     { fontFamily: 'monospace', fontSize: 9, lineHeight: 14, marginBottom: 5 },
  alertFooter:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  alertMeta:     { fontFamily: 'monospace', fontSize: 7, flex: 1 },
  unackDot:      { width: 6, height: 6, borderRadius: 3 },
  alertLocation: { fontFamily: 'monospace', fontSize: 8, marginTop: 4 },

  actionPanel:  { marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  ackBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 4, padding: 8, marginBottom: 10, justifyContent: 'center' },
  ackBtnText:   { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  actionLabel:  { fontFamily: 'monospace', fontSize: 7, letterSpacing: 1, marginBottom: 8 },
  actionGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 4, borderWidth: 1, width: '48%' },
  actionBtnText: { fontFamily: 'monospace', fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },

  loadMore:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 6, borderWidth: 1, marginTop: 6 },
  loadMoreText: { fontFamily: 'monospace', fontSize: 9, letterSpacing: 1 },

  emptyState:   { padding: 30, alignItems: 'center', gap: 8 },
  emptyText:    { fontFamily: 'monospace', fontSize: 14, letterSpacing: 2, fontWeight: '700' },
  emptySubtext: { fontFamily: 'monospace', fontSize: 9, textAlign: 'center' },
});
