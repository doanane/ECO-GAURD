import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { useSensorData } from '../../context/SensorDataContext';

const W = 220;
const H = 130;
const CX = W / 2;
const CY = 108;
const R = 88;

function arcPath(): string {
  return `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;
}

function needleCoords(pct: number): { x2: number; y2: number } {
  const angle = -180 + pct * 180;
  const rad = (angle * Math.PI) / 180;
  return {
    x2: CX + (R - 12) * Math.cos(rad),
    y2: CY + (R - 12) * Math.sin(rad),
  };
}

export function LeakRiskGauge() {
  const { colors } = useTheme();
  const { leakRiskPercent, riskLevel } = useSensorData();

  const pct = leakRiskPercent / 100;
  const needle = needleCoords(pct);
  const arcD = arcPath();
  const fullLen = Math.PI * R;
  const dashOffset = fullLen * (1 - pct);

  const riskColor =
    leakRiskPercent >= 70 ? colors.red :
    leakRiskPercent >= 40 ? colors.amber :
    colors.green;

  return (
    <View style={styles.container}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.green} />
            <Stop offset="50%" stopColor={colors.amber} />
            <Stop offset="100%" stopColor={colors.red} />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Path d={arcD} fill="none" stroke={colors.border} strokeWidth={14} strokeLinecap="round" />
        {/* Gradient hint */}
        <Path d={arcD} fill="none" stroke="url(#gaugeGrad)" strokeWidth={5} strokeLinecap="round" opacity={0.3} />
        {/* Active */}
        <Path d={arcD} fill="none" stroke={riskColor} strokeWidth={14} strokeLinecap="round"
          strokeDasharray={fullLen} strokeDashoffset={dashOffset} />
        {/* Needle */}
        <Line x1={CX} y1={CY} x2={needle.x2} y2={needle.y2}
          stroke={colors.textPrimary} strokeWidth={2.5} strokeLinecap="round" opacity={0.85} />
        <Circle cx={CX} cy={CY} r={7} fill={colors.bgSurface} stroke={colors.cyan} strokeWidth={2} />
        <Circle cx={CX} cy={CY} r={3} fill={colors.cyan} />
        {/* Labels */}
        <SvgText x={14} y={H - 2} fill={colors.green} fontSize={8} fontFamily="monospace">0%</SvgText>
        <SvgText x={CX} y={14} fill={colors.amber} fontSize={8} fontFamily="monospace" textAnchor="middle">50%</SvgText>
        <SvgText x={W - 14} y={H - 2} fill={colors.red} fontSize={8} fontFamily="monospace" textAnchor="end">100%</SvgText>
      </Svg>

      <Text style={[styles.riskNum, { color: riskColor }]}>
        {leakRiskPercent.toFixed(0)}<Text style={[styles.riskPct, { color: riskColor }]}>%</Text>
      </Text>
      <Text style={[styles.riskLabel, { color: colors.textMuted }]}>COMPOSITE RISK INDEX</Text>

      <View style={[styles.levelBadge, { borderColor: colors.border, backgroundColor: colors.bgSurface2 }]}>
        <View style={[styles.levelDot, { backgroundColor: riskColor }]} />
        <Text style={[styles.levelText, { color: riskColor }]}>{riskLevel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  riskNum: {
    fontFamily: 'monospace',
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 46,
    marginTop: -8,
  },
  riskPct: {
    fontSize: 20,
    fontWeight: '700',
  },
  riskLabel: {
    fontFamily: 'monospace',
    fontSize: 8,
    letterSpacing: 3,
    marginTop: 4,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  levelDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  levelText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
