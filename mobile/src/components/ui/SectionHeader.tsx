import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  title: string;
  subtitle?: string;
  accentColor?: string;
  right?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, accentColor, right }: Props) {
  const { colors } = useTheme();
  const color = accentColor || colors.cyan;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border, backgroundColor: 'rgba(0,0,0,0.12)' }]}>
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  accent: {
    width: 3,
    height: 24,
    borderRadius: 2,
    marginRight: 10,
  },
  textBlock: { flex: 1 },
  title: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 8,
    marginTop: 2,
  },
  right: { marginLeft: 8 },
});
