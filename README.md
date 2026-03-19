# DreamVision — Industrial IoT Thermal Monitoring Dashboard

**Team:** Team Omega  
**Project:** Real-time thermal anomaly detection & visualization for industrial equipment monitoring  
**Status:** MVP+ Production-Ready  

---

## 🎯 Project Overview

DreamVision is an **advanced IoT dashboard** that bridges hardware sensors (ESP32-based thermal + camera) with a real-time web interface for instant anomaly detection and visual thermal analysis.

### Core Features

✅ **Live Thermal Heatmap** — 12×12 animated grid showing real-time temperature distribution with color-coded risk zones  
✅ **Live Camera Stream** — MJPEG video feed from ESP32 camera alongside thermal data  
✅ **Anomaly Detection** — Automatic logging of high-temperature events with captured image snapshots  
✅ **Real-time Telemetry GraphQL** — Convex backend with WebSocket live updates  
✅ **Historical Data Charts** — Recharts time-series visualization of temperature trends  
✅ **Device Auto-Discovery** — Direct HTTP ingest bridge from ESP32 endpoints  

---

## 🏗️ Project Structure

```
dreamvision/
├── convex/                          # Backend (Convex serverless)
│   ├── schema.ts                    # Data model: telemetry, defects
│   ├── telemetry.ts                 # Queries/mutations for temperature readings
│   ├── defects.ts                   # Anomaly logging with image storage
│   ├── http.ts                      # HTTP ingest endpoint (/ingest)
│   ├── _generated/                  # Auto-generated Convex API types
│   └── convex.json                  # Convex config
│
├── src/app/                         # Frontend (Next.js 16 + React 19)
│   ├── page.tsx                     # Main dashboard grid layout
│   ├── layout.tsx                   # App shell + providers
│   ├── globals.css                  # Tailwind v4 + custom styles
│   └── components/
│       ├── DigitalTwin.tsx          # Animated 12×12 thermal heatmap
│       ├── CameraStreamCard.tsx     # Live MJPEG stream display
│       ├── GhostLineChart.tsx       # Real-time temperature trend graph
│       ├── XRayCards.tsx            # Anomaly history cards with images
│       └── ConnectionStatus.tsx     # Backend connection state badge
│
├── scripts/
│   ├── generate-gear.ts             # GLTF model generation utility
│   ├── esp32-bridge.ts              # Real-time thermal/camera ingest bridge
│   └── start-ingest.ts              # One-command service orchestrator
│
├── arduino/                         # Firmware files
│   ├── CameraWebServer.ino          # ESP32 main firmware
│   ├── app_httpd.cpp                # HTTP server implementation
│   └── board_config.h               # Hardware pin mappings
│
├── public/
│   └── models/gear.gltf             # 3D asset reference (generated)
│
└── package.json                     # Dependencies + scripts
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16.1.7 (Turbopack)
- **Language:** TypeScript 5 + JSX
- **Styling:** Tailwind CSS v4
- **3D/Viz:** Three.js, @react-three/fiber, @react-three/drei
- **Charts:** Recharts 3.8.0
- **State:** Convex React hooks (realtime)

### Backend
- **Runtime:** Convex 1.33.1 (serverless GraphQL + HTTP ingest)
- **Storage:** Convex file storage for defect images
- **Database:** Auto-managed Convex DB (JSON documents)
- **Webhooks:** HTTP action handlers for device ingest

### Hardware
- **Microcontroller:** ESP32-S3
- **Thermal Sensor:** MLX90614 IR thermometer (I²C)
- **Camera:** OV3660 CMOS sensor (MJPEG)
- **Servo:** Pan/tilt scanner for spatial heatmap
- **WiFi:** IEEE 802.11 b/g/n (@2.4GHz)

### DevOps
- **Build:** Turbopack (parallel transpile)
- **Linting:** ESLint 9
- **Type Checking:** TypeScript
- **Scripting:** tsx + Node.js
- **Version Control:** Git + GitHub

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       ESP32 Hardware                         │
│  (Thermal Sensor + Camera + WiFi)                           │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP POST /capture, /data, /stream
                 │
┌────────────────▼────────────────────────────────────────────┐
│          Local Bridge Service (esp32-bridge.ts)             │
│  • Polls thermal endpoint every 1000ms                      │
│  • Parses JSON with fallback HTML scraping                  │
│  • Captures image on anomaly (temp ≥ 42°C)                  │
│  • Encodes base64 for transport                             │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP POST + x-device-secret header
                 │ JSON: {temp, status, imageBase64?, minTemp, maxTemp, avgTemp}
                 │
┌────────────────▼────────────────────────────────────────────┐
│      Convex HTTP Ingest Endpoint (convex/http.ts)           │
│  • Validates device secret                                  │
│  • Timestamps reading server-side                           │
│  • Stores image to file storage if NOK                      │
│  • Keeps last 100 readings in DB                            │
└────────────────┬────────────────────────────────────────────┘
                 │ Real-time mutation → DB
                 │
┌────────────────▼────────────────────────────────────────────┐
│         Convex Real-time Subscription (WebSocket)           │
│  • getLatest: Returns latest temp reading                   │
│  • getLast20: Returns 20-record history                     │
└────────────────┬────────────────────────────────────────────┘
                 │ React hooks auto-update
                 │
┌────────────────▼────────────────────────────────────────────┐
│          Frontend Components (React 19)                      │
│  • DigitalTwin: Animated heatmap (lives, pulses)            │
│  • GhostLineChart: Real-time trend graph                    │
│  • CameraStreamCard: MJPEG img src (browser native)         │
│  • XRayCards: Anomaly history + thumbnails                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- **ESP32-S3** with firmware (see below)
- **WiFi** network with device access

### Installation

```bash
# Clone repository
git clone https://github.com/rchandrashekar53/Enduraverse-26.git
cd dreamvision

# Install dependencies
npm install

# Configure environment
cat > .env.local << EOF
CONVEX_DEPLOYMENT=anonymous:anonymous-dreamvision
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
NEXT_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211
DEVICE_SECRET=dv_secret_2026
NEXT_PUBLIC_ESP32_CAMERA_URL=http://10.94.151.79
NEXT_PUBLIC_ESP32_STREAM_URL=http://10.94.151.79:81/stream
EOF

# Generate local 3D asset
npm run generate:gear

# Start Convex backend + Next frontend + ingest bridge (3 terminals)
# Terminal 1:
npx convex dev

# Terminal 2:
npm run dev

# Terminal 3:
ESP_HOST=10.94.151.79 npm run ingest:start
```

Open **http://localhost:3000** → Dashboard loads with:
- Animated thermal heatmap (top left)
- Real-time temperature chart (top center, spans 2 cols)
- Live camera feed (top right)
- Anomaly history cards (bottom)

---

## 🔌 ESP32 Hardware Setup

### Firmware Upload

```bash
# Open Arduino IDE
# Sketch → Include Library → Add .ZIP Library
# Select: arduino/

# Select Board: ESP32-S3 Dev Module
# Port: /dev/ttyUSB0 (Linux) or COM3 (Windows)
# Upload: arduino/CameraWebServer.ino
```

### Endpoints Exposed

| Port | Path         | Response              | Purpose                    |
|------|--------------|----------------------|----------------------------|
| 80   | `/`          | HTML control panel   | Camera web UI              |
| 81   | `/stream`    | MJPEG frames         | Live video feed            |
| 82   | `/`          | HTML heatmap         | Thermal scanner display    |
| 82   | `/data`      | JSON telemetry       | **Bridge polls this**       |
| 82   | `/health`    | JSON status          | Device heartbeat check     |

### WiFi Credentials
```
SSID: viktor
Password: 09876543210
Device IP: 10.94.151.79 (adjust for your network)
```

---

## 📈 API Reference

### HTTP Ingest (`POST /ingest`)

**Request:**
```bash
curl -X POST http://127.0.0.1:3211/ingest \
  -H "Content-Type: application/json" \
  -H "x-device-secret: dv_secret_2026" \
  -d '{
    "temp": 42.5,
    "status": "NOK",
    "minTemp": 20.1,
    "maxTemp": 42.5,
    "avgTemp": 31.2,
    "ambientTemp": 25.0,
    "imageBase64": "..."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Reading ingested"
}
```

### Convex Queries

**Get Latest Temperature:**
```typescript
const latest = useQuery(api.telemetry.getLatest);
// Returns: { temp, status, timestamp, minTemp, maxTemp, ... }
```

**Get History (last 20):**
```typescript
const history = useQuery(api.telemetry.getLast20);
// Returns: Array of 20 readings, newest first
```

---

## 🎨 Frontend Components

### DigitalTwin (Heatmap)
- **12×12 animated thermal grid**
- Color map: blue (cold) → red (hot)
- Pulses/waves at different frequencies based on data
- Updates via Convex realtime

### GhostLineChart
- **Real-time line graph** of temp over time
- 20-point rolling window
- Yellow line with area fill
- Respects NOK threshold zones

### CameraStreamCard
- **MJPEG streaming img element**
- Auto-continuous while connected
- Manual RELOAD button
- Fallback link to camera panel on error

### XRayCards
- **Defect history cards** (one per anomaly)
- Thumbnail image preview
- Temperature + timestamp
- Scrollable recent anomalies

---

## 📊 Development Scripts

```bash
# Build & validate
npm run build          # Production build (no errors expected)
npm run lint           # ESLint check

# Local asset generation
npm run generate:gear  # Create public/models/gear.gltf

# Bridge operation
npm run bridge:esp32   # Manual bridge execution
npm run ingest:start   # Automated 3-service launcher

# Clean
rm -rf .next convex/_generated  # Clear build artifacts
```

---

## 🔐 Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `CONVEX_DEPLOYMENT` | — | Convex instance ID |
| `NEXT_PUBLIC_CONVEX_URL` | `http://127.0.0.1:3210` | Backend GraphQL endpoint |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | `http://127.0.0.1:3211` | Public ingest endpoint |
| `DEVICE_SECRET` | `dv_secret_2026` | Bridge auth token |
| `NEXT_PUBLIC_ESP32_CAMERA_URL` | `http://10.141.17.79` | Camera control panel base |
| `NEXT_PUBLIC_ESP32_STREAM_URL` | `http://10.141.17.79:81/stream` | MJPEG stream endpoint |
| `POLL_MS` | `1000` | Bridge polling interval (ms) |
| `NOK_THRESHOLD` | `42` | Anomaly detection trigger (°C) |

---

## 🐛 Troubleshooting

### "Heatmap not updating"
- Check bridge logs: `npm run ingest:start` should post every 1-5 seconds
- Verify ESP32 is online: `ping 10.94.151.79`
- Hard refresh browser (Ctrl+Shift+R)

### "Stream unavailable"
- Confirm ESP32 camera endpoint: `curl http://10.94.151.79:81/stream`
- Click RELOAD button on dashboard
- Check WiFi connection on device

### "Bridge can't connect to Convex"
- Ensure `npx convex dev` is running on port 3210/3211
- Check .env.local INGEST_URL matches actual port

### "Build fails with types"
- Run `npm install` to sync node_modules
- Delete `.next` folder and retry

---

## 📝 Git Workflow

```bash
# View recent commits (humanized messages)
git log --oneline -n 10

# Example commits:
# - "threaded thermal reality + live camera feeds into the operator's view..."
# - "swapped static 3d twin for living thermal heatmap..."
# - "animated heatmap so it pulses + waves over time, feels alive now"
```

---

## 🎯 Next Steps (Roadmap)

- [ ] Deploy to Vercel (production frontend)
- [ ] Deploy to Convex Cloud (production backend)
- [ ] Add historical data export (CSV)
- [ ] Implement alarm notifications (email/SMS)
- [ ] Multi-device support (device registry)
- [ ] Advanced analytics (trend prediction)

---

## 👥 Team

**Team Omega**  
Contributors: Arjun Kale, Team Omega Members

---

## 📄 License

MIT License — Open for educational and commercial use.

---

## 🔗 Links

- **GitHub:** https://github.com/rchandrashekar53/Enduraverse-26/
- **Convex Docs:** https://docs.convex.dev/
- **Next.js Docs:** https://nextjs.org/docs/
- **ESP32 Docs:** https://docs.espressif.com/projects/esp-idf/

---

**Last Updated:** March 19, 2026  
**Version:** 1.0.0 (MVP+ Production-Ready)
