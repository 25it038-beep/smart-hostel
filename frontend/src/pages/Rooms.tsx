import React, { useState } from 'react';
import { DoorClosed, Plus, Thermometer, Droplets, Users, Lightbulb, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { Room } from '../types';
import { api } from '../services/api';

interface RoomsProps {
  rooms: Room[];
  activeRoomId: string;
  setActiveRoomId: (id: string) => void;
  onRefreshRooms: () => void;
}

export const Rooms: React.FC<RoomsProps> = ({
  rooms,
  activeRoomId,
  setActiveRoomId,
  onRefreshRooms,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomId, setNewRoomId] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [error, setError] = useState('');

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newRoomId || !newRoomName) {
      setError('Please provide both Room ID and Room Name.');
      return;
    }

    try {
      await api.createRoom(newRoomId.trim().toUpperCase(), newRoomName.trim());
      setNewRoomId('');
      setNewRoomName('');
      setShowAddModal(false);
      onRefreshRooms();
    } catch (err: any) {
      setError(err.message || 'Failed to register room.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono tracking-wide">HOSTEL ROOM MANAGEMENT</h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor and manage multiple IoT-enabled hostel dormitory rooms.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs shadow-md shadow-cyan-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>REGISTER NEW ROOM</span>
        </button>
      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const isSelected = room.room_id === activeRoomId;
          const isConnected = room.device_status === 'CONNECTED';
          const reading = room.latest_reading;

          return (
            <div
              key={room.room_id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isSelected
                  ? 'border-cyan-500/50 bg-gradient-to-b from-[#111a2f] to-[#0c1322] shadow-xl shadow-cyan-950/20 ring-1 ring-cyan-500/30'
                  : 'border-slate-800 bg-[#0d1322] hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <DoorClosed className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-base font-bold font-mono text-white">{room.room_id}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{room.name}</p>
                </div>

                <div className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border flex items-center gap-1.5 ${
                  isConnected
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                    : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                }`}>
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3 text-emerald-400" />
                      <span>ONLINE</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-rose-400" />
                      <span>OFFLINE</span>
                    </>
                  )}
                </div>
              </div>

              {/* Card Body - Live Readings */}
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-cyan-400" /> Temp
                    </span>
                    <div className="text-lg font-bold font-mono text-white mt-1">
                      {reading ? `${reading.temperature.toFixed(1)}°C` : '--'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-blue-400" /> Humidity
                    </span>
                    <div className="text-lg font-bold font-mono text-white mt-1">
                      {reading ? `${reading.humidity.toFixed(0)}%` : '--'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className={reading?.occupancy ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
                      {reading?.occupancy ? 'OCCUPIED' : 'EMPTY'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-slate-400" />
                    <span className={reading?.light_state ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                      LIGHT {reading?.light_state ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-900/40 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">
                  Node: ESP32_{room.room_id}
                </span>

                {isSelected ? (
                  <span className="flex items-center gap-1 text-xs font-mono font-bold text-cyan-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ACTIVE VIEW
                  </span>
                ) : (
                  <button
                    onClick={() => setActiveRoomId(room.room_id)}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 transition-colors"
                  >
                    SELECT ROOM
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl">
            <h3 className="text-base font-bold font-mono text-white mb-2">ADD HOSTEL DORMITORY ROOM</h3>
            <p className="text-xs text-slate-400 mb-4">
              Register a new hostel room identifier for future ESP32 node allocation.
            </p>

            {error && (
              <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAddRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Room Identifier (e.g. ROOM_02)
                </label>
                <input
                  type="text"
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  placeholder="ROOM_02"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Room Friendly Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Floor 2 - Dorm 204"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs shadow-md shadow-cyan-500/20"
                >
                  CONFIRM REGISTRATION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
