import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Wifi, 
  Terminal, 
  Usb, 
  Copy, 
  Check, 
  Radio, 
  Play, 
  Square, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Power
} from 'lucide-react';
import { api } from '../services/api';

interface ESP32ConnectorProps {
  activeRoomId: string;
  deviceStatus: 'CONNECTED' | 'OFFLINE';
  onSerialTelemetry?: (data: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ESP32Connector: React.FC<ESP32ConnectorProps> = ({
  activeRoomId,
  deviceStatus,
  onSerialTelemetry,
  isOpen,
  onClose,
}) => {
  const [activeMode, setActiveMode] = useState<'WIFI' | 'USB_SERIAL'>('WIFI');
  const [networkInfo, setNetworkInfo] = useState<{
    primary_ip: string;
    detected_ips: string[];
    port: number;
    api_base_url: string;
  } | null>(null);

  const [customServerIp, setCustomServerIp] = useState('192.168.0.102');
  const [wifiSsid, setWifiSsid] = useState('YOUR_WIFI_SSID');
  const [wifiPass, setWifiPass] = useState('YOUR_WIFI_PASSWORD');
  const [copied, setCopied] = useState(false);

  // WebSerial state
  const [isSerialSupported, setIsSerialSupported] = useState(false);
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const [serialError, setSerialError] = useState<string | null>(null);
  const serialPortRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Check WebSerial support
    setIsSerialSupported('serial' in navigator);

    // Fetch network IP coordinates
    api.getNetworkInfo()
      .then((info) => {
        setNetworkInfo(info);
        if (info.primary_ip) {
          setCustomServerIp(info.primary_ip);
        }
      })
      .catch((err) => console.error('Failed to get network info:', err));
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs]);

  const baseUrl = `http://${customServerIp}:8000`;

  const firmwareCodeSnippet = `// ========================== DEVICE CONFIGURATION =======================
const char* DEVICE_ID       = "ESP32_${activeRoomId}";
const char* ROOM_ID         = "${activeRoomId}";
const char* FIRMWARE_VER    = "v1.0.0";

// Wi-Fi Configuration
const char* WIFI_SSID       = "${wifiSsid}";
const char* WIFI_PASSWORD   = "${wifiPass}";

// Backend API URL (Connected to this computer)
const char* BACKEND_BASE_URL = "${baseUrl}";`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(firmwareCodeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // --- WebSerial API Handlers ---
  const connectWebSerial = async () => {
    setSerialError(null);
    try {
      if (!('serial' in navigator)) {
        setSerialError('Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.');
        return;
      }

      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      serialPortRef.current = port;
      setIsSerialConnected(true);

      addSerialLog('>>> Connected to ESP32 Serial Port at 115200 Baud <<<');

      // Start reading stream
      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      readSerialLoop(reader);
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        setSerialError(err.message || 'Failed to open Serial port');
      }
    }
  };

  const disconnectWebSerial = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSerialConnected(false);
      serialPortRef.current = null;
      readerRef.current = null;
      addSerialLog('>>> Disconnected from ESP32 Serial Port <<<');
    }
  };

  const readSerialLoop = async (reader: any) => {
    let lineBuffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          lineBuffer += value;
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() || '';

          for (const line of lines) {
            const clean = line.trim();
            if (clean) {
              addSerialLog(clean);

              // Check if structured JSON telemetry from ESP32
              if (clean.startsWith('{') && clean.endsWith('}')) {
                try {
                  const parsed = JSON.parse(clean);
                  if (parsed.type === 'telemetry' && onSerialTelemetry) {
                    onSerialTelemetry({
                      event: 'sensor_update',
                      room_id: parsed.room_id || activeRoomId,
                      device_id: parsed.device_id || `ESP32_${activeRoomId}`,
                      temperature: parsed.temperature ?? parsed.temp,
                      humidity: parsed.humidity ?? parsed.hum,
                      occupancy: parsed.occupancy ?? parsed.occ,
                      light_state: parsed.light_state ?? parsed.light,
                      timestamp: new Date().toISOString(),
                      device_status: 'CONNECTED',
                    });
                  }
                } catch {
                  // Ignore JSON parse errors for regular logs
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Serial read error:', err);
    }
  };

  const addSerialLog = (text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSerialLogs((prev) => [...prev.slice(-150), `[${timestamp}] ${text}`]);
  };

  const sendSerialCommand = async (cmdJson: object) => {
    if (!serialPortRef.current || !serialPortRef.current.writable) return;
    try {
      const textEncoder = new TextEncoder();
      const writer = serialPortRef.current.writable.getWriter();
      const msg = JSON.stringify(cmdJson) + '\n';
      await writer.write(textEncoder.encode(msg));
      writer.releaseLock();
      addSerialLog(`[TX] Sent command: ${msg.trim()}`);
    } catch (err: any) {
      setSerialError('Failed to send command over serial: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-[#0c121e] shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-[#0d1424] via-[#10192e] to-[#0d1424] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono text-white tracking-wide">
                  CONNECT PHYSICAL ESP32 PROTOTYPE
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                  {activeRoomId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hardware pairing via Wi-Fi REST API or direct browser USB WebSerial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-mono text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-2 gap-2">
          <button
            onClick={() => setActiveMode('WIFI')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
              activeMode === 'WIFI'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>METHOD 1: WI-FI REST API (RECOMMENDED)</span>
          </button>

          <button
            onClick={() => setActiveMode('USB_SERIAL')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
              activeMode === 'USB_SERIAL'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Usb className="w-4 h-4" />
            <span>METHOD 2: DIRECT USB WEB-SERIAL</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Hardware Connection Live Radar Status */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
            deviceStatus === 'CONNECTED'
              ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${deviceStatus === 'CONNECTED' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
              <div>
                <div className="text-xs font-mono font-bold">
                  {deviceStatus === 'CONNECTED'
                    ? '● ESP32 IS ONLINE & ACTIVELY STREAMING SENSOR DATA'
                    : '● LISTENING FOR ESP32 PACKETS (WAITING FOR FIRST HANDSHAKE)'}
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Target Node: <span className="text-white font-bold">ESP32_{activeRoomId}</span> • Backend: <span className="text-cyan-400">{baseUrl}</span>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold border ${
                deviceStatus === 'CONNECTED'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-amber-950/60 text-amber-300 border-amber-700'
              }`}>
                {deviceStatus}
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* METHOD 1: WI-FI REST API INSTRUCTIONS & CONFIG GENERATOR                   */}
          {/* ========================================================================= */}
          {activeMode === 'WIFI' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Host Local IP (Auto-Detected)
                  </label>
                  <input
                    type="text"
                    value={customServerIp}
                    onChange={(e) => setCustomServerIp(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Your Wi-Fi SSID
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="Hostel_WiFi"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Your Wi-Fi Password
                  </label>
                  <input
                    type="text"
                    value={wifiPass}
                    onChange={(e) => setWifiPass(e.target.value)}
                    placeholder="Password123"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="rounded-xl border border-slate-800 bg-[#080d17] p-4 relative group">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono text-slate-400">
                  <span>Paste into: <code className="text-cyan-400">esp32/smart_hostel.ino</code> (Lines 40–51)</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY CONFIG'}</span>
                  </button>
                </div>
                <pre className="text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed">
                  {firmwareCodeSnippet}
                </pre>
              </div>

              {/* Step-by-Step Connection Instructions */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2.5">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>3-STEP HARDWARE LAUNCH SEQUENCE</span>
                </h4>
                <ol className="text-xs font-mono text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Ensure your laptop/PC and the ESP32 are connected to the <strong className="text-white">same Wi-Fi network</strong> or phone mobile hotspot.
                  </li>
                  <li>
                    Open <strong className="text-white">smart-hostel/esp32/smart_hostel.ino</strong> in Arduino IDE, copy the configuration above, and click <strong className="text-cyan-400">Upload</strong>.
                  </li>
                  <li>
                    Open the Arduino Serial Monitor at <strong className="text-white">115200 baud</strong>. Once connected to Wi-Fi, the ESP32 will send sensor data to <code className="text-cyan-400">{baseUrl}/api/sensors/data</code> and this dashboard will immediately reflect live readings!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* METHOD 2: DIRECT USB WEB-SERIAL TERMINAL                                  */}
          {/* ========================================================================= */}
          {activeMode === 'USB_SERIAL' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/60 flex items-start gap-3 text-xs text-slate-300">
                <Usb className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Browser-Native Direct USB Serial Connection</p>
                  <p className="mt-0.5 text-slate-400 leading-relaxed">
                    Connect your ESP32 board to this computer using a USB cable. You can view serial debug output, test hardware relays, and stream sensor telemetry directly over USB without configuring Wi-Fi!
                  </p>
                </div>
              </div>

              {serialError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{serialError}</span>
                </div>
              )}

              {/* USB Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {!isSerialConnected ? (
                    <button
                      onClick={connectWebSerial}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs shadow-md shadow-purple-600/30 transition-all"
                    >
                      <Usb className="w-4 h-4" />
                      <span>CONNECT ESP32 VIA USB (115200 BAUD)</span>
                    </button>
                  ) : (
                    <button
                      onClick={disconnectWebSerial}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs shadow-md shadow-rose-600/30 transition-all"
                    >
                      <Square className="w-4 h-4" />
                      <span>DISCONNECT USB SERIAL</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSerialLogs([])}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 transition-colors"
                  >
                    CLEAR LOGS
                  </button>
                </div>

                {isSerialConnected && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => sendSerialCommand({ cmd: 'LIGHT_ON' })}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <Power className="w-3.5 h-3.5" />
                      RELAY ON
                    </button>
                    <button
                      onClick={() => sendSerialCommand({ cmd: 'LIGHT_OFF' })}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 font-mono font-bold text-xs flex items-center gap-1 border border-rose-800/80"
                    >
                      <Power className="w-3.5 h-3.5" />
                      RELAY OFF
                    </button>
                    <button
                      onClick={() => sendSerialCommand({ cmd: 'PING' })}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs"
                    >
                      PING
                    </button>
                  </div>
                )}
              </div>

              {/* Embedded Serial Monitor Terminal Console */}
              <div className="rounded-xl border border-slate-800 bg-black p-4 font-mono text-xs h-64 overflow-y-auto space-y-1 shadow-inner scrollbar-thin">
                {serialLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600">
                    Connect USB cable and click "Connect ESP32 via USB" to view serial diagnostics...
                  </div>
                ) : (
                  serialLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`leading-relaxed whitespace-pre-wrap ${
                        log.includes('[RELAY]') || log.includes('LIGHT')
                          ? 'text-amber-400 font-semibold'
                          : log.includes('[PIR]') || log.includes('OCCUPIED')
                          ? 'text-cyan-400 font-semibold'
                          : log.includes('telemetry')
                          ? 'text-emerald-400'
                          : log.includes('>>>')
                          ? 'text-purple-400 font-bold'
                          : 'text-slate-300'
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>Firmware operates autonomously offline even if disconnected.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
