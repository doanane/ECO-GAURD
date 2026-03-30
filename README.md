# EcoGuard Technologies — Pipeline Integrity Platform

Real-time pipeline leakage detection system with autonomous sensor agents, WebSocket streaming, and a mobile dashboard.

## Architecture

- **Backend**: FastAPI + Python — 4 autonomous sensor agents running as async tasks
- **Mobile**: React Native (Expo) — live-updating dashboard via WebSocket
- **Data**: SQLite (dev) / PostgreSQL-ready
- **Real-time**: WebSocket at `/ws/pipeline` streams all sensor readings and alerts

## Quick Start

### 1. Start the Backend
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
Server runs at `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- WebSocket: `ws://localhost:8000/ws/pipeline`

### 2. Start the Mobile App
```bash
cd mobile
npm install
npx expo start
```
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code with Expo Go on a physical device

**Note**: Update `mobile/app.json` → `extra.apiUrl` and `extra.wsUrl` to match your machine's IP address if running on a physical device (e.g., `http://192.168.1.100:8000`).

## Sensor Agents

| ID | Type | Unit | Nominal Range | Leak Detection Method |
|----|------|------|---------------|----------------------|
| PS-001 | Pressure | PSI | 85–115 | Pressure drop detection via z-score |
| FS-002 | Flow Rate | L/min | 180–220 | Flow deviation percentage tracking |
| ACS-003 | Acoustic | dB | 28–55 | Spike + sustained elevation detection |
| IR-004 | Infrared | C | 15–28 | Rate-of-change heat zone analysis |

## Features

- **Dashboard** — KPI cards, composite leak risk gauge, sensor grid, live trend charts, event log
- **Analytics** — Time-windowed trend analysis with anomaly markers per sensor
- **Alerts** — Active alert management with 4 response action types
- **Pipeline Map** — Interactive SVG topology with live node status heat overlay
- **Sensors** — Per-sensor visualization (gauge, waveform, bar chart, heat map)
- **Reports** — Sensor health table + on-demand report generation

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/sensors | List all sensors + agent status |
| POST | /api/sensors/{id}/inject-leak | Trigger demo leak event |
| POST | /api/sensors/inject-all-leaks | Trigger all sensors |
| POST | /api/sensors/reset-all | Reset all agents |
| GET | /api/readings/kpi | KPI snapshot + composite risk |
| GET | /api/alerts?active=true | Active alerts |
| POST | /api/alerts/{id}/resolve | Resolve with action |
| GET | /api/analytics/{id}/trend | Time-bucketed trend |
| GET | /api/pipeline/topology | Full graph topology |
| POST | /api/reports/generate | Generate a report |
| WS | /ws/pipeline | Live sensor + alert stream |
"# ECO-GAURD" 
