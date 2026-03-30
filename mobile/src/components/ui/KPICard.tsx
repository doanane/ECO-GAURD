import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { LiveIndicator } from './LiveIndicator';

interface Props {
  label: string;
  value: string | number;
  unit: string;
  accentColor: string;
  status?: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  isLive?: boolean;
  sublabel?: string;
}

export function KPICard({ label, value, unit, accentColor, status = 'NOMINAL', isLive = false, sublabel }: Props) {
  const { colors } = useTheme();

  const displayColor =
    status === 'CRITICAL' ? colors.red :
    status === 'WARNING' ? colors.amber :
    accentColor;

  return (
    <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
      <View style={[styles.topBar, { backgroundColor: displayColor }]} />
      <View style={styles.body}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
          {isLive && <LiveIndicator color={colors.green} size={6} />}
        </View>
        <Text style={[styles.value, { color: displayColor }]}>
          {value !== null && value !== undefined ? value : '--'}
        </Text>
        <Text style={[styles.unit, { color: colors.textMuted }]}>{unit}</Text>
        {sublabel ? <Text style={[styles.sublabel, { color: colors.textMuted }]}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 4,
    minHeight: 90,
  },
  topBar: {
    height: 3,
  },
  body: {
    padding: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 8,
    letterSpacing: 1.5,
  },
  value: {
    fontFamily: 'monospace',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 28,
  },
  unit: {
    fontFamily: 'monospace',
    fontSize: 9,
    marginTop: 3,
  },
  sublabel: {
    fontFamily: 'monospace',
    fontSize: 7,
    marginTop: 2,
  },
});
