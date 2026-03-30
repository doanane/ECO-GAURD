# EcoGuard — Complete Reference Guide

> **Pipeline Integrity Monitoring System**
> Expo SDK 54 · React Native 0.81.5 · FastAPI · WebSocket · SQLite · expo-av

---

## 1. How to Start the System

### Step 1 — Start the Backend
```bash
cd backend
python main.py
```
You will see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     4 sensor agents started
```
The backend must be running before the app can receive data.

### Step 2 — Start the Mobile App
```bash
cd mobile
npx expo start --tunnel   # iPhone/Android via internet (ngrok)
# OR
npx expo start --lan      # same WiFi (faster, recommended for development)
```

### Step 3 — Connect Your Phone
1. Install **Expo Go** from the App Store (iPhone) or Play Store (Android)
2. Open Expo Go → tap **Scan QR Code**
3. Scan the QR code shown in the terminal
4. Wait ~15 seconds for the JavaScript bundle to load
5. You should see the Dashboard with live sensor data

### Step 4 — Open in Browser (Web)
While backend is running, visit `http://localhost:8081` in Chrome/Edge.

---

## 2. Network Configuration (iPhone/Android on same WiFi)

Edit `mobile/.env.local` with your PC's WiFi IP:
```
EXPO_PUBLIC_API_URL=http://192.168.X.X:8000
EXPO_PUBLIC_WS_URL=ws://192.168.X.X:8000/ws
```

Find your IP: run `ipconfig` → look for **Wireless LAN adapter Wi-Fi** → **IPv4 Address**.

---

## 3. What EcoGuard Does

EcoGuard monitors a **48 km underground water pipeline** using 4 real-time sensors and 4 autonomous AI agents. The system:
- Collects sensor readings every 2 seconds via WebSocket
- Runs Z-score anomaly detection on every reading
- Computes a composite leak-risk score across all 4 sensors
- Raises automatic alerts when thresholds are exceeded
- **Plays an audible alert tone** when a CRITICAL alert arrives
- Stores all data in SQLite for historical analysis and reporting

---

## 4. Alert Sound System

EcoGuard plays a 3-beep alert tone whenever a new **CRITICAL** alert arrives in real time.

| Platform | How the sound works |
|----------|-------------------|
| iPhone / Android | Plays `alert.wav` via `expo-av`. Works even when phone is on silent (iOS silent switch is bypassed). |
| Web browser | Synthesises a 3-beep tone using the Web Audio API (no file needed). |

**Beep pattern:** 880 Hz · 880 Hz · 1100 Hz (short · short · long) — same as industrial alarm convention.

### Testing the Sound
On the **Dashboard** tab, tap the **TEST SOUND** button (amber, with speaker icon). This plays the alert tone immediately without needing to trigger a real alert. Use this to confirm your device volume is up and the sound is working before a real event.

### Testing End-to-End
1. Make sure device volume is turned up
2. Tap **TEST SOUND** — you should hear three beeps
3. Tap **SIMULATE LEAK** — after 5–10 seconds the system raises CRITICAL alerts and the tone plays automatically
4. Check the Alerts tab to see the live alert card

---

## 5. Navigation — Tab Bar

The bottom tab bar has 6 tabs. The active tab is highlighted in its accent color.

| Tab | Accent | What it shows |
|-----|--------|--------------|
| Dashboard | Cyan | Live overview — KPIs, risk gauge, event log |
| Analytics | Magenta | Historical charts with anomaly detection |
| Alerts | Red | Real-time and historical pipeline alerts |
| Map | Teal | Pipeline network topology with node status |
| Sensors | Green | Per-sensor live visualizations + AI agent state |
| Reports | Amber | Generated health and incident reports |

The **header** shows:
- **App logo** (gear icon) on the left
- **ECOGUARD** app name in cyan
- Active **page name** below app name (e.g. `ANALYTICS`, `SENSORS`)
- **LIVE / SYNC / OFF** connection badge — green = WebSocket active, red = disconnected
- **DARK / LIGHT / SYSTEM** theme toggle button

---

## 6. Page-by-Page Detailed Guide

---

### Page 1 — DASHBOARD

The Dashboard is the home screen. It gives you a complete real-time overview of the entire pipeline system in a single scrollable page.

#### Header Area
At the very top of the screen you see:
- **SENSORS** tab highlighted green when you are viewing sensors, **ANALYTICS** in magenta, etc.
- The **LIVE** badge turns red and shows **SYNC** or **OFF** if the WebSocket drops. This means data is no longer updating in real time.
- The **theme toggle** (top-right, next to the connection badge) cycles: DARK → LIGHT → SYSTEM. SYSTEM follows your phone's dark/light mode setting. All 6 pages change instantly.

#### Action Row (4 buttons across the top)

**SIMULATE LEAK** (red border)
Injects an artificial leak signal into all 4 sensor agents simultaneously. The agents respond as if a real leak is occurring: pressure drops, flow drops, acoustic rises, infrared temperature rises. This simulation lasts approximately 30 seconds, after which values return to normal. During simulation:
- The composite risk gauge climbs toward CRITICAL (red zone)
- New CRITICAL alerts appear on the Alerts tab in real time
- The 3-beep alert tone plays automatically
- All sensor charts on the Sensors and Analytics tabs show the anomalous readings

**RESET SYSTEM** (gray border)
Immediately ends any active simulation and returns all sensor agents to their normal (nominal) operating state. Does not delete historical data, alerts, or reports.

**TEST SOUND** (amber border, speaker icon)
Plays the 3-beep alert tone immediately. Use this to verify your volume is up and the sound system is working on your device before a real event occurs.

**? (help icon)**
Opens the Dashboard demo guide — a modal popup that explains each section of the page with type badges (CLICKABLE, INDICATOR, VISUAL, DATA, ALERT) and examples.

#### KPI Cards (2 × 2 grid)

Four boxes showing the latest live reading from each sensor. These update automatically every time a sensor reading arrives via WebSocket (approximately every 2 seconds).

| Card | Color | Sensor | Normal Range | What a drop/spike means |
|------|-------|--------|-------------|------------------------|
| Pressure | Cyan | PS-001 | 85–115 PSI | Drop below 85 PSI = possible pipe breach |
| Flow Rate | Amber | FS-002 | 180–220 L/min | Drop = material loss event (fluid escaping) |
| Acoustic | Green | ACS-003 | 28–55 dB | Spike above 55 dB = stress wave / micro-fracture |
| Infrared | Magenta | IR-004 | 15–28 °C | Rise above 28 °C = warm fluid leaking underground |

Each card shows:
- Sensor label and value with unit
- Status badge: `NOMINAL` (green) / `WARNING` (amber) / `CRITICAL` (red)
- A live pulse dot indicating the WebSocket connection is active

#### Composite Leak Risk Gauge

A large circular progress ring showing the overall system risk score from 0 to 100%.

The percentage is computed using **weighted sensor contributions**:
- Pressure sensor (PS-001): **35%** weight — most critical indicator
- Flow sensor (FS-002): **30%** weight — second most critical
- Acoustic sensor (ACS-003): **25%** weight
- Infrared sensor (IR-004): **10%** weight — supplementary heat detection

| Risk Level | Color | Range | Meaning |
|-----------|-------|-------|---------|
| NOMINAL | Green | 0–40% | All sensors operating normally |
| WARNING | Amber | 40–70% | One or more sensors show elevated readings |
| CRITICAL | Red | 70–100% | Active leak likely — immediate attention required |

#### Sensor Array Grid

Four smaller cards below the gauge showing each sensor's ID (PS-001, FS-002, etc.), current reading value with unit, and the same NOMINAL/WARNING/CRITICAL status badge. This lets you quickly identify which sensor is the source of any warning.

#### Trend Chart

A real-time line chart showing the last 60 pressure readings in chronological order (left = oldest, right = newest). The chart updates live as new WebSocket data arrives. Watch the line dip sharply when you tap Simulate Leak, then recover when you Reset.

#### Event Log

A scrollable list of the most recent 10 system events with timestamps. Events include:
- `Agent state changed: PS-001 → LEAK` — an AI agent detected an anomaly
- `Alert raised: CRITICAL — Pressure drop detected` — an alert was generated
- `Simulation started` / `System reset` — user actions
- `WebSocket connected` / `WebSocket reconnecting` — connection events

---

### Page 2 — ANALYTICS

The Analytics page shows historical statistical analysis for all 4 sensors over a user-selected time window. Unlike the Dashboard (which shows the current moment), Analytics shows trends, statistics, and anomaly patterns over time.

#### Data Window Selector (top row)

Four buttons that control the time range of all charts and statistics below:

| Button | Hours of data | Best for |
|--------|-------------|---------|
| `1H` | Last 1 hour | Immediate recent events |
| `6H` | Last 6 hours | Shift-level view |
| `24H` | Last 24 hours (default) | Daily health check |
| `48H` | Last 48 hours | Multi-day trend analysis |

Tap any button to reload all 4 sensor analysis cards with fresh data for that window. The page pulls data from the backend REST API (not WebSocket), so there may be a 1–2 second loading delay.

#### Summary Banner

The wide banner below the window selector immediately tells you the health status for the selected time window:

- **Green banner** — `ALL SENSORS NOMINAL — No anomalies in the last 24h` — everything is fine
- **Red banner** — `N ANOMALIES detected across X sensors in the last 24h` — issues found, check the cards below

#### Sensor Analysis Cards (4 cards, one per sensor)

Each card covers one sensor and contains:

**Statistics Row**

| Stat | What it means |
|------|--------------|
| MEAN | Average reading over the selected window. Compare to the normal range to see if the sensor is trending up or down overall. |
| STD DEV | Standard deviation — how much the readings vary. Low std dev = very stable. High std dev = erratic readings (could indicate mechanical problems or a slowly developing leak). |
| MIN | Lowest single reading recorded in the window. |
| MAX | Highest single reading recorded in the window. |

**Trend Arrow**

The arrow and percentage next to MEAN shows whether values are trending up or down:
- `↑ +5.3%` — values in the second half of the window are 5.3% higher than the first half
- `↓ -8.1%` — values are falling (e.g. pressure dropping over time is a warning sign)
- `→ 0.2%` — essentially flat / stable

**Chart with Green Band**

A line chart plotting all readings over the time window. The **green shaded zone** shows the normal operating range for that sensor. Points within the zone = healthy. The x-axis is time (oldest left → newest right).

**Red Dots on the Chart**

Red circular dots mark individual readings that were flagged as **anomalies** by the Z-score detection algorithm. A reading is anomalous when its Z-score exceeds 2.0 standard deviations from the running mean. These are the exact moments the AI agents detected unusual behaviour.

**Anomaly Count Footer**

A tappable row at the bottom of each card showing the total anomaly count. Tap it to expand a detailed list of exact timestamps when each anomaly occurred. Useful for correlating with external events (e.g. "anomaly at 14:32 — that's when I ran the simulation").

**How to use Analytics effectively:**
1. Select `24H` window to check the last day's health
2. If the summary banner shows anomalies, open each sensor card and tap the anomaly footer
3. Check the timestamps — do multiple sensors show anomalies at the same time? That suggests a real event
4. Use `48H` to see if the system had any overnight incidents

---

### Page 3 — ALERTS

The Alerts page shows all pipeline alerts — both currently active ones and historical resolved ones. New CRITICAL alerts appear here in real time via WebSocket (no manual refresh needed). The 3-beep sound plays at the same moment.

#### Statistics Row (top 3 boxes)

Three summary cards at the top of the page:

| Box | Color | What it counts |
|-----|-------|---------------|
| CRITICAL | Red number | CRITICAL severity alerts in the last 48 hours |
| WARNINGS | Amber number | WARNING severity alerts in the last 48 hours |
| UNACKED | Red or green | Alerts not yet acknowledged by any operator. Green = all seen. Red = action needed. |

#### Filter Chips

A row of filter buttons below the stats. Tap any chip to filter the list:

| Chip | Shows |
|------|-------|
| `ALL` | Every alert (active + resolved) |
| `ACTIVE` | Only currently unresolved alerts |
| `CRITICAL` | Only CRITICAL severity |
| `WARNING` | Only WARNING severity |
| `UNACKED` | Only alerts not yet acknowledged |

A number badge on each chip shows the count. The active filter chip is highlighted.

#### Alert Cards

Each alert is shown as a card with a colored left border (red = CRITICAL, amber = WARNING). The card contains:
- **Sensor ID** (e.g. PS-001) and sensor name
- **Timestamp** when the alert was first raised
- **Alert message** — a plain-English description of what was detected:
  - e.g. `"Pressure reading 71.2 PSI is critically below threshold 85 PSI"`
  - e.g. `"Acoustic emission 78.4 dB exceeds warning threshold 55 dB"`
- **ACKNOWLEDGED** chip — shown in gray if an operator has seen and acknowledged this alert
- **▼ expand button** — tap to open the action panel

#### Alert Action Panel (expanded)

When you tap the expand button, four action buttons appear:

| Button | What it records |
|--------|----------------|
| `Acknowledge` | Marks the alert as seen. Removes it from the UNACKED count. The alert stays active until resolved. |
| `Dispatch Maintenance` | Records that a maintenance crew has been dispatched to investigate. Resolves the alert (moves it to history). |
| `False Positive` | Marks as an incorrect detection (e.g. caused by sensor test or expected anomaly). Resolves the alert. |
| `Monitoring` | Notes that the situation is being watched. Does not resolve — keeps the alert active but notes it is under observation. |

**Pull to refresh** the alert list manually. The list auto-updates every 15 seconds and instantly on new WebSocket alerts.

---

### Page 4 — MAP (Pipeline Map)

The Map page shows a visual node-graph of the 48 km pipeline network. It shows the physical layout, where each sensor is located, and which segments of pipe are currently at risk.

#### Statistics Row (top)

| Stat | Value | Meaning |
|------|-------|---------|
| TOTAL LENGTH | 48 km | Total monitored pipeline length |
| NODES | 9 | Number of infrastructure nodes loaded from the backend |
| LEAK RISK % | 0–100% | Same composite risk score as the Dashboard gauge |

#### Pipeline Map

The large SVG map area shows the pipe network as a connected graph:

**Pipe segments (lines)**
Lines connecting nodes represent pipe segments. The color indicates the current status of that section:
- **Teal** — normal flow, no issues detected
- **Amber** — warning condition on a connected node or sensor
- **Red** — critical condition — possible leak zone

**Nodes (circles)**
Each circle represents a physical infrastructure point. Tap any node to see its details. Node types are indicated by a letter inside the circle:

| Letter | Node Type | What it is |
|--------|-----------|-----------|
| P | Pump station | Pressurizes the pipeline |
| J | Junction | Where two or more pipes meet |
| V | Valve | Flow control or isolation point |
| E | Endpoint | Consumer connection or reservoir |
| S | Sensor point | Where one of the 4 sensors is physically mounted |

Node color indicates status:
- **Green** — NORMAL
- **Amber** — WARNING
- **Red** — CRITICAL
- **Gray** — ISOLATED (manually taken offline)

The glow ring around each node pulses when in a non-NORMAL state.

#### Node Detail Card

When you tap a node, a detail card appears below the map showing:
- Node ID and type
- Physical location (km marker on the pipeline)
- Current status badge
- Linked sensor ID (if this is a sensor point, e.g. `Sensor: PS-001`)
- Current sensor value and agent state (if applicable)

#### Sensor Legend

Four colored strips at the bottom, one per sensor, showing:
- Sensor ID and name
- Km location on the pipeline (e.g. `Km 12.4`, `Km 22.1`, `Km 35.7`, `Km 44.1`)

**Pull to refresh** topology from the backend (refreshes automatically every 30 seconds).

---

### Page 5 — SENSORS

The Sensors page is the most detailed view in the app. It shows every sensor individually with professional live visualizations, AI agent state, statistics, and leak probability.

#### Page Header
- `SENSOR ARRAY` — page title
- `4 AUTONOMOUS AGENTS · SECTOR 7 · 48 KM PIPELINE` — system context subtitle
- `?` help button (top-right) — opens the sensors guide modal

---

#### Sensor Card: PS-001 — Pressure Transducer (Cyan)

**What this sensor does:** Measures water pressure inside the pipe in PSI (pounds per square inch). Pressure drops are the primary indicator of a pipe breach because fluid escaping the pipe causes an immediate pressure reduction upstream.

**Header row:**
- `PS-001` in cyan + live pulse dot (animated circle that pulses with each new reading)
- `Pressure Transducer` — sensor type name
- `Sector 7 — Km 12.4` — physical location on the 48 km pipeline
- **NOMINAL / WARNING / CRITICAL** status badge (top-right) — current reading status
- **Agent pill** — shows the AI agent's current decision state:
  - `● NORMAL` (green) — readings within expected range
  - `● MONITORING` (amber) — elevated readings, agent watching closely
  - `● LEAK` (red) — agent has determined a leak event is occurring

**Half-circle gauge visualization:**
A semicircular arc gauge spanning the full range of 70–130 PSI:
- The **cyan arc** fills from left (low) to right (high) showing the current value
- The **green shaded zone** marks the normal range (85–115 PSI)
- The **needle** (white line from center) points to the current value
- **5 tick marks** with labels: 70, 92, 100, 115, 130 PSI
- The value in large text at the center of the arc updates in real time

The arc bug that caused values above 100 to show incorrectly has been fixed — the arc stays correctly within its half-circle at all values.

**Statistics grid (4 cells):**

| Cell | Icon | What it shows |
|------|------|--------------|
| CURRENT VALUE | Blue dot | Live reading in PSI, e.g. `102.43 PSI` |
| NORMAL RANGE | Green checkmark | `85–115 PSI` — the safe operating band |
| AGENT STATE | CPU chip | AI decision: NORMAL / MONITORING / LEAK |
| CONFIDENCE | Shield | 0–100% — how certain the agent is about its current assessment |

**LEAK PROBABILITY bar:**
A row of 20 colored segments (like a progress bar divided into blocks). The number of filled segments and their color shows the current leak probability:
- **Green segments** (0–40%) = `NOMINAL` pill shown — no concern
- **Amber segments** (40–70%) = `WARNING` pill — elevated risk
- **Red segments** (70–100%) = `CRITICAL` pill — active leak likely

**Description:** A technical explanation of the sensor hardware at the bottom of the card.

---

#### Sensor Card: FS-002 — Turbine Flow Meter (Amber)

**What this sensor does:** Measures the rate of water flowing through the pipe in litres per minute (L/min). A sudden drop in flow rate indicates that water is escaping the pipe somewhere — a direct sign of a leak.

**Bar chart visualization:**
28 vertical bars representing the last 28 readings (one bar = one reading, left = oldest, right = newest):
- Bar **height** proportional to flow rate — taller = more flow
- Bar **opacity** gradient: older bars are lighter, the most recent bar is fully opaque amber
- The **green dashed band** with a light fill shows the normal range (180–220 L/min)
- Bars above the band = higher than normal; bars below = lower than normal
- The current value is displayed below the chart in large amber text

---

#### Sensor Card: ACS-003 — Acoustic Emission Sensor (Green)

**What this sensor does:** Detects high-frequency stress waves (acoustic emissions) generated by micro-fractures or fluid escaping through a breach in the pipe wall. Measured in decibels (dB). Spikes in acoustic emission often precede visible pressure drops, making this an early warning indicator.

**Waveform visualization:**
An oscilloscope-style line chart showing the last 36 readings as a smooth curve:
- The line rises and falls with the acoustic emission level
- A **horizontal dashed red line** marks the warning threshold (70 dB)
- The threshold label (`THRESHOLD`) appears at the right end of the dashed line
- Points above the threshold indicate stress wave events in the pipe
- The current value is shown below in large green text

---

#### Sensor Card: IR-004 — Infrared Thermographic Array (Magenta)

**What this sensor does:** Detects subsurface heat zones by measuring the surface temperature of the soil above the pipe. When pressurized water leaks underground, it warms the surrounding soil. Rising temperatures are a confirmation signal for a leak that has already started.

**Heat bar visualization:**
28 color-coded bars showing surface temperature history. The color of each bar changes based on temperature:

| Color | Temperature | Meaning |
|-------|------------|---------|
| Teal | < 25°C | Cool / normal — no heat anomaly |
| Amber | 25–35°C | Warm / warning — elevated soil temperature |
| Red | > 35°C | Hot / critical — significant heat zone detected |

Like the flow bars, older bars are lighter (more transparent) and the newest bar is fully opaque. This gradient helps you see how recently the temperature changed.

---

#### AI Agent States (all sensors)

Every sensor card has an **AI agent** running autonomously in the backend that analyzes each new reading using Z-score statistical analysis:

| State | Color | What the AI is doing |
|-------|-------|---------------------|
| `NORMAL` | Green | Reading is within the expected statistical distribution. Confidence > 70%. No action. |
| `MONITORING` | Amber | Reading is unusual but not conclusive. Agent is accumulating evidence. Confidence 40–70%. |
| `LEAK` | Red | Agent has detected a statistically significant anomaly and has determined a leak is likely occurring. Confidence > 70%. A CRITICAL alert is automatically generated. |

The **CONFIDENCE** value (0–100%) tells you how certain the agent is. A `LEAK` state with 95% confidence is much more reliable than one with 45% confidence.

---

### Page 6 — REPORTS

The Reports page lets you generate, view, and download summary reports of the pipeline's health and any incidents that have occurred.

#### Sensor Health — 24H Table

The first section shows a table with one row per sensor showing 24-hour uptime metrics:

| Column | What it shows |
|--------|--------------|
| SENSOR | Sensor ID (PS-001, FS-002, ACS-003, IR-004) |
| UPTIME BAR | Horizontal colored bar — full bar = 100% anomaly-free |
| PCT | Percentage of readings that were anomaly-free in the last 24 hours |
| READINGS | Total number of readings recorded from this sensor in 24 hours |

Bar colors:
- **Green** bar — > 95% uptime (healthy)
- **Amber** bar — 80–95% uptime (some anomalies)
- **Red** bar — < 80% uptime (significant issues)

#### Generate Report Section

Five report type buttons. Tap any button to generate a new report:

| Button | Color | Data window | What it contains |
|--------|-------|-------------|----------------|
| `DAILY SUMMARY` | Cyan | 24 hours | Mean/std/min/max for all 4 sensors + KPI snapshot |
| `WEEKLY REPORT` | Magenta | 7 days (168h) | Week-long trend analysis across all sensors |
| `INCIDENT REPORT` | Red | 24 hours | Focuses on anomalies and the alerts raised |
| `COMPLIANCE EXPORT` | Amber | 30 days (720h) | Full data export for regulatory filing |
| `SENSOR HEALTH` | Green | 24 hours | Detailed health metrics for each sensor |

When you tap a button, it shows `GENERATING...` while the backend processes the data. A native alert popup confirms success with the report title. The new report then appears in the list below.

#### Generated Reports List

Every previously generated report is listed here with:
- **Report type tag** — colored badge showing the type (DAILY, WEEKLY, etc.)
- **Title** — e.g. `DAILY Report — 2026-03-30 14:22 UTC`
- **Timestamp** — when it was generated
- **VIEW button** — tap to open/download the full JSON report

**VIEW button behavior:**
- **On web/browser** — directly downloads the `.json` file to your Downloads folder
- **On iPhone** — opens the JSON file in Safari; from there you can tap the Share button to save it to Files, send via email, or open in a JSON viewer app

Reports are stored permanently on the backend server as `.json` files. They are never deleted automatically.

---

## 7. Real-Time Data Architecture

```
Backend                    App (iPhone/Android/Web)
  │                              │
  ├─ 4 Sensor Agents             │
  │  (run every 2 seconds)       │
  │   ├─ Generate readings       │
  │   ├─ Z-score anomaly check   │
  │   └─ Update agent state      │
  │                              │
  ├─ WebSocket Server ─────────► WebSocket Client
  │   └─ Broadcasts every        │   ├─ Dashboard KPI cards update
  │      sensor reading + alert  │   ├─ Sensors page charts animate
  │                              │   ├─ Alerts tab shows new alert
  │                              │   └─ Alert SOUND plays (3 beeps)
  │                              │
  └─ REST API ────────────────── ► REST Calls (on page load / refresh)
      ├─ /api/readings/latest    │   ├─ Analytics charts
      ├─ /api/alerts             │   ├─ Alert list (every 15s)
      ├─ /api/pipeline/topology  │   ├─ Pipeline map (every 30s)
      ├─ /api/reports            │   └─ Reports list
      └─ /api/reports/{id}/download → VIEW button → open/download JSON
```

---

## 8. Alert Sound Technical Details

| Detail | Value |
|--------|-------|
| Sound file | `mobile/src/assets/alert.wav` |
| Format | PCM WAV, 8-bit mono, 8000 Hz sample rate |
| Pattern | Beep 880Hz (0.15s) · Silence (0.08s) · Beep 880Hz (0.15s) · Silence (0.08s) · Beep 1100Hz (0.30s) |
| iOS silent mode | **Bypassed** — plays even when the iPhone silent switch is ON (`playsInSilentModeIOS: true`) |
| Library | `expo-av` v14.0.5 |
| Trigger | Every new WebSocket `alert` event with `severity === 'CRITICAL'` |
| Test button | Dashboard → **TEST SOUND** button (amber) |

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `OFFLINE` badge red | WebSocket not connected | Check backend is running on port 8000 |
| `[API Error] timeout` | Backend unreachable | Check `EXPO_PUBLIC_API_URL` in `.env.local` |
| No alert sound | Volume muted or silent | Turn up volume; tap TEST SOUND button |
| Tunnel fails to start | ngrok outage | Use `--lan` mode (same WiFi) |
| iPhone can't load | Wrong IP in `.env.local` | Run `ipconfig` and update IPv4 address |
| White screen | JS compile error | Check terminal for red error messages |
| Analytics page empty | REST API timeout | Pull down to refresh; check backend |
| Reports won't generate | Backend error | Check backend terminal for Python errors |

---

## 10. Architecture Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend API | FastAPI (Python 3.11) | REST endpoints + WebSocket broadcast server |
| Database | SQLite + SQLAlchemy | Persist readings, alerts, reports across restarts |
| Sensor Agents | Python asyncio (4 agents) | Simulate sensors + Z-score anomaly detection |
| Alert Sound | expo-av + Web Audio API | 3-beep tone on CRITICAL alerts |
| Mobile/Web App | React Native 0.81.5 + Expo SDK 54 | Cross-platform iPhone/Android/browser UI |
| Navigation | Expo Router v6 | File-based tab routing |
| Real-time | WebSocket (ws:// or wss://) | Push every sensor reading and alert |
| State | React Context (5 providers) | Theme, sensor data, alerts, WebSocket, safe area |
| Charts | react-native-svg | Custom SVG gauges, bar charts, waveforms, heatmaps |

---

## 11. Key Source Files

| File | What to study |
|------|--------------|
| `backend/app/agents/base_agent.py` | How autonomous sensor agents work |
| `backend/app/agents/pressure_agent.py` | Pressure agent — Z-score detection logic |
| `backend/app/services/leak_detection_service.py` | Weighted composite risk scoring (35/30/25/10) |
| `backend/app/api/websocket.py` | WebSocket broadcast server |
| `mobile/src/hooks/useAlertSound.ts` | Alert sound hook (expo-av + Web Audio API) |
| `mobile/src/context/AlertContext.tsx` | Alert state + real-time WebSocket listener |
| `mobile/src/context/ThemeContext.tsx` | Global dark/light/system theme |
| `mobile/src/services/websocketClient.ts` | WebSocket client connection |
| `mobile/src/app/(tabs)/_layout.tsx` | Tab bar + header with logo |
| `mobile/src/app/(tabs)/sensors.tsx` | Sensor visualizations (gauge, bars, waveform, heat) |
| `mobile/src/constants/thresholds.ts` | Alert threshold values for all 4 sensors |
