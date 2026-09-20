import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  RotateCw, 
  ShieldCheck, 
  Terminal, 
  Radio, 
  Layers, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { Device } from '../types';
import { api } from '../services/api';

interface DevicePageProps {
  activeRoomId: string;
  onOpenConnector?: () => void;
}

export const DevicePage: React.FC<DevicePageProps> = ({ activeRoomId, onOpenConnector }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, [activeRoomId]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const data = await api.getDevices();
      setDevices(data);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const device = devices.find((d) => d.room_id === activeRoomId) || devices[0];
  const isConnected = device?.status === 'CONNECTED';
  const secondsSinceSeen = device?.seconds_since_seen ?? 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono tracking-wide">ESP32 DEVICE TELEMETRY & HARDWARE</h2>
          <p className="text-xs text-slate-400 mt-1">
            Physical hardware heartbeat, firmware identity, and network status for node.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onOpenConnector && (
            <button
              onClick={onOpenConnector}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>PAIR / CONNECT ESP32</span>
            </button>
          )}

          <button
            onClick={loadDevices}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs shadow-md shadow-cyan-500/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>REFRESH STATUS</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTION 17: HARDWARE SPECIFICATION CARD (6 Cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-mono text-white">
                  {device ? device.device_id : `ESP32_${activeRoomId}`}
                </h3>
                <p className="text-xs text-slate-400">Assigned Room: {activeRoomId}</p>
              </div>
            </div>

            <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 ${
              isConnected
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                : 'bg-rose-950/60 text-rose-400 border-rose-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {isConnected ? 'CONNECTED' : 'OFFLINE'}
            </div>
          </div>

          {/* Telemetry rows adhering strictly to Section 17 */}
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Status:</span>
              <span className={`font-bold ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isConnected ? 'CONNECTED' : 'OFFLINE'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">IP Address:</span>
              <span className="text-white font-bold">{device?.ip_address || '192.168.1.100'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Firmware:</span>
              <span className="text-cyan-400 font-bold">{device?.firmware_version || 'v1.0.0'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Last Seen:</span>
              <span className="text-amber-400 font-bold">
                {Math.max(1, Math.round(secondsSinceSeen))} seconds ago
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Wi-Fi:</span>
              <span className={`font-bold ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 font-mono">
            * Security note: Wi-Fi credentials and WPA2 security keys are never exposed over API telemetry endpoints.
          </div>
        </div>

        {/* GPIO Pin Map & Hardware Prototype Specs (6 Cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>ESP32 HARDWARE PINOUT CONFIGURATION</span>
          </div>

          <div className="divide-y divide-slate-800/80 font-mono text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">GPIO 4</span>
              <span className="text-cyan-400 font-semibold">DHT22 Data Line (Temp & Humidity)</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">GPIO 13</span>
              <span className="text-purple-400 font-semibold">HC-SR501 PIR Motion Sensor Output</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">GPIO 14</span>
              <span className="text-amber-400 font-semibold">5V Relay Module Trigger (Active LOW)</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">GPIO 2</span>
              <span className="text-blue-400 font-semibold">Built-in Blue Status LED (Wi-Fi Link)</span>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-2">
            <div className="text-xs font-mono font-bold text-slate-200">HEARTBEAT TOLERANCE RULE</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The backend considers a node CONNECTED if a valid heartbeat or sensor packet was ingested within the past 20 seconds. If missing for &gt;20s, the state automatically transitions to OFFLINE.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
