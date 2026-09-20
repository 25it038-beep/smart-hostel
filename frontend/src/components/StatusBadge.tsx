import React from 'react';

interface StatusBadgeProps {
  type: 'connection' | 'occupancy' | 'light' | 'mode';
  status: string | boolean;
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status, pulse = false }) => {
  if (type === 'connection') {
    const isConnected = status === 'CONNECTED' || status === true;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
        isConnected 
          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60' 
          : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
      }`}>
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'} ${pulse && isConnected ? 'animate-ping' : ''}`} />
        {isConnected ? '● CONNECTED' : '● OFFLINE'}
      </span>
    );
  }

  if (type === 'occupancy') {
    const isOccupied = status === true || status === 'OCCUPIED';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
        isOccupied 
          ? 'bg-cyan-950/40 text-cyan-400 border-cyan-800/60' 
          : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
      }`}>
        <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
        {isOccupied ? '● OCCUPIED' : '● EMPTY'}
      </span>
    );
  }

  if (type === 'light') {
    const isOn = status === true || status === 'ON';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
        isOn 
          ? 'bg-amber-950/40 text-amber-300 border-amber-700/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]' 
          : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
      }`}>
        <span className={`w-2 h-2 rounded-full ${isOn ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
        {isOn ? '● LIGHT ON' : '● LIGHT OFF'}
      </span>
    );
  }

  if (type === 'mode') {
    const isAuto = status === 'AUTO';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono border ${
        isAuto 
          ? 'bg-blue-950/40 text-blue-400 border-blue-800/60' 
          : 'bg-purple-950/40 text-purple-400 border-purple-800/60'
      }`}>
        {isAuto ? 'AUTO' : 'MANUAL'}
      </span>
    );
  }

  return null;
};
