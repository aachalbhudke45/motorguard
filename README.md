# MOTORGUARD
### Smart Motor Health Monitoring & Predictive Maintenance System

College project — **Software Module: 90% functional prototype**. Hardware sensor integration (ESP32 + physical sensors) is the pending final phase. All sensor values in this build are **simulated** and clearly labelled as such in the app.

Built with React 18 + Vite, Tailwind CSS, Recharts, Lucide icons, and an optional Firebase layer.

---

## 1. Requirements

- **Node.js 18 or newer** (LTS 20/22 recommended) — download from https://nodejs.org
- **VS Code** — https://code.visualstudio.com
- An internet connection for the first `npm install`

Check Node is installed (in any terminal):

```bash
node -v
npm -v
```

## 2. Run it in VS Code

1. Unzip `motorguard.zip` somewhere easy, e.g. `Documents/motorguard`.
2. Open VS Code → **File → Open Folder…** → select the `motorguard` folder (the one that contains `package.json`).
3. Open the terminal: **Terminal → New Terminal** (or `` Ctrl + ` ``).
4. Run:

```bash
npm install
npm run dev
```

5. Vite prints a local address (normally **http://localhost:5173**). The browser opens automatically; if not, Ctrl-click the link.

Stop the server with `Ctrl + C` in the terminal.

**Production build** (for deploying a live demo link later):

```bash
npm run build      # creates the dist/ folder
npm run preview    # serves dist/ locally to check it
```

The `dist/` folder can be deployed as a static site to Netlify, Vercel, Firebase Hosting or GitHub Pages.

---

## 3. Live demo script (for the presentation)

| Step | Action | What happens |
|---|---|---|
| 1 | Open **Dashboard** | 🟢 NORMAL · Health 92% · 65 °C · 2.4 mm/s · 4.8 A · Risk LOW |
| 2 | Click **SIMULATE LIVE DATA** | New realistic values, charts gain a point, History gets a row, timestamp updates |
| 3 | Click **🚨 SIMULATE FAULT** | Temp 88–95 °C, vibration 6–8 mm/s, current 7–9 A, load 95–100 % |
| 4 | Watch the dashboard | Health drops to ~30–45 %, status → 🔴 CRITICAL, risk → HIGH |
| 5 | Alert pop-up appears | “🚨 CRITICAL ALERT … Immediate motor inspection recommended.” |
| 6 | Visit Alerts, History, Reports, charts | The fault event is recorded everywhere |
| 7 | Click **SIMULATE LIVE DATA** twice | Motor recovers gradually (WARNING → NORMAL) and an INFO “returned to normal” alert is raised |
| 8 | Toggle **DEMO MODE** | ● LIVE — a new reading every 3–5 s, occasional warning drifts |
| 9 | **RESET SYSTEM** | Confirmation dialog, then everything returns to the initial state |

Extra: **SIMULATE WARNING** produces warning-band readings; **Settings** lets you change thresholds and the whole app re-grades instantly.

---

## 4. Folder structure

```
motorguard/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example                 # Firebase keys template (optional)
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx                 # entry point
    ├── App.jsx                  # layout + hash-based page navigation
    ├── index.css                # Tailwind + theme + print styles
    ├── config/
    │   └── constants.js         # default thresholds, baseline, nav items, checklist
    ├── context/
    │   └── MotorContext.jsx     # global state; ingestReading() = single data entry point
    ├── utils/
    │   ├── healthEngine.js      # rule-based health score, status, risk, alerts, recommendations
    │   ├── simulator.js         # normal / warning / fault / demo / initial-history readings
    │   └── format.js            # time & number formatting helpers
    ├── services/
    │   ├── dataService.js       # persistence API (localStorage + optional Firestore mirror)
    │   ├── firebase.js          # lazy Firebase init, only if .env keys exist
    │   ├── localStore.js        # safe localStorage wrapper
    │   └── hardwareService.js   # ESP32 packet format + parser (hardware phase)
    ├── components/
    │   ├── Sidebar.jsx  Topbar.jsx  ControlBar.jsx  Toasts.jsx  ConfirmModal.jsx
    │   ├── MetricCard.jsx  HealthGauge.jsx  TrendChart.jsx  ProjectStatus.jsx
    │   └── ui.jsx               # Card, StatusBadge, LiveIndicator, Toggle, Trend, ProgressBar…
    └── pages/
        ├── Dashboard.jsx  LiveMonitoring.jsx  MotorHealth.jsx  PredictiveMaintenance.jsx
        └── Alerts.jsx  History.jsx  Reports.jsx  Settings.jsx
```

---

## 5. How the health engine works (`src/utils/healthEngine.js`)

Default thresholds (editable in Settings):

| Parameter | Normal | Warning | Critical |
|---|---|---|---|
| Temperature | < 70 °C | 70–80 °C | > 80 °C |
| Vibration | < 4 mm/s | 4–6 mm/s | > 6 mm/s |
| Current | < 6 A | 6–7 A | > 7 A |
| Motor load | < 80 % | 80–90 % | > 90 % |

Each parameter gets a sub-score (normal zone 100→87, warning zone 87→60, critical zone 60→5). Overall health = weighted average (temperature 30 %, vibration 30 %, current 20 %, load 20 %) minus a small penalty for voltage/RPM deviation.

- **Health label:** ≥ 80 % OPTIMAL · 55–79 % WARNING · < 55 % CRITICAL
- **Status:** any critical parameter → CRITICAL; any warning parameter → WARNING; else NORMAL
- **Maintenance risk:** NORMAL → LOW · WARNING → MEDIUM · CRITICAL → HIGH
- **Alerts** are raised only on transitions (a parameter escalating, the motor entering CRITICAL, or returning to NORMAL), so demo mode doesn't flood the Alert Center.

---

## 6. Connecting Firebase (optional)

The app runs fully offline on browser localStorage. To mirror data to Cloud Firestore:

1. Create a Firebase project → add a Web App → enable **Firestore Database**.
2. Copy `.env.example` to `.env` and paste your config values.
3. Restart `npm run dev`.

Collections written: `sensorReadings`, `motorStatus` (doc `current`), `alerts`, `maintenanceRecords`. Settings → *Data Storage* shows which backend is active. No dashboard code changes are needed.

## 7. Hardware integration (next phase)

`src/services/hardwareService.js` documents the expected ESP32 packet:

```json
{ "timestamp": "2026-10-08T10:15:00Z", "temperature": 65.2, "vibration": 2.41,
  "current": 4.8, "voltage": 230, "rpm": 1440, "load": 62 }
```

Planned sensors: DS18B20/MLX90614 (temperature), ADXL345/MPU6050 (vibration), ACS712/SCT-013 (current), ZMPT101B (voltage). Once packets arrive (via Firestore listener, REST or MQTT), pass them through `parseHardwarePacket()` and into `ingestReading()` from `MotorContext` — health, alerts, charts, history and reports all work unchanged.

---

## 8. Troubleshooting

- **`npm` not recognised** → install Node.js, then close and reopen VS Code.
- **PowerShell “running scripts is disabled”** (Windows) → in the VS Code terminal dropdown choose **Command Prompt** instead of PowerShell, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
- **Port 5173 in use** → Vite automatically picks the next free port; use the URL it prints.
- **Want a clean slate** → click RESET SYSTEM, or clear the site's localStorage in browser DevTools.
