import React from 'react';
import { 
  LayoutDashboard, 
  DoorClosed, 
  Activity, 
  BarChart3, 
  BrainCircuit, 
  Cpu, 
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
  Plug
} from 'lucide-react';
import { Room } from '../types';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  rooms: Room[];
  activeRoomId: string;
  setActiveRoomId: (id: string) => void;
  deviceStatus: 'CONNECTED' | 'OFFLINE';
  isSimulated?: boolean;
  onOpenConnector: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
  rooms,
  activeRoomId,
  setActiveRoomId,
  deviceStatus,
  isSimulated = false,
  onOpenConnector,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rooms', label: 'Rooms', icon: DoorClosed },
    { id: 'live', label: 'Live Monitor', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'ai-insights', label: 'AI Insights', icon: BrainCircuit },
    { id: 'device', label: 'Device', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0d1322]/90 backdrop-blur sticky top-0 z-40">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-wider text-white font-mono">SMART HOSTEL</h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                  IoT PROTOTYPE
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">AI-Powered Room Monitoring & Automation</p>
            </div>
          </div>

          {/* Right Header Status Indicators */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Room Selector */}
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-slate-400 font-mono">ROOM:</span>
              <select
                value={activeRoomId}
                onChange={(e) => setActiveRoomId(e.target.value)}
                aria-label="Select Hostel Room"
                className="bg-transparent text-sm font-bold text-cyan-400 focus:outline-none cursor-pointer"
              >
                {rooms.map((r) => (
                  <option key={r.room_id} value={r.room_id} className="bg-slate-900 text-slate-200">
                    {r.room_id} {r.name ? `(${r.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Hardware Status Dot */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium ${
              deviceStatus === 'CONNECTED'
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
            }`}>
              {deviceStatus === 'CONNECTED' ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ESP32 ● CONNECTED</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>ESP32 ● OFFLINE</span>
                </>
              )}
            </div>

            {/* CONNECT ESP32 BUTTON */}
            <button
              onClick={onOpenConnector}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Plug className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CONNECT ESP32</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-slate-800/60 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
