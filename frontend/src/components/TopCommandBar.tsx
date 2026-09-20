import React from 'react';
import { 
  Terminal, 
  GitBranch, 
  CheckCircle2, 
  Search, 
  Wifi, 
  WifiOff, 
  Plug, 
  Bell, 
  User, 
  Sparkles,
  Command
} from 'lucide-react';
import { Room } from '../types';

interface TopCommandBarProps {
  rooms: Room[];
  activeRoomId: string;
  setActiveRoomId: (id: string) => void;
  deviceStatus: 'CONNECTED' | 'OFFLINE';
  onOpenConnector: () => void;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
}

export const TopCommandBar: React.FC<TopCommandBarProps> = ({
  rooms,
  activeRoomId,
  setActiveRoomId,
  deviceStatus,
  onOpenConnector,
  onOpenCommandPalette,
  onOpenNotifications,
}) => {
  return (
    <header className="h-12 border-b border-white/[0.07] bg-[#090b10]/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 font-mono select-none text-xs">
      {/* Left Segment: Project & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-white/[0.08]">
          <div className="w-5 h-5 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="font-bold tracking-wider text-slate-200 uppercase">
            PROJECT / <span className="text-white">HOSTEL AI OS</span>
          </span>
        </div>

        {/* Agent Online Status */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Agent Online</span>
        </div>

        {/* Model Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-[11px] pl-1">
          <span className="text-slate-600">MODEL /</span>
          <span className="text-emerald-300 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            MOONSHOT AI KIMI K3 (FAST DIRECT • ZERO-REASONING)
          </span>
        </div>

        {/* Git Branch & Sync */}
        <div className="hidden xl:flex items-center gap-3 pl-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1 text-slate-400">
            <GitBranch className="w-3 h-3" />
            <span>main</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-400/90">
            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
            <span>SYNCED</span>
          </div>
        </div>
      </div>

      {/* Center Search / Command Palette Shortcut */}
      <button
        onClick={onOpenCommandPalette}
        className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] hover:border-white/20 text-slate-400 hover:text-slate-200 transition-all cursor-pointer text-xs group"
        title="Open Command Palette (Ctrl+K)"
      >
        <Search className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        <span className="hidden sm:inline text-slate-400">Search commands or files...</span>
        <span className="sm:hidden text-slate-400">Search</span>
        <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-[10px] text-slate-400 font-mono">
          Ctrl K
        </kbd>
      </button>

      {/* Right Segment: Hardware Controls, Room Selector, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Room Switcher */}
        <div className="flex items-center gap-1.5 bg-black/40 border border-white/[0.08] px-2.5 py-1 rounded-md text-[11px]">
          <span className="text-slate-500 text-[10px]">ROOM:</span>
          <select
            value={activeRoomId}
            onChange={(e) => setActiveRoomId(e.target.value)}
            aria-label="Select Hostel Room"
            className="bg-transparent text-cyan-400 font-bold focus:outline-none cursor-pointer text-xs"
          >
            {rooms.map((r) => (
              <option key={r.room_id} value={r.room_id} className="bg-[#0b0e14] text-slate-200">
                {r.room_id}
              </option>
            ))}
          </select>
        </div>

        {/* ESP32 Hardware Status Badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium ${
          deviceStatus === 'CONNECTED'
            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
            : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
        }`}>
          {deviceStatus === 'CONNECTED' ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>ESP32 ● ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-rose-400" />
              <span>ESP32 ● OFFLINE</span>
            </>
          )}
        </div>

        {/* Connect ESP32 Button */}
        <button
          onClick={onOpenConnector}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] transition-all cursor-pointer shadow-sm"
          title="Connect ESP32 via Wi-Fi or USB"
        >
          <Plug className="w-3 h-3 text-cyan-400" />
          <span className="hidden md:inline">PAIR ESP32</span>
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors relative cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </button>

        {/* Profile Avatar */}
        <div className="w-6 h-6 rounded bg-gradient-to-tr from-cyan-600 to-indigo-600 border border-white/20 flex items-center justify-center text-white text-[10px] font-bold">
          HS
        </div>
      </div>
    </header>
  );
};
