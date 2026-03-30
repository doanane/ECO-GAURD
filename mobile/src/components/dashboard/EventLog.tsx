import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAlerts } from '../../context/AlertContext';

export function EventLog() {
  const { colors } = useTheme();
  const { allAlerts } = useAlerts();
  const recent = allAlerts.slice(0, 30);

  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: colors.red,
    WARNING:  colors.amber,
    INFO:     colors.cyan,
  };

  function formatTime(ts: string) {
    try {
      return new Date(ts).toLocaleTimeString('en-US', { hour12: false, timeStyle: 'medium' });
    } catch { return '--'; }
  }

  if (recent.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyText, { color: colors.green }]}>
          NO EVENTS — ALL SYSTEMS NOMINAL
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={recent}
      keyExtractor={(item) => String(item.id)}
      scrollEnabled={false}
      renderItem={({ item }) => {
        const color = SEVERITY_COLORS[item.severity] || colors.cyan;
        return (
          <View style={[styles.row, { borderBottomColor: colors.border + '80' }]}>
            <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(item.timestamp)}</Text>
            <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
              <Text style={[styles.badgeText, { color }]}>{item.severity[0]}</Text>
            </View>
            <Text style={[styles.sensorId, { color: colors.cyan }]}>{item.sensor_id}</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.alert_type.replace(/_/g, ' ')}
            </Text>
            <Text style={[styles.leakVal, { color }]}>
              {item.value_at_trigger.toFixed(1)}
            </Text>
          </View>
        );
      }}
      ItemSeparatorComponent={() => null}
    />
  );
}

const styles = StyleSheet.create({
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  time: {
    fontFamily: 'monospace',
    fontSize: 8,
    width: 66,
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
  },
  sensorId: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    width: 62,
  },
  message: {
    fontFamily: 'monospace',
    fontSize: 9,
    flex: 1,
  },
  leakVal: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
  },
});
