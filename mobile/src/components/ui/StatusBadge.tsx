import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type StatusLevel = 'NOMINAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'ONLINE' | 'INFO';

const BADGE_STYLES: Record<StatusLevel, { bg: string; text: string; border: string }> = {
  NOMINAL:  { bg: 'rgba(0,230,118,0.10)',  text: '#00e676', border: 'rgba(0,230,118,0.25)' },
  WARNING:  { bg: 'rgba(255,171,0,0.10)',  text: '#ffab00', border: 'rgba(255,171,0,0.25)' },
  CRITICAL: { bg: 'rgba(255,23,68,0.12)',  text: '#ff1744', border: 'rgba(255,23,68,0.30)' },
  OFFLINE:  { bg: 'rgba(45,85,119,0.12)',  text: '#6a9bbe', border: 'rgba(45,85,119,0.25)' },
  ONLINE:   { bg: 'rgba(0,230,118,0.10)',  text: '#00e676', border: 'rgba(0,230,118,0.25)' },
  INFO:     { bg: 'rgba(0,229,255,0.08)',  text: '#00e5ff', border: 'rgba(0,229,255,0.20)' },
};

interface Props {
  status: StatusLevel;
  label?: string;
  small?: boolean;
}

export function StatusBadge({ status, label, small = false }: Props) {
  const cfg = BADGE_STYLES[status] ?? BADGE_STYLES.INFO;

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: cfg.bg,
        borderColor: cfg.border,
        paddingHorizontal: small ? 6 : 9,
        paddingVertical: small ? 2 : 3,
      },
    ]}>
      <Text style={[styles.text, { color: cfg.text, fontSize: small ? 7 : 8 }]}>
        {label ?? status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
