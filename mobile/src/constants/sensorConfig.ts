import { COLORS } from './colors';

export const SENSOR_CONFIG = [
  {
    id: 'PS-001',
    type: 'PRESSURE' as const,
    label: 'Pressure Transducer',
    shortLabel: 'Pressure',
    unit: 'PSI',
    color: COLORS.CYAN,
    nominalMin: 85,
    nominalMax: 115,
    description: 'Inline piezoelectric pressure transducer at Km 12.4. Detects pressure anomalies indicating pipe breaches.',
    locationKm: 12.4,
    locationLabel: 'Sector 7 — Km 12.4',
  },
  {
    id: 'FS-002',
    type: 'FLOW' as const,
    label: 'Turbine Flow Meter',
    shortLabel: 'Flow Rate',
    unit: 'L/min',
    color: COLORS.AMBER,
    nominalMin: 180,
    nominalMax: 220,
    description: 'Industrial turbine flow meter at Km 22.1. Sustained deviations indicate material loss events.',
    locationKm: 22.1,
    locationLabel: 'Sector 7 — Km 22.1',
  },
  {
    id: 'ACS-003',
    type: 'ACOUSTIC' as const,
    label: 'Acoustic Emission Sensor',
    shortLabel: 'Acoustic',
    unit: 'dB',
    color: COLORS.GREEN,
    nominalMin: 28,
    nominalMax: 55,
    description: 'Wide-band piezoelectric acoustic sensor at Km 35.7. Detects high-frequency stress waves from micro-fractures.',
    locationKm: 35.7,
    locationLabel: 'Sector 7 — Km 35.7',
  },
  {
    id: 'IR-004',
    type: 'INFRARED' as const,
    label: 'Infrared Thermographic Array',
    shortLabel: 'Infrared',
    unit: 'C',
    color: COLORS.MAGENTA,
    nominalMin: 15,
    nominalMax: 28,
    description: 'Long-wave IR thermographic array at Km 44.2. Detects subsurface heat zones from pressurized fluid contact.',
    locationKm: 44.2,
    locationLabel: 'Sector 7 — Km 44.2',
  },
] as const;

export type SensorId = 'PS-001' | 'FS-002' | 'ACS-003' | 'IR-004';
export type SensorType = 'PRESSURE' | 'FLOW' | 'ACOUSTIC' | 'INFRARED';
