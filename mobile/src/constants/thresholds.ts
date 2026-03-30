export const THRESHOLDS = {
  PRESSURE: {
    warning_low: 75,
    critical_low: 70,
    warning_high: 120,
    critical_high: 130,
    nominal_min: 85,
    nominal_max: 115,
    unit: 'PSI',
  },
  FLOW: {
    warning_low: 150,
    critical_low: 140,
    warning_high: 250,
    critical_high: 260,
    nominal_min: 180,
    nominal_max: 220,
    unit: 'L/min',
  },
  ACOUSTIC: {
    warning_high: 70,
    critical_high: 85,
    nominal_min: 28,
    nominal_max: 55,
    unit: 'dB',
  },
  INFRARED: {
    warning_high: 35,
    critical_high: 45,
    nominal_min: 15,
    nominal_max: 28,
    unit: 'C',
  },
  LEAK_RISK: {
    warning: 40,
    critical: 70,
    unit: '%',
  },
} as const;

export function getStatusFromValue(
  value: number,
  sensorType: 'PRESSURE' | 'FLOW' | 'ACOUSTIC' | 'INFRARED'
): 'NOMINAL' | 'WARNING' | 'CRITICAL' {
  const t = THRESHOLDS[sensorType] as any;
  if (!t) return 'NOMINAL';

  if (sensorType === 'PRESSURE' || sensorType === 'FLOW') {
    if (value <= t.critical_low || value >= t.critical_high) return 'CRITICAL';
    if (value <= t.warning_low || value >= t.warning_high) return 'WARNING';
  } else {
    if (value >= t.critical_high) return 'CRITICAL';
    if (value >= t.warning_high) return 'WARNING';
  }
  return 'NOMINAL';
}
