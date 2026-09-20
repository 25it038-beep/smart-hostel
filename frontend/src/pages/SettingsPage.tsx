import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  CheckCircle2, 
  Sliders, 
  Timer, 
  Cpu, 
  Home, 
  Layers 
} from 'lucide-react';
import { RoomSetting, Room } from '../types';
import { api } from '../services/api';

interface SettingsPageProps {
  roomId: string;
  room: Room | null;
  settings: RoomSetting | null;
  onSettingsUpdated: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  roomId,
  room,
  settings,
  onSettingsUpdated,
}) => {
  const [lightMode, setLightMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [timeoutSec, setTimeoutSec] = useState<number>(60);
  const [tempInterval, setTempInterval] = useState<number>(5);
  const [humInterval, setHumInterval] = useState<number>(5);
  const [heartbeatInterval, setHeartbeatInterval] = useState<number>(10);
  const [roomName, setRoomName] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setLightMode(settings.light_mode);
      setTimeoutSec(settings.inactivity_timeout_sec);
      setTempInterval(settings.temperature_interval_sec);
      setHumInterval(settings.humidity_interval_sec);
      setHeartbeatInterval(settings.heartbeat_interval_sec);
    }
    if (room) {
      setRoomName(room.name);
    }
  }, [settings, room]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await api.updateRoomSettings(roomId, {
        light_mode: lightMode,
        inactivity_timeout_sec: timeoutSec,
        temperature_interval_sec: tempInterval,
        humidity_interval_sec: humInterval,
        heartbeat_interval_sec: heartbeatInterval,
      });

      setSavedSuccess(true);
      onSettingsUpdated();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono tracking-wide">SYSTEM & ROOM SETTINGS</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure automation timers, sensor polling rates, and dormitory profiles for {roomId}.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-mono font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>CHANGES SAVED</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 18.1: LIGHT AUTOMATION SETTINGS */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-white font-mono font-bold text-sm border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>LIGHT AUTOMATION SETTINGS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operating Mode */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-2">
                Operating Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLightMode('AUTO')}
                  className={`p-3 rounded-xl border text-xs font-mono font-bold transition-all text-center ${
                    lightMode === 'AUTO'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  AUTO (PIR SENSOR)
                </button>
                <button
                  type="button"
                  onClick={() => setLightMode('MANUAL')}
                  className={`p-3 rounded-xl border text-xs font-mono font-bold transition-all text-center ${
                    lightMode === 'MANUAL'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  MANUAL (OVERRIDE)
                </button>
              </div>
            </div>

            {/* Inactivity Timeout Config */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-2">
                Light Inactivity Timeout
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setTimeoutSec(sec)}
                    className={`py-2.5 rounded-lg border text-xs font-mono font-bold transition-all text-center ${
                      timeoutSec === sec
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-2">
                Default: 60 seconds. Inactivity timer begins when PIR output returns to LOW.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 18.2: SENSOR & HEARTBEAT INTERVALS */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-white font-mono font-bold text-sm border-b border-slate-800 pb-3">
            <Timer className="w-4 h-4 text-cyan-400" />
            <span>SENSOR & TELEMETRY INTERVALS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                Temperature Interval (sec)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={tempInterval}
                onChange={(e) => setTempInterval(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                Humidity Interval (sec)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={humInterval}
                onChange={(e) => setHumInterval(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                Heartbeat Interval (sec)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={heartbeatInterval}
                onChange={(e) => setHeartbeatInterval(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 18.3: ROOM IDENTITY */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-white font-mono font-bold text-sm border-b border-slate-800 pb-3">
            <Home className="w-4 h-4 text-cyan-400" />
            <span>ROOM IDENTITY & LABELS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                Room ID (Fixed Key)
              </label>
              <input
                type="text"
                value={roomId}
                disabled
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 font-mono text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                Room Display Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'PERSISTING...' : 'SAVE SETTINGS'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
