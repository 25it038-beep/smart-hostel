# SMART HOSTEL: AI-Powered Room Monitoring & Automatic Light Control System

A complete, production-quality IoT system connecting an **ESP32 microcontroller prototype** to a high-performance **FastAPI backend** and a modern, responsive **React + TypeScript + Tailwind CSS** dashboard.

Designed for hostel dormitory energy efficiency, occupancy tracking, environmental comfort, and autonomous safety.

---

## 1. Project Overview

Hostel dormitories frequently suffer from excessive energy waste when occupants leave rooms without turning off lights. At the same time, wardens and facility managers lack visibility into room occupancy, temperature anomalies, and hardware health.

This system solves these issues through:
1. **Autonomous Local Control**: The ESP32 handles PIR motion sensing and relay timing locally on-chip using non-blocking `millis()` timers. The lights operate reliably even if Wi-Fi or servers disconnect.
2. **Real-Time Web Telemetry**: Stream sensor data (Temperature, Humidity, Occupancy, Light Relay State) via REST and WebSockets to a live dashboard.
3. **Remote Override**: Manual Light ON / Light OFF controls and operating mode switching (`AUTO` vs `MANUAL`).
4. **Historical Analytics**: Quantified metrics on total light ON duration, automatic activations, average session duration, and occupancy duration.
5. **AI Room Intelligence**: Statistical and ML anomaly detection analyzing room temperature spikes, high-frequency relay cycling, and empirical occupancy windows.
6. **Simulation Mode**: A dedicated prototype simulation mode allowing full software evaluation with realistic data streams without physical hardware.

> **IMPORTANT ENGINEERING PRINCIPLE**: No LDR is used, and the system does not attempt to optically verify lamp output. The `Light ON/OFF` status strictly reflects the **relay and controller command state**.

---

## 2. System Architecture

```text
       +-------------------------------------------------------+
       |               ESP32 PROTOTYPE NODE                    |
       |                                                       |
       |   DHT22/DHT11      HC-SR501 PIR      5V Relay Module  |
       |  (Temp & Humid)   (Occupancy/Motion) (Command State)  |
       +-----------+---------------+------------------+--------+
                   |               |                  |
                   +---------------+------------------+
                                   |
                             Wi-Fi (HTTP)
                                   |
                                   v
                   +-------------------------------+
                   |        FastAPI BACKEND        |
                   |   - REST API & Endpoints      |
                   |   - WebSocket Broadcasting    |
                   |   - Hardware Command Queue    |
                   |   - AI Anomaly Detection      |
                   +---------------+---------------+
                                   |
                                   v
                         SQLite / PostgreSQL
                                   |
                                   v
                   +-------------------------------+
                   |    REACT + VITE DASHBOARD     |
                   |   - Live Architectural MiniRoom|
                   |   - Metric Cards & Trend Line |
                   |   - Historical Recharts       |
                   |   - AI Intelligence Insights  |
                   |   - Hardware Device Page      |
                   |   - Simulation Mode Engine    |
                   +-------------------------------+
```

---

## 3. Hardware Requirements

| Component | Quantity | Purpose |
| :--- | :---: | :--- |
| **ESP32 Dev Module** (30 or 38 pins) | 1 | Microcontroller with Wi-Fi & Dual Core processing |
| **DHT22 (AM2302)** or **DHT11** | 1 | Temperature & Humidity environmental sensor |
| **HC-SR501 PIR Sensor** | 1 | Passive Infrared motion detector for occupancy |
| **1-Channel 5V Relay Module** | 1 | Switches power to the prototype room lighting |
| **Low-Voltage LED (5V or 12V)** | 1 | Visual room lighting prototype (Safe low-voltage load) |
| **Resistor (220Ω - 1kΩ)** | 1 | Current limiting for LED |
| **Breadboard & Jumper Wires** | 1 set | Prototyping interconnects |
| **Micro-USB Cable** | 1 | Power and programming for ESP32 |

> ⚠️ **SAFETY WARNING**: Do NOT connect dangerous 230V/110V AC mains electricity for student prototypes. Always use safe, low-voltage DC loads (such as a 5V LED strip or breadboard LED).

---

## 4. Hardware Wiring Diagram

### ESP32 to DHT22 Temperature & Humidity Sensor
| ESP32 Pin | DHT22 Pin | Notes |
| :--- | :--- | :--- |
| **3.3V** | VCC / Pin 1 | Power supply |
| **GPIO 4** | DATA / Pin 2 | Data line (Add 10k pull-up resistor to 3.3V if bare sensor) |
| **GND** | GND / Pin 4 | Ground reference |

### ESP32 to HC-SR501 PIR Motion Sensor
| ESP32 Pin | HC-SR501 Pin | Notes |
| :--- | :--- | :--- |
| **5V (VIN)** | VCC | PIR sensor requires 5V supply |
| **GPIO 13** | OUT | 3.3V logic output from sensor to ESP32 |
| **GND** | GND | Common ground |

*Adjustment Tips for HC-SR501*:
- Set trigger jumper to **Repeatable Trigger (H position)**.
- Turn sensitivity potentiometer to midpoint.
- Turn delay potentiometer counter-clockwise to the minimum (approx. 3-5 seconds).

### ESP32 to 5V Relay Module & LED Load
| ESP32 Pin | Relay Module | Notes |
| :--- | :--- | :--- |
| **5V (VIN)** | VCC | Powers relay coil |
| **GND** | GND | Common ground |
| **GPIO 14** | IN | Active LOW control trigger |

*Relay Output Terminals to Prototype LED*:
- **COM (Common)**: Connect to +5V (or DC battery +).
- **NO (Normally Open)**: Connect to Anode (+) of low-voltage LED (through 220Ω resistor).
- LED Cathode (-): Connect to GND.

---

## 5. ESP32 Automation Logic & Offline Safety

The firmware (`esp32/smart_hostel.ino`) is designed with **autonomous offline resilience**:

```text
if (PIR detects motion):
    occupancy = true
    lastMotionTime = millis()
    if (operatingMode == "AUTO"):
        relay = ON (Light command state = ON)

if (no motion detected):
    if (millis() - lastMotionTime >= inactivityTimeout):
        occupancy = false
        if (operatingMode == "AUTO"):
            relay = OFF (Light command state = OFF)
```

- **Inactivity Timeout**: Configurable via the dashboard to **30s, 60s, 90s, or 120s** (default: 60s).
- **Offline Protection**: If Wi-Fi fails or the backend crashes, the ESP32 main loop continues switching the relay autonomously based on PIR activity without crashing or freezing.

---

## 6. Software Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Arduino IDE 2.x (with ESP32 board support)

---

### Backend Setup

1. Open terminal and navigate to `smart-hostel/backend`:
   ```bash
   cd smart-hostel/backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run automated tests to verify:
   ```bash
   pytest tests/
   ```

4. Start the FastAPI development server:
   ```bash
   python run.py
   ```
   Backend will be accessible at: `http://localhost:8000`  
   Interactive API docs (Swagger): `http://localhost:8000/docs`

---

### Frontend Setup

1. In a new terminal, navigate to `smart-hostel/frontend`:
   ```bash
   cd smart-hostel/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   Frontend will launch at: `http://localhost:5173`

---

### ESP32 Firmware Flashing

1. Open Arduino IDE.
2. Go to **File → Preferences** and ensure ESP32 board URL is added:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Install required libraries from Library Manager:
   - **DHT sensor library** by Adafruit
   - **ArduinoJson** by Benoit Blanchon (v6 or v7)
4. Open `smart-hostel/esp32/smart_hostel.ino`.
5. Update your Wi-Fi credentials and laptop local IP:
   ```cpp
   const char* WIFI_SSID       = "Your_Hostel_WiFi";
   const char* WIFI_PASSWORD   = "Your_Password";
   const char* BACKEND_BASE_URL = "http://192.168.1.100:8000"; // Your PC IP
   ```
6. Select Board: **ESP32 Dev Module**, choose the correct COM port, and click **Upload**.
7. Open Serial Monitor at **115200 baud** to view real-time diagnostics.

---

## 7. Testing Without Hardware (Simulation Mode)

If physical hardware is not immediately connected, the application includes a **complete built-in simulation mode**:

1. Start both backend and frontend servers.
2. Open `http://localhost:5173` in your browser.
3. Look at the top banner: Click **`START SIMULATION MODE`**.
4. The system will:
   - Seed realistic 3-day baseline historical data.
   - Stream live realistic temperature & humidity drifts.
   - Click **`SIMULATE PIR MOTION`** to trigger human motion.
   - Watch the **MiniRoom** illuminate, occupant icon activate, light turn ON, and timeout countdown start.
   - Switch tabs to **Analytics** and **AI Insights** to see populated charts, occupancy windows, and anomaly evaluations.
5. A prominent banner displays `SIMULATED DATA` at all times to prevent confusing mock data with live hardware.

---

## 8. REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/rooms` | List all hostel rooms & live status |
| `GET` | `/api/rooms/{room_id}` | Details for specific room |
| `POST` | `/api/rooms` | Register new room for hostel expansion |
| `PUT` | `/api/rooms/{room_id}/settings` | Update timeout, operating mode, intervals |
| `POST` | `/api/sensors/data` | Ingest ESP32 telemetry (Temp, Humidity, PIR, Relay) |
| `GET` | `/api/rooms/{room_id}/sensors/latest` | Most recent reading |
| `GET` | `/api/rooms/{room_id}/sensors/history` | Historical telemetry records |
| `POST` | `/api/devices/heartbeat` | ESP32 device heartbeat ping |
| `GET` | `/api/devices` | List registered ESP32 nodes and freshness |
| `POST` | `/api/rooms/{room_id}/light` | Dispatch light override command (AUTO/MANUAL) |
| `GET` | `/api/rooms/{room_id}/light` | Query relay command state & ack status |
| `GET` | `/api/rooms/{room_id}/command` | Polling endpoint for ESP32 to fetch overrides |
| `GET` | `/api/rooms/{room_id}/analytics` | Duration metrics, activations count, usage summary |
| `GET` | `/api/rooms/{room_id}/ai-insights` | Empirical anomaly detection & pattern report |
| `WS` | `/ws/rooms/{room_id}` | Real-time WebSocket connection for instant updates |

---

## 9. AI Anomaly Detection Logic

The AI module (`backend/app/ai/anomaly_detection.py`) evaluates historical telemetry against statistical baselines:
- **Sample Requirement**: Requires $\ge 15$ historical data points. If insufficient, it transparently displays `Collecting more data...` with zero fabricated metrics.
- **Temperature & Humidity Anomalies**: Computes rolling mean and standard deviation. Flagged when $|z\text{-score}| \ge 2.0$.
- **Rapid Relay Cycling**: Detects excessive switching cycles ($\ge 8$ in 3 hours) and advises extending the inactivity timeout to prevent relay wear.
- **Occupancy Window**: Evaluates empirical active hours (e.g. 08:30 – 22:45) using distribution percentiles.

---

## 10. Troubleshooting

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **ESP32 shows OFFLINE** | ESP32 cannot reach laptop IP or Wi-Fi failed | Verify PC firewall allows port 8000. Confirm `BACKEND_BASE_URL` in firmware uses PC local IP (not `localhost`). |
| **Light stays ON constantly** | PIR sensor delay pot set too high | Turn the orange delay trimpot on HC-SR501 counter-clockwise to minimum. |
| **Relay doesn't click** | Active level mismatch | Change `#define RELAY_ON_LEVEL LOW` to `HIGH` in firmware if your relay is active HIGH. |
| **WebSocket disconnects** | Proxy or network sleep | The React frontend automatically reconnects within 3 seconds. Check console logs. |
| **Invalid temperature reading** | Loose connection on DHT pin | Check 3.3V power, ensure GPIO 4 connection, or add a 10kΩ pull-up resistor between VCC and DATA. |
