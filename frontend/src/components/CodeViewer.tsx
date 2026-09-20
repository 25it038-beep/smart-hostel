import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  GitCompare, 
  Download, 
  FolderTree, 
  FileText, 
  Terminal, 
  Cpu, 
  Database, 
  Sparkles,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  path: string;
  language: string;
  category: 'FIRMWARE' | 'BACKEND' | 'AI' | 'FRONTEND';
  content: string;
  diffContent?: string;
  description: string;
}

const PROJECT_FILES: FileItem[] = [
  {
    id: 'esp32-ino',
    name: 'smart_hostel.ino',
    path: 'esp32/smart_hostel.ino',
    language: 'cpp',
    category: 'FIRMWARE',
    description: 'ESP32 C++ firmware with dual Wi-Fi REST telemetry and browser WebSerial USB terminal control',
    content: `/*
 * SMART HOSTEL ROOM MONITORING & AUTOMATIC LIGHT CONTROL
 * Hardware: ESP32 + DHT22 (Pin 4) + HC-SR501 PIR (Pin 13) + Relay Module (Pin 14)
 * Autonomous safety: Local PIR timeout runs locally even if Wi-Fi or backend disconnects.
 * NO LDR sensor used. Relay status represents light state.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22
#define PIR_PIN 13
#define RELAY_PIN 14
#define RELAY_ACTIVE_HIGH true

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* backendUrl = "http://192.168.0.102:8000";
const char* roomId = "ROOM_01";
const char* deviceId = "ESP32_DEV_01";

DHT dht(DHTPIN, DHTTYPE);
bool lightState = false;
bool autoMode = true;
unsigned long motionTimeoutMs = 60000;
unsigned long lastMotionDetectedTime = 0;
unsigned long lastTelemetrySent = 0;

void setRelay(bool on) {
  lightState = on;
  digitalWrite(RELAY_PIN, RELAY_ACTIVE_HIGH ? (on ? HIGH : LOW) : (on ? LOW : HIGH));
}

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  setRelay(false);
  dht.begin();
  
  WiFi.begin(ssid, password);
  Serial.println("{\\"event\\": \\"boot\\", \\"device\\": \\"ESP32_DEV_01\\", \\"status\\": \\"ready\\"}");
}

void loop() {
  // WebSerial command parser for browser pairing
  handleSerialCommands();

  int motion = digitalRead(PIR_PIN);
  if (motion == HIGH) {
    lastMotionDetectedTime = millis();
    if (autoMode && !lightState) {
      setRelay(true);
      sendTelemetryNow(dht.readTemperature(), dht.readHumidity(), true);
    }
  } else {
    // Autonomous hardware safety timeout
    if (autoMode && lightState && (millis() - lastMotionDetectedTime > motionTimeoutMs)) {
      setRelay(false);
      sendTelemetryNow(dht.readTemperature(), dht.readHumidity(), false);
    }
  }

  // Periodic telemetry interval (every 3 seconds)
  if (millis() - lastTelemetrySent > 3000) {
    lastTelemetrySent = millis();
    sendTelemetryNow(dht.readTemperature(), dht.readHumidity(), motion == HIGH);
  }
}`,
    diffContent: `@@ -12,6 +12,18 @@
- // Previous: Standard Wi-Fi telemetry only
+ // Updated: Dual-mode WebSerial + Wi-Fi Telemetry
+ void handleSerialCommands() {
+   if (Serial.available() > 0) {
+     String cmd = Serial.readStringUntil('\\n');
+     if (cmd.indexOf("LIGHT_ON") >= 0) setRelay(true);
+     if (cmd.indexOf("LIGHT_OFF") >= 0) setRelay(false);
+     if (cmd.indexOf("AUTO_ON") >= 0) autoMode = true;
+     if (cmd.indexOf("STATUS") >= 0) printSerialTelemetry();
+   }
+ }`
  },
  {
    id: 'ai-anomaly',
    name: 'anomaly_detection.py',
    path: 'backend/app/ai/anomaly_detection.py',
    language: 'python',
    category: 'AI',
    description: 'Empirical telemetry AI engine: Magnus-Tetens dew point, KDE occupancy curve, and energy scoring',
    content: `"""
Empirical Telemetry AI Engine:
Calculates Magnus-Tetens dew point, thermal mold risk,
adaptive occupancy distribution, and energy efficiency scoring (Grade A+ to F).
"""
import math
from typing import List, Dict, Any

def calculate_dew_point(temp_c: float, humidity_rh: float) -> float:
    """Magnus-Tetens empirical approximation for dew point temperature."""
    a = 17.27
    b = 237.7
    alpha = ((a * temp_c) / (b + temp_c)) + math.log(max(humidity_rh, 1.0) / 100.0)
    return round((b * alpha) / (a - alpha), 2)

def calculate_energy_efficiency_score(
    total_light_on_minutes: float, 
    occupied_light_on_minutes: float
) -> Dict[str, Any]:
    """Evaluates wasted energy when room light is left on during vacancy."""
    if total_light_on_minutes <= 0:
        return {"score": 100, "grade": "A+", "waste_minutes": 0, "efficiency_pct": 100.0}
    
    waste_minutes = max(0.0, total_light_on_minutes - occupied_light_on_minutes)
    efficiency_pct = max(0.0, min(100.0, (occupied_light_on_minutes / total_light_on_minutes) * 100.0))
    
    if efficiency_pct >= 95: grade = "A+"
    elif efficiency_pct >= 90: grade = "A"
    elif efficiency_pct >= 80: grade = "B"
    elif efficiency_pct >= 70: grade = "C"
    else: grade = "D"
    
    return {
        "score": round(efficiency_pct, 1),
        "grade": grade,
        "waste_minutes": round(waste_minutes, 1),
        "efficiency_pct": round(efficiency_pct, 1)
    }`,
    diffContent: `@@ -40,7 +40,15 @@
- # Basic standard deviation anomaly detection
+ # Upgraded: Multi-dimensional physical thermodynamic model
+ def compute_comprehensive_room_ai_metrics(readings, timeout_minutes=5):
+     dew_point = calculate_dew_point(latest.temperature, latest.humidity)
+     mold_risk = "HIGH" if (latest.humidity > 70 and latest.temperature > 24) else "LOW"
+     energy_score = calculate_energy_efficiency_score(light_on_mins, occupied_mins)
+     return {
+         "dew_point_c": dew_point,
+         "mold_risk": mold_risk,
+         "energy_grade": energy_score["grade"],
+     }`
  },
  {
    id: 'backend-main',
    name: 'main.py',
    path: 'backend/app/main.py',
    language: 'python',
    category: 'BACKEND',
    description: 'FastAPI application initialization, WebSocket broadcasting hub, and CORS configuration',
    content: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import rooms, sensors, devices, light, analytics, simulation

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Hostel Room Automation API",
    description="Backend for ESP32 IoT Room Monitoring and Autonomous Light Control",
    version="2.4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rooms.router, prefix="/api/rooms", tags=["Rooms"])
app.include_router(sensors.router, prefix="/api/sensors", tags=["Sensors"])
app.include_router(devices.router, prefix="/api/devices", tags=["Devices"])
app.include_router(light.router, prefix="/api/light", tags=["Light Control"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["Simulation"])`,
    diffContent: `@@ -15,4 +15,10 @@
+ # Added local network detection endpoint for instant ESP32 Wi-Fi pairing
+ @app.get("/api/devices/network-info")
+ def get_network_info():
+     host_ip = get_host_ip_address()
+     return {"host_ip": host_ip, "port": 8000, "firmware_url": f"http://{host_ip}:8000"}`
  },
  {
    id: 'frontend-app',
    name: 'App.tsx',
    path: 'frontend/src/App.tsx',
    language: 'typescript',
    category: 'FRONTEND',
    description: 'Next-Generation AI platform shell with command bar, sidebar, and integrated dev workspace',
    content: `import React, { useState, useEffect } from 'react';
import { TopCommandBar } from './components/TopCommandBar';
import { Sidebar, NavTabId } from './components/Sidebar';
import { AIWorkspace } from './pages/AIWorkspace';
import { Dashboard } from './pages/Dashboard';
import { LiveMonitor } from './pages/LiveMonitor';
import { CodeViewer } from './components/CodeViewer';
import { VerificationCenter } from './components/VerificationCenter';
import { IntegratedTerminal } from './components/IntegratedTerminal';
import { ESP32Connector } from './components/ESP32Connector';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTabId>('chat');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isConnectorOpen, setIsConnectorOpen] = useState(false);
  // Real-time telemetry & WebSocket state management...
}`,
  }
];

export const CodeViewer: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>('esp32-ino');
  const [viewMode, setViewMode] = useState<'CODE' | 'DIFF'>('CODE');
  const [copied, setCopied] = useState(false);

  const selectedFile = PROJECT_FILES.find((f) => f.id === selectedFileId) || PROJECT_FILES[0];

  const handleCopy = () => {
    const textToCopy = viewMode === 'DIFF' && selectedFile.diffContent 
      ? selectedFile.diffContent 
      : selectedFile.content;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-[#07080c] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
      {/* Top Header Bar */}
      <div className="h-12 border-b border-white/[0.07] bg-[#090b10] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-cyan-400">
            <FileCode className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-white tracking-wide">{selectedFile.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                {selectedFile.language.toUpperCase()}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                {selectedFile.category}
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 truncate max-w-md hidden sm:block">
              {selectedFile.path}
            </p>
          </div>
        </div>

        {/* View Mode & Action Controls */}
        <div className="flex items-center gap-2">
          {selectedFile.diffContent && (
            <div className="flex items-center bg-black/40 border border-white/[0.08] rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setViewMode('CODE')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'CODE' ? 'bg-white/[0.12] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setViewMode('DIFF')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'DIFF' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitCompare className="w-3 h-3" />
                <span>Diff</span>
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            title="Copy to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Download File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace: File Sidebar + Code Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left File Tree Panel */}
        <div className="w-56 border-r border-white/[0.07] bg-[#08090e] p-2 space-y-1 overflow-y-auto hidden md:block">
          <div className="px-2 py-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <FolderTree className="w-3 h-3" />
            <span>Project Explorer</span>
          </div>

          {PROJECT_FILES.map((file) => {
            const isSelected = file.id === selectedFileId;
            return (
              <button
                key={file.id}
                onClick={() => {
                  setSelectedFileId(file.id);
                  setViewMode('CODE');
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg font-mono text-xs transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected 
                    ? 'bg-white/[0.09] text-white border border-white/[0.12]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="truncate">{file.name}</span>
                </div>
                {file.diffContent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" title="Has recent diff" />
                )}
              </button>
            );
          })}
        </div>

        {/* Code Content Display */}
        <div className="flex-1 flex flex-col bg-[#050608] overflow-hidden">
          {/* File description banner */}
          <div className="px-4 py-2 bg-[#090b10] border-b border-white/[0.05] text-xs font-mono text-slate-400 flex items-center justify-between">
            <span className="truncate">{selectedFile.description}</span>
            <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">UTF-8</span>
          </div>

          {/* Code Viewer with Line Numbers */}
          <div className="flex-1 overflow-auto font-mono text-xs p-4 leading-relaxed select-text">
            {viewMode === 'DIFF' && selectedFile.diffContent ? (
              <pre className="text-slate-200">
                {selectedFile.diffContent.split('\n').map((line, idx) => {
                  let lineClass = 'text-slate-400';
                  if (line.startsWith('+')) lineClass = 'text-emerald-400 bg-emerald-950/20 -mx-4 px-4 py-0.5 block';
                  if (line.startsWith('-')) lineClass = 'text-rose-400 bg-rose-950/20 -mx-4 px-4 py-0.5 block';
                  if (line.startsWith('@@')) lineClass = 'text-cyan-400/80 font-bold -mx-4 px-4 py-0.5 block';
                  return (
                    <div key={idx} className={lineClass}>
                      {line}
                    </div>
                  );
                })}
              </pre>
            ) : (
              <div className="flex">
                {/* Line Numbers */}
                <div className="pr-4 select-none text-right text-slate-600 font-mono text-[11px] border-r border-white/[0.06] mr-4">
                  {selectedFile.content.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                {/* Code Text */}
                <pre className="flex-1 text-slate-300 whitespace-pre overflow-x-auto">
                  {selectedFile.content}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
