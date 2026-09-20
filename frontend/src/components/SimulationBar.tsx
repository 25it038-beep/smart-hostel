import React, { useState } from 'react';
import { Play, Square, UserCheck, Flame, Info, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface SimulationBarProps {
  isSimulating: boolean;
  onSimulationChange: (active: boolean) => void;
  activeRoomId: string;
}

export const SimulationBar: React.FC<SimulationBarProps> = ({
  isSimulating,
  onSimulationChange,
  activeRoomId,
}) => {
  const [loading, setLoading] = useState(false);
  const [motionTriggered, setMotionTriggered] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const nextState = !isSimulating;
      await api.toggleSimulation(nextState, activeRoomId, true);
      onSimulationChange(nextState);
    } catch (err) {
      console.error('Failed to toggle simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerMotion = async () => {
    try {
      setMotionTriggered(true);
      await api.triggerMotion();
      setTimeout(() => setMotionTriggered(false), 2000);
    } catch (err) {
      console.error('Failed to trigger motion:', err);
    }
  };

  return (
    <div className={`border-b transition-colors duration-200 ${
      isSimulating 
        ? 'bg-amber-950/30 border-amber-800/60' 
        : 'bg-slate-900/40 border-slate-800/80'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isSimulating ? 'bg-amber-400 animate-ping' : 'bg-slate-500'}`} />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-300">
            DATA SOURCE:
          </span>
          {isSimulating ? (
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-extrabold bg-amber-500 text-slate-950 border border-amber-400 uppercase tracking-widest shadow-sm">
              ⚠ SIMULATED DATA (PROTOTYPE DEMO MODE)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
              PHYSICAL ESP32 HARDWARE STREAM
            </span>
          )}
          <span className="text-xs text-slate-400 hidden lg:inline">
            {isSimulating
              ? 'Emulating DHT22 and HC-SR501 PIR sensor readings in software.'
              : 'Waiting for live telemetry packets from physical ESP32 Wi-Fi module.'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isSimulating && (
            <button
              onClick={handleTriggerMotion}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold transition-all border ${
                motionTriggered
                  ? 'bg-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-500/30'
                  : 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80 hover:bg-cyan-900'
              }`}
            >
              {motionTriggered ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PIR MOTION DETECTED!</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>SIMULATE PIR MOTION</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleToggle}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold transition-all border ${
              isSimulating
                ? 'bg-rose-950/80 text-rose-300 border-rose-700/80 hover:bg-rose-900'
                : 'bg-amber-950/80 text-amber-300 border-amber-700/80 hover:bg-amber-900'
            }`}
          >
            {isSimulating ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>STOP SIMULATION</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-amber-300" />
                <span>START SIMULATION MODE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
