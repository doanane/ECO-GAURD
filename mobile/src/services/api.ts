import axios from 'axios';
import { Platform } from 'react-native';

/**
 * URL resolution priority:
 * 1. EXPO_PUBLIC_API_URL from .env.local (your WiFi IP — for iPhone via Expo Go)
 * 2. localhost:8000  (fallback for local web browser dev)
 */
function resolveApiUrl(): string {
  // Web running locally: always use localhost:8000 regardless of env var.
  // The env var is for iPhone (can't use localhost), not for the browser.
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    // Web accessed from external URL (ngrok/tunnel) — use env var if set
    const fromEnv = process.env.EXPO_PUBLIC_API_URL;
    if (fromEnv) return fromEnv.trim();
    // Same-origin fallback: try port 8000 on the same host
    return `${protocol}//${hostname}:8000`;
  }

  // Native (iPhone/Android): env var is required since localhost doesn't resolve
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.trim();

  return 'http://localhost:8000';
}

const client = axios.create({
  baseURL: resolveApiUrl(),
  timeout: 30000,  // 30s — ngrok tunnels can be slow on first request
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status  = err?.response?.status ?? 'timeout';
    const message = err?.code === 'ECONNABORTED'
      ? `Request timed out — backend may be slow or unreachable`
      : (err?.message ?? 'Unknown error');
    console.warn('[API]', status, message);
    return Promise.reject(err);
  }
);

export const api = {
  getSensors:           () => client.get('/api/sensors').then((r) => r.data),
  getSensor:            (id: string) => client.get(`/api/sensors/${id}`).then((r) => r.data),
  getSensorAgentStatus: () => client.get('/api/sensors/status/summary').then((r) => r.data),
  injectLeak:           (sensorId: string, ticks = 15) =>
    client.post(`/api/sensors/${sensorId}/inject-leak?duration_ticks=${ticks}`).then((r) => r.data),
  injectAllLeaks:  (ticks = 15) =>
    client.post(`/api/sensors/inject-all-leaks?duration_ticks=${ticks}`).then((r) => r.data),
  resetAllSensors: () => client.post('/api/sensors/reset-all').then((r) => r.data),

  getLatestReadings: () => client.get('/api/readings/latest').then((r) => r.data),
  getKPISnapshot:    () => client.get('/api/readings/kpi').then((r) => r.data),
  getSensorReadings: (sensorId: string, hours = 1, limit = 200) =>
    client.get(`/api/readings/${sensorId}?hours=${hours}&limit=${limit}`).then((r) => r.data),

  getAlerts:       (active = false, hours = 48) =>
    client.get(`/api/alerts?active=${active}&hours=${hours}`).then((r) => r.data),
  getAlertCounts:  (hours = 24) =>
    client.get(`/api/alerts/counts?hours=${hours}`).then((r) => r.data),
  acknowledgeAlert: (id: number) =>
    client.post(`/api/alerts/${id}/acknowledge`).then((r) => r.data),
  resolveAlert:    (id: number, action: string) =>
    client.post(`/api/alerts/${id}/resolve`, { action_taken: action }).then((r) => r.data),

  getSensorTrend:      (sensorId: string, hours = 48) =>
    client.get(`/api/analytics/${sensorId}/trend?hours=${hours}`).then((r) => r.data),
  getSensorAnomalies:  (sensorId: string, hours = 48) =>
    client.get(`/api/analytics/${sensorId}/anomalies?hours=${hours}`).then((r) => r.data),
  getSensorStatistics: (sensorId: string, hours = 24) =>
    client.get(`/api/analytics/${sensorId}/statistics?hours=${hours}`).then((r) => r.data),
  getAllStatistics:     (hours = 24) =>
    client.get(`/api/analytics/all/statistics?hours=${hours}`).then((r) => r.data),
  getCompositeRisk:    (hours = 24) =>
    client.get(`/api/analytics/composite/risk?hours=${hours}`).then((r) => r.data),

  getPipelineNodes:    () => client.get('/api/pipeline/nodes').then((r) => r.data),
  getPipelineTopology: () => client.get('/api/pipeline/topology').then((r) => r.data),
  updateNodeStatus:    (nodeId: string, status: string) =>
    client.put(`/api/pipeline/nodes/${nodeId}/status?status=${status}`).then((r) => r.data),

  getReports:       () => client.get('/api/reports').then((r) => r.data),
  generateReport:   (reportType: string, hours = 24) =>
    client.post('/api/reports/generate', { report_type: reportType, hours }).then((r) => r.data),
  getSensorHealth:  () => client.get('/api/reports/sensor-health').then((r) => r.data),

  getHealth: () => client.get('/health').then((r) => r.data),
};

export default api;
