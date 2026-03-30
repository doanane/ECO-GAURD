# EcoGuard — Quick Start & Complete Demo Guide

> Pipeline Integrity Monitoring System · Expo SDK 54 · FastAPI · WebSocket

---

## How to Run

### Step 1 — Start the Backend
```bash
cd backend
python main.py
# Backend starts at http://localhost:8000
# You will see: "4 sensor agents started"
```

### Step 2 — Start the Mobile App
```bash
cd mobile
npx expo start --tunnel     # iPhone over internet (ngrok)
# OR
npx expo start --lan        # iPhone on same WiFi (faster, recommended)
```

### Step 3 — Open on iPhone
1. Install **Expo Go** from the App Store
2. Open Expo Go → **Scan QR Code**
3. Point at the QR shown in the terminal
4. Wait ~15s for the bundle to load

### Step 4 — Open in Browser
Visit `http://localhost:8081` in Chrome/Edge while backend is running.

---

## Connection Setup (iPhone via same WiFi)

In `mobile/.env.local`:
```
EXPO_PUBLIC_API_URL=http://192.168.X.X:8000
EXPO_PUBLIC_WS_URL=ws://192.168.X.X:8000/ws
```
Replace `192.168.X.X` with your PC's WiFi IP (run `ipconfig` in Command Prompt, look for "Wireless LAN adapter Wi-Fi" IPv4 Address).

---

## App Overview

EcoGuard monitors a **48 km underground water pipeline** using 4 physical sensors and 4 autonomous AI agents. It detects leaks in real-time, raises alerts, visualizes data, and generates reports.

| Tab | Purpose |
|-----|---------|
| Dashboard | Live overview — KPIs, gauges, event log |
| Analytics | Historical charts with anomaly detection |
| Alerts | Active and historical leak alerts |
| Map | Pipeline network node topology |
| Sensors | Per-sensor live data and AI agent state |
| Reports | Generated health and incident reports |

---

## Page-by-Page Demo Guide

---

### TAB 1 — DASHBOARD

**What you see immediately:**
- **ECOGUARD** header with `LIVE` badge (green = WebSocket connected, red = offline)
- **DARK / LIGHT / SYSTEM** toggle button at top-right — tap to switch the entire app theme

**Action Row (top of page)**

| Button | What it does |
|--------|-------------|
| `SIMULATE LEAK` (red border) | Injects a fake leak signal into all 4 sensors for ~30 seconds. Pressure drops, flow drops, acoustic rises, IR rises. Watch all other pages react. |
| `RESET SYSTEM` (gray border) | Clears the simulated leak. All sensors return to normal values within 5–10 seconds. |

**KPI Cards (4 colored boxes)**

Each card shows one live sensor reading. Updates every 2 seconds via WebSocket.

| Card | Color | What it means |
|------|-------|--------------|
| Pressure | Cyan | Pipeline pressure in PSI. Normal: 85–115 PSI. Drop below 85 = possible leak. |
| Flow Rate | Amber | Water flow in L/min. Normal: 180–220 L/min. Drop = material loss event. |
| Acoustic | Green | Stress wave emission in dB. Normal: 28–55 dB. Spike = micro-fracture in pipe. |
| Infrared | Magenta | Surface temperature in °C. Normal: 15–28 °C. Rise = fluid leaking underground. |

**Composite Leak Risk Gauge**

A circular progress ring showing overall risk 0–100%.
- **Green (0–40%)** = NOMINAL — all sensors in normal range
- **Amber (40–70%)** = WARNING — one or more sensors elevated
- **Red (70–100%)** = CRITICAL — active leak likely

The percentage is a **weighted score**: Pressure 35% + Flow 30% + Acoustic 25% + IR 10%.

**Sensor Array Grid**

4 small cards showing each sensor's ID, current value, and status badge.
- `NOMINAL` = value in normal range
- `WARNING` = value outside normal range but not critical
- `CRITICAL` = value at alert threshold

**Trend Chart**

A real-time line chart showing the last 60 pressure readings. Watch it animate as new WebSocket data arrives.

**Event Log**

Rolling list of the last 10 system events (agent decisions, alerts raised, resets). Most recent event at the top.

**Demo to try:**
1. Watch the Dashboard for 30 seconds — see values updating every 2s
2. Tap `SIMULATE LEAK`
3. Watch: Leak Risk jumps to >70%, status turns CRITICAL, Event Log shows "LEAK DETECTED"
4. Switch to Alerts tab — a new CRITICAL alert appears in real time
5. Switch to Sensors tab — ACS-003 and IR-004 show WARNING or CRITICAL state
6. Come back and tap `RESET SYSTEM`

---

### TAB 2 — ANALYTICS

**What it shows:** Historical statistical analysis for all 4 sensors over a chosen time window.

**DATA WINDOW selector (top row)**

| Button | Meaning |
|--------|---------|
| `1H` | Last 1 hour of data |
| `6H` | Last 6 hours |
| `24H` | Last 24 hours (default) |
| `48H` | Last 48 hours |

Tap any button to reload all 4 sensor cards with data from that time range.

**Summary Banner (below selector)**

- `ALL SENSORS NOMINAL — No anomalies in the last 24h` (green) = everything is fine
- `N ANOMALIES detected across X sensors in the last 24h` (red) = issues found

**Sensor Analysis Cards**

Each of the 4 sensor cards contains:

| Section | What it shows |
|---------|--------------|
| **MEAN ± STD DEV** | Average value ± standard deviation over the window. Lower std dev = more stable sensor. |
| **MIN / MAX** | Lowest and highest recorded values in the window. |
| **Trend arrow ↑ ↓ →** | Compares second half of window to first half. ↑ = rising trend, ↓ = falling, → = stable. % shows magnitude. |
| **Chart with green band** | Line chart of all readings. The **green shaded zone** is the normal operating range. Points inside = healthy. |
| **Red dots on chart** | Anomaly points — readings flagged as statistically unusual (Z-score detection). |
| **ANOMALY COUNT footer** | Tap to expand a list of exact timestamps when anomalies occurred. |

**Demo to try:**
1. Select `24H` window
2. Tap `SIMULATE LEAK` on Dashboard, wait 20s, reset it
3. Switch back to Analytics and pull down to refresh
4. You should see red dots appear on the Pressure and Flow charts
5. The summary banner will show anomalies detected

---

### TAB 3 — ALERTS

**What it shows:** All pipeline alerts, past and present. Updates in real time via WebSocket.

**Stats Row (top 3 boxes)**

| Box | What it shows |
|-----|--------------|
| `CRITICAL` (red number) | Count of CRITICAL severity alerts in the last 48 hours |
| `WARNINGS` (amber number) | Count of WARNING severity alerts |
| `UNACKED` (red or green) | Count of alerts not yet acknowledged by an operator |

**Filter Chips**

Tap a chip to filter the alert list:
- `ALL` — show every alert
- `ACTIVE` — only currently active (unresolved) alerts
- `CRITICAL` — only CRITICAL severity
- `WARNING` — only WARNING severity
- `UNACKED` — only unacknowledged

**Alert Cards**

Each alert card shows:
- **Colored left border**: Red = CRITICAL, Amber = WARNING
- **Sensor ID** and **timestamp** when the alert was raised
- **Alert message**: e.g. "Pressure reading 72.3 PSI is critically below threshold 85 PSI"
- **ACKNOWLEDGED** chip (gray): shown if an operator has seen it
- **Expand button (▼)**: tap to open action options

**Expanded Alert Actions**

| Action | What it does in the system |
|--------|--------------------------|
| `Acknowledge` | Marks the alert as seen. Removes it from the UNACKED count. |
| `Dispatch Maintenance` | Logs that a crew has been sent. Resolves the alert. |
| `False Positive` | Marks as incorrect detection. Resolves the alert. |
| `Monitoring` | Keeps alert open but notes it is being watched. |

**Demo to try:**
1. Tap `SIMULATE LEAK` on Dashboard
2. Switch to Alerts — watch a new CRITICAL alert appear instantly (no refresh needed)
3. Tap the `▼` on that alert
4. Tap `Acknowledge` — the UNACKED count drops
5. Tap `Dispatch Maintenance` — alert is resolved and removed from ACTIVE filter

---

### TAB 4 — MAP (Pipeline Map)

**What it shows:** A node-graph visualization of the 48 km pipeline with 9 key nodes.

**Stats Row (top)**

| Stat | What it means |
|------|--------------|
| `TOTAL LENGTH` | 48 km total monitored pipeline |
| `NODES` | Count of nodes currently loaded from the backend |
| `LEAK RISK %` | Same composite risk from Dashboard — shown here for quick reference |

**Pipeline Map SVG**

The large map area shows the pipe network:
- **Lines** = pipe segments connecting nodes. Color shows status:
  - Teal = normal flow
  - Amber = warning condition
  - Red = critical / suspected leak
- **Circles** = nodes. Size and letter indicate type:
  - `P` = Pump station
  - `J` = Junction (pipe split)
  - `V` = Valve (flow control point)
  - `E` = Endpoint (consumer or reservoir)
  - `S` = Sensor point (where our 4 sensors are mounted)
- **Tap a node** to see its details in the info card below the map

**Node Detail Card** (appears on tap)

Shows: Node ID, type, location (km marker), current status, and linked sensor ID if it is a sensor point.

**Sensor Legend** (bottom)

4 colored strips showing which sensor is at which km marker on the pipeline.

**Demo to try:**
1. Tap `SIMULATE LEAK`
2. Watch the pipe segments near sensor nodes change color to red/amber
3. Tap sensor node `S` to see its status change to CRITICAL
4. Pull down to refresh topology from backend

---

### TAB 5 — SENSORS

**What it shows:** Deep per-sensor view with live visualizations and AI agent state.

**Page Header**

- `SENSOR ARRAY` = page title
- `4 AUTONOMOUS AGENTS · SECTOR 7 · 48 KM PIPELINE` = system context
- `?` button (top right) = opens the demo guide modal

**PS-001 — Pressure Transducer (Cyan)**

- **Header**: ID, live dot (pulses with each reading), sensor name, location, NOMINAL/WARNING/CRITICAL badge, NORMAL/MONITORING/LEAK agent pill
- **Half-circle gauge**: Arc spans 70–130 PSI full range. Cyan arc fills from left to show current value. Green zone = normal range (85–115 PSI). Tick marks at 70, 92, 100, 115, 130 PSI.
- **Stats grid**: CURRENT VALUE in PSI · NORMAL RANGE (85–115) · AGENT STATE (AI decision) · CONFIDENCE (% certainty of the decision)
- **LEAK PROBABILITY bar**: 20-segment bar. Green = low risk, Amber = warning, Red = critical
- **Description**: Technical explanation of the sensor hardware

**FS-002 — Turbine Flow Meter (Amber)**

- **Bar chart**: 28 bars = last 28 readings. Each bar height = flow rate. Taller = more flow. Green dashed band = normal range 180–220 L/min. Bars fade from light (old) to full amber (latest).

**ACS-003 — Acoustic Emission Sensor (Green)**

- **Waveform chart**: 36-point oscilloscope line showing acoustic emission in dB. Dashed red line = threshold (70 dB). Spikes above = stress wave events.

**IR-004 — Infrared Thermographic Array (Magenta)**

- **Heat bars**: 28 color-coded bars showing surface temperature history.
  - Teal bars = cool/normal (< 25°C)
  - Amber bars = warm/warning (25–35°C)
  - Red bars = hot/critical (> 35°C)

**AI Agent States Explained**

| State | What the agent is doing |
|-------|------------------------|
| `NORMAL` | Readings within expected range. No anomaly detected. |
| `MONITORING` | One or more readings are elevated. Agent is watching closely. |
| `LEAK` | Agent has determined a leak event is occurring. Alert generated. |

**Demo to try:**
1. Tap `SIMULATE LEAK` on Dashboard
2. Switch to Sensors
3. Watch PS-001 gauge needle drop toward the left (low pressure)
4. FS-002 bars shrink (lower flow)
5. ACS-003 line shows spikes above the threshold
6. IR-004 bars turn amber/red (rising temperature)
7. Agent STATE pills change from NORMAL → MONITORING → LEAK

---

### TAB 6 — REPORTS

**What it shows:** Auto-generated health and incident reports for the pipeline system.

**Sensor Health — 24H**

A table showing 24-hour uptime for each of the 4 sensors:
- **SENSOR** column = sensor ID (PS-001, FS-002, ACS-003, IR-004)
- **UPTIME BAR** = horizontal bar. Full green = no anomalies. Partial = some anomalous readings.
- **PCT** column = percentage of readings that were anomaly-free
- A reading count is shown per sensor

**Generate Report section**

5 report type buttons. Tap any to generate and save a report:

| Button | What it generates |
|--------|-----------------|
| `Daily Summary` | 24-hour overview of all sensor readings and events |
| `Weekly Report` | 7-day trend analysis and anomaly summary |
| `Incident Report` | Details of the last detected leak/alert events |
| `Compliance Export` | 30-day data export for regulatory filing |
| `Sensor Health` | Detailed health metrics for each sensor |

**Reports List**

Shows previously generated reports. Each entry shows:
- Report type name
- Timestamp when generated
- Time range covered (e.g. "Last 24 hours")
- Status: `GENERATED` or `FAILED`

**Demo to try:**
1. Tap `Daily Summary` button — watch it generate
2. See the new entry appear in the Reports List
3. Pull down to refresh the sensor health bars
4. After simulating a leak, generate an `Incident Report` to capture it

---

## Understanding the Real-Time System

```
Backend                    iPhone App
  │                            │
  ├─ 4 Sensor Agents           │
  │  (run every 2 seconds)     │
  │   └─ Generate readings     │
  │   └─ Z-score anomaly check │
  │   └─ Update agent state    │
  │                            │
  ├─ WebSocket Server  ────────► WebSocket Client
  │   └─ Broadcasts every      │   └─ Updates Dashboard KPIs
  │      sensor reading        │   └─ Animates gauges
  │      in real time          │   └─ Updates Sensors page
  │                            │
  ├─ REST API  ─────────────── ► REST Calls (on load/refresh)
  │   └─ /api/readings/latest  │   └─ Analytics charts
  │   └─ /api/alerts           │   └─ Alert list
  │   └─ /api/pipeline         │   └─ Pipeline map
  │   └─ /api/reports          │   └─ Reports list
  │                            │
  └─ SQLite Database           │
     └─ Persists all readings  │
     └─ Persists all alerts    │
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `OFFLINE` badge at top | WebSocket not connected | Check backend is running on port 8000 |
| `[API Error] timeout` | Backend slow or unreachable | Check `EXPO_PUBLIC_API_URL` in `.env.local` |
| Pages show empty data | REST API calls failed | Pull down to refresh; check backend is running |
| Tunnel fails to start | ngrok issue | Use `--lan` mode instead (same WiFi) |
| iPhone can't load | Wrong IP in `.env.local` | Run `ipconfig` and update IPv4 address |
| White screen on start | JS bundle error | Check terminal for compile errors |

---

## Architecture Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend API | FastAPI (Python) | REST endpoints + WebSocket server |
| Database | SQLite + SQLAlchemy | Persist readings, alerts, reports |
| Sensor Agents | Python asyncio | Simulate sensor data + Z-score anomaly detection |
| Mobile App | React Native + Expo | Cross-platform iPhone/web UI |
| Navigation | Expo Router v6 | File-based tab routing |
| Real-time | WebSocket | Push sensor readings every 2 seconds |
| State | React Context | Theme, sensor data, alerts, WebSocket |
| Charts | react-native-svg | Custom SVG gauges, bars, waveforms |

---

## Files to Study

| File | What it teaches |
|------|----------------|
| `backend/app/agents/base_agent.py` | How autonomous agents work |
| `backend/app/agents/pressure_agent.py` | Pressure sensor agent logic |
| `backend/app/services/leak_detection_service.py` | Weighted risk scoring formula |
| `backend/app/api/websocket.py` | WebSocket broadcast server |
| `mobile/src/services/websocketClient.ts` | WebSocket client connection |
| `mobile/src/context/ThemeContext.tsx` | Global dark/light theme system |
| `mobile/src/app/(tabs)/dashboard.tsx` | Main dashboard screen |
| `mobile/src/app/(tabs)/sensors.tsx` | Sensor visualizations (gauges, charts) |
| `mobile/src/constants/thresholds.ts` | Alert threshold values for all 4 sensors |
