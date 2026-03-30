export type NodeType = 'JUNCTION' | 'VALVE' | 'PUMP' | 'ENDPOINT' | 'SENSOR_POINT';
export type NodeStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'ISOLATED';

export interface PipelineNode {
  id: number;
  node_id: string;
  label: string;
  x_position: number;
  y_position: number;
  node_type: NodeType;
  status: NodeStatus;
  connected_to: string[];
  sensor_id: string;
  km_marker: number;
}

export interface PipelineTopology {
  nodes: PipelineNode[];
  edges: Array<{ from: string; to: string }>;
}
