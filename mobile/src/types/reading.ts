export interface SensorReading {
  id?: number;
  sensor_id: string;
  sensor_type?: string;
  value: number;
  unit: string;
  timestamp: string;
  is_anomaly: boolean;
  confidence_score: number;
  leak_probability: number;
  sequence_number?: number;
  agent_state?: 'NORMAL' | 'LEAK';
  z_score?: number;
  rolling_mean?: number;
  rolling_std?: number;
}

export interface KPISnapshot {
  pressure: SensorKPI;
  flow: SensorKPI;
  acoustic: SensorKPI;
  infrared: SensorKPI;
  composite_risk: number;
  risk_level: 'NOMINAL' | 'WARNING' | 'CRITICAL';
}

export interface SensorKPI {
  value: number | null;
  unit: string;
  is_anomaly: boolean;
  leak_probability: number;
}

export interface WebSocketMessage {
  type: 'sensor_reading' | 'alert' | 'heartbeat' | 'pong';
  payload: any;
  timestamp: string;
}

export interface TrendPoint {
  timestamp: string;
  value: number;
  min?: number;
  max?: number;
  count?: number;
}
