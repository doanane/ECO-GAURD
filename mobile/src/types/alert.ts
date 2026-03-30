export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type AlertType =
  | 'PRESSURE_DROP'
  | 'PRESSURE_SPIKE'
  | 'FLOW_DEVIATION'
  | 'ACOUSTIC_SPIKE'
  | 'IR_HOTSPOT'
  | 'SENSOR_OFFLINE'
  | 'COMPOSITE_RISK';

export type ActionType =
  | 'ISOLATE_VALVE'
  | 'DISPATCH_FIELD_TEAM'
  | 'REDUCE_PRESSURE'
  | 'NOTIFY_HQ'
  | 'NONE';

export interface Alert {
  id: number;
  sensor_id: string;
  severity: AlertSeverity;
  alert_type: AlertType;
  message: string;
  value_at_trigger: number;
  threshold_value: number;
  timestamp: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  action_taken: ActionType;
  resolved: boolean;
  resolved_at: string | null;
  location_label: string;
}
