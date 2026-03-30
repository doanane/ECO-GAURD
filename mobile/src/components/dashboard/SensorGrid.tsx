import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { StatusBadge } from '../ui/StatusBadge';
import { LiveIndicator } from '../ui/LiveIndicator';
import { useSensorData } from '../../context/SensorDataContext';
import { SENSOR_CONFIG } from '../../constants/sensorConfig';
import { getStatusFromValue } from '../../constants/thresholds';

export function SensorGrid() {
  const { colors } = useTheme();
  const { latestReadings, readingHistory } = useSensorData();

  return (
    <View style={styles.grid}>
      {SENSOR_CONFIG.map((config) => {
        const reading = latestReadings[config.id];
        const value = reading?.value ?? null;
        const status = value !== null ? getStatusFromValue(value, config.type) : 'NOMINAL';
        const history = readingHistory[config.id] || [];
        const leakProb = reading?.leak_probability ?? 0;

        const valueColor =
          status === 'CRITICAL' ? colors.red :
          status === 'WARNING' ? colors.amber :
          colors.teal;

        const cardBorderColor =
          status === 'CRITICAL' ? colors.red + '60' :
          status === 'WARNING' ? colors.amber + '50' :
          colors.border;

        const cardBg =
          status === 'CRITICAL' ? colors.red + '08' :
          status === 'WARNING' ? colors.amber + '06' :
          colors.bgSurface2;

        return (
          <View
            key={config.id}
            style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorderColor }]}
          >
            <View style={styles.cardTop}>
              <View>
                <Text style={[styles.sensorName, { color: config.color }]}>
                  {config.shortLabel.toUpperCase()}
                </Text>
                <Text style={[styles.sensorId, { color: colors.textMuted }]}>{config.id}</Text>
              </View>
              <StatusBadge status={status} small />
            </View>

            <Text style={[styles.value, { color: valueColor }]}>
              {value !== null ? value.toFixed(1) : '--'}
            </Text>
            <Text style={[styles.unit, { color: colors.textMuted }]}>{config.unit}</Text>

            {/* Mini sparkline */}
            <View style={styles.sparkline}>
              {history.slice(-16).map((v, i) => {
                const range = config.nominalMax - config.nominalMin;
                const h = Math.max(3, ((v - config.nominalMin) / range) * 22);
                return (
                  <View
                    key={i}
                    style={[styles.bar, { height: h, backgroundColor: config.color + '70' }]}
                  />
                );
              })}
            </View>

            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <LiveIndicator color={config.color} size={6} />
              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                {config.locationLabel}
              </Text>
              <Text style={[
                styles.leakProb,
                { color: leakProb > 0.5 ? colors.red : colors.textMuted }
              ]}>
                {(leakProb * 100).toFixed(0)}% RISK
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sensorName: {
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2,
  },
  sensorId: {
    fontFamily: 'monospace',
    fontSize: 7,
    marginTop: 1,
  },
  value: {
    fontFamily: 'monospace',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 30,
  },
  unit: {
    fontFamily: 'monospace',
    fontSize: 9,
    marginBottom: 8,
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 22,
    gap: 2,
    marginBottom: 8,
  },
  bar: {
    flex: 1,
    borderRadius: 1,
    minHeight: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 1,
    paddingTop: 7,
  },
  footerText: {
    fontFamily: 'monospace',
    fontSize: 7,
    flex: 1,
  },
  leakProb: {
    fontFamily: 'monospace',
    fontSize: 7,
    fontWeight: '700',
  },
});
