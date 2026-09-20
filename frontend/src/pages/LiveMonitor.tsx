import React from 'react';
import { 
  Activity, 
  Thermometer, 
  Droplets, 
  Users, 
  Lightbulb, 
  Cpu, 
  DoorClosed, 
  ShieldCheck, 
  Info,
  Clock
} from 'lucide-react';
import { MiniRoom } from '../components/MiniRoom';
import { StatusBadge } from '../components/StatusBadge';
import { SensorReading, RoomSetting } from '../types';

interface LiveMonitorProps {
  roomId: string;
  latestSensor: SensorReading | null;
  settings: RoomSetting | null;
  deviceStatus: 'CONNECTED' | 'OFFLINE';
  secondsSinceSeen: number;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({
  roomId,
  latestSensor,
  settings,
  deviceStatus,
  secondsSinceSeen,
}) => {
  const temperature = latestSensor?.temperature ?? 28.4;
  const humidity = latestSensor?.humidity ?? 61.0;
  const occupancy = latestSensor?.occupancy ?? false;
  const lightState = latestSensor?.light_state ?? false;
  const mode = settings?.light_mode ?? 'AUTO';
  const timeout = settings?.inactivity_timeout_sec ?? 60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <h2 className="text-xl font-bold text-white font-mono tracking-wide">LIVE ROOM TELEMETRY & HARDWARE REPLICA</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time sensory feed synchronized directly from ESP32 node via WebSocket.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge type="connection" status={deviceStatus} pulse />
          <StatusBadge type="mode" status={mode} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Exact Section 6 Specification Table & Telemetry Details (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-[#0d1322] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">SPECIFICATION MATRIX</span>
              <span className="text-xs font-mono text-cyan-400 font-bold">{roomId}</span>
            </div>

            {/* Matrix rows strictly implementing Section 6 */}
            <div className="divide-y divide-slate-800/60 font-mono text-sm">
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-cyan-400" /> Temperature
                </span>
                <span className="text-white font-bold">{temperature.toFixed(1)}°C</span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-400" /> Humidity
                </span>
                <span className="text-white font-bold">{humidity.toFixed(0)}%</span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" /> Occupancy
                </span>
                <span className={`font-bold ${occupancy ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {occupancy ? 'OCCUPIED' : 'EMPTY'}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" /> Light
                </span>
                <span className={`font-bold ${lightState ? 'text-amber-400' : 'text-slate-500'}`}>
                  {lightState ? 'ON' : 'OFF'}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" /> ESP32
                </span>
                <span className={`font-bold ${deviceStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {deviceStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Autonomous Safety Guarantee Information */}
          <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>OFFLINE SAFETY LOGIC GUARANTEE</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatic PIR light control operates locally inside ESP32 firmware loops using non-blocking timers.
              If Wi-Fi drops or this web browser closes, room automation continues working safely and reliably.
            </p>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-300">
              <span>Configured Inactivity Timeout:</span>
              <span className="font-bold text-amber-400">{timeout} seconds</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Room Replica Visualization (7 Cols) */}
        <div className="lg:col-span-7">
          <MiniRoom
            roomId={roomId}
            temperature={temperature}
            humidity={humidity}
            occupancy={occupancy}
            lightState={lightState}
            deviceStatus={deviceStatus}
            lastSeenText={`${Math.max(1, Math.round(secondsSinceSeen))} sec ago`}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
};
