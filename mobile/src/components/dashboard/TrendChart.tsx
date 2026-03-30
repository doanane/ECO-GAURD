import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Line, Text as SvgText, Circle } from 'react-native-svg';
import { COLORS } from '../../constants/colors';
import { useSensorData } from '../../context/SensorDataContext';
import { SENSOR_CONFIG } from '../../constants/sensorConfig';

const W = Dimensions.get('window').width - 80;
const H = 140;
const PAD_LEFT = 36;
const PAD_TOP = 10;
const PAD_BOTTOM = 24;
const PAD_RIGHT = 10;
const CHART_W = W - PAD_LEFT - PAD_RIGHT;
const CHART_H = H - PAD_TOP - PAD_BOTTOM;

function normalize(values: number[], min: number, max: number): number[] {
  const range = max - min || 1;
  return values.map((v) => Math.max(0, Math.min(1, (v - min) / range)));
}

function toPoints(normalized: number[], chartW: number, chartH: number): string {
  if (normalized.length < 2) return '';
  return normalized
    .map((v, i) => {
      const x = PAD_LEFT + (i / (normalized.length - 1)) * chartW;
      const y = PAD_TOP + (1 - v) * chartH;
      return `${x},${y}`;
    })
    .join(' ');
}

export function TrendChart() {
  const { readingHistory } = useSensorData();

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <View style={styles.container}>
      <Svg width={W} height={H}>
        {/* Grid */}
        {gridLines.map((g) => {
          const y = PAD_TOP + (1 - g) * CHART_H;
          return (
            <Line
              key={g}
              x1={PAD_LEFT}
              y1={y}
              x2={W - PAD_RIGHT}
              y2={y}
              stroke="rgba(18,40,64,0.8)"
              strokeWidth={1}
            />
          );
        })}

        {/* Sensor lines */}
        {SENSOR_CONFIG.map((config) => {
          const history = readingHistory[config.id] || [];
          if (history.length < 2) return null;
          const norm = normalize(history, config.nominalMin * 0.7, config.nominalMax * 1.3);
          const pts = toPoints(norm, CHART_W, CHART_H);
          if (!pts) return null;
          return (
            <Polyline
              key={config.id}
              points={pts}
              fill="none"
              stroke={config.color}
              strokeWidth={1.5}
              strokeOpacity={0.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        {SENSOR_CONFIG.map((c) => (
          <View key={c.id} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: c.color }]} />
            <Text style={[styles.legendText, { color: c.color }]}>{c.id}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 2,
    borderRadius: 1,
  },
  legendText: {
    fontFamily: 'monospace',
    fontSize: 8,
  },
});
