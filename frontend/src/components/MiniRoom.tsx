import React from 'react';
import { User, Lightbulb, Wifi, Thermometer, Droplets, Radar, DoorOpen } from 'lucide-react';

interface MiniRoomProps {
  roomId: string;
  temperature: number;
  humidity: number;
  occupancy: boolean;
  lightState: boolean;
  deviceStatus: 'CONNECTED' | 'OFFLINE';
  lastSeenText?: string;
  mode?: string;
}

export const MiniRoom: React.FC<MiniRoomProps> = ({
  roomId,
  temperature,
  humidity,
  occupancy,
  lightState,
  deviceStatus,
  lastSeenText = '2 sec ago',
  mode = 'AUTO',
}) => {
  return (
    <div className="relative rounded-2xl border border-slate-800 bg-[#0c121e] p-6 overflow-hidden shadow-2xl">
      {/* Background ambient lighting from ceiling LED */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
          lightState
            ? 'opacity-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-amber-950/10 to-transparent'
            : 'opacity-0'
        }`}
      />

      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 font-bold">
              {roomId}
            </span>
            <h3 className="text-base font-bold text-white tracking-wide font-mono">LIVE ARCHITECTURAL MONITOR</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Physical telemetry reflected into virtual prototype room</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Operating Mode</span>
            <div className="text-xs font-bold font-mono text-cyan-400">{mode} MODE</div>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border flex items-center gap-1.5 ${
            deviceStatus === 'CONNECTED'
              ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
              : 'bg-rose-950/50 text-rose-400 border-rose-800/60'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${deviceStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            {deviceStatus}
          </div>
        </div>
      </div>

      {/* Room Floorplan Schematic */}
      <div className="relative min-h-[380px] w-full rounded-xl border-2 border-dashed border-slate-700/70 bg-gradient-to-b from-slate-950 to-[#0d1424] p-6 flex flex-col justify-between overflow-hidden">
        {/* Floor Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* TOP CEILING FIXTURES */}
        <div className="flex items-start justify-between relative z-10">
          {/* Top Left: HC-SR501 PIR Sensor */}
          <div className="flex flex-col items-center">
            <div className={`p-3 rounded-xl border transition-all duration-300 ${
              occupancy 
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}>
              <Radar className={`w-6 h-6 ${occupancy ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            </div>
            <span className="text-[10px] font-mono mt-1 font-semibold text-slate-300">PIR SENSOR</span>
            <span className={`text-[9px] font-mono ${occupancy ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
              {occupancy ? 'RADAR ACTIVE' : 'STANDBY'}
            </span>

            {/* Simulated Detection Beam Cone */}
            {occupancy && (
              <div className="absolute top-12 left-6 w-36 h-44 bg-gradient-to-br from-cyan-500/20 via-cyan-500/5 to-transparent clip-cone pointer-events-none -rotate-12 animate-pulse" />
            )}
          </div>

          {/* Top Center: CEILING LED LIGHT FIXTURE */}
          <div className="flex flex-col items-center relative">
            {/* Glowing Aura when ON */}
            {lightState && (
              <div className="absolute -top-4 w-32 h-32 bg-amber-400/25 rounded-full blur-2xl pointer-events-none animate-pulse-slow" />
            )}

            <div className={`relative p-4 rounded-full border-2 transition-all duration-500 shadow-xl ${
              lightState 
                ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.6)]' 
                : 'bg-slate-900 border-slate-700 text-slate-600'
            }`}>
              <Lightbulb className={`w-8 h-8 ${lightState ? 'fill-amber-200 text-amber-950' : ''}`} />
            </div>

            <div className="mt-2 text-center">
              <span className="text-[11px] font-mono font-bold tracking-wider text-slate-200">CEILING LED</span>
              <div className={`text-xs font-mono font-bold mt-0.5 ${lightState ? 'text-amber-400' : 'text-slate-500'}`}>
                {lightState ? 'RELAY: ON (POWERED)' : 'RELAY: OFF'}
              </div>
            </div>
          </div>

          {/* Top Right: DHT22 SENSOR UNIT */}
          <div className="flex flex-col items-end">
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-lg flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/40">
                <Thermometer className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase">DHT22 SENSOR</span>
                <div className="text-sm font-bold font-mono text-white">{temperature.toFixed(1)}°C</div>
                <div className="text-xs font-mono text-cyan-400 flex items-center justify-end gap-1">
                  <Droplets className="w-3 h-3" />
                  <span>{humidity.toFixed(0)}% RH</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER ROOM STAGE: PERSON / OCCUPANCY STATE */}
        <div className="my-auto flex items-center justify-center relative z-10 py-6">
          {occupancy ? (
            <div className="flex flex-col items-center animate-bounce-short">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                  <User className="w-10 h-10 text-cyan-300" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                </span>
              </div>
              <div className="mt-3 text-center">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                  OCCUPANT PRESENT
                </span>
                <p className="text-[11px] text-cyan-400 font-mono mt-1">PIR triggered • Timer active</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center opacity-40">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
                <User className="w-10 h-10 text-slate-600" />
              </div>
              <div className="mt-3 text-center">
                <span className="px-3 py-1 rounded-full text-xs font-mono text-slate-500 border border-slate-800">
                  ROOM EMPTY
                </span>
                <p className="text-[11px] text-slate-500 font-mono mt-1">No motion detected</p>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM FIXTURES: DOOR & ESP32 CONTROLLER */}
        <div className="flex items-end justify-between relative z-10 pt-4 border-t border-slate-800/60">
          {/* Bottom Left: Room Entry Door */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 flex items-center justify-center">
              <DoorOpen className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">HOSTEL ENTRANCE</span>
              <div className="text-xs font-mono font-bold text-slate-200">Main Doorway</div>
            </div>
          </div>

          {/* Bottom Right: ESP32 IoT Node Controller */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              deviceStatus === 'CONNECTED'
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40'
                : 'bg-rose-950/50 text-rose-400 border-rose-800/40'
            }`}>
              <Wifi className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 uppercase">ESP32 CONTROLLER</span>
              <div className="text-xs font-mono font-bold text-white">ESP32_{roomId}</div>
              <div className="text-[10px] font-mono text-slate-400">Last seen: {lastSeenText}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
