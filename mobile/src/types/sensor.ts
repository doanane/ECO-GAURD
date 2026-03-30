export type SensorStatus = 'ONLINE' | 'OFFLINE' | 'FAULT';
export type SensorType = 'PRESSURE' | 'FLOW' | 'ACOUSTIC' | 'INFRARED';

export interface Sensor {
  id: number;
  sensor_id: string;
  sensor_type: SensorType;
  name: string;
  location_label: string;
  location_km: number;
  status: SensorStatus;
  nominal_min: number;
  nominal_max: number;
  unit: string;
  description: string;
  pipeline_node_id: string;
  agent?: AgentStatus;
}

export interface AgentStatus {
  sensor_id: string;
  running: boolean;
  sequence: number;
  last_value: number;
  simulating_leak: boolean;
}
