import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Bot, 
  Activity, 
  LayoutDashboard, 
  Code2, 
  Cpu, 
  Settings, 
  Terminal, 
  BarChart3, 
  BrainCircuit, 
  Sparkles, 
  Play, 
  Power, 
  FileCode, 
  CheckSquare2,
  CornerDownLeft,
  X
} from 'lucide-react';
import { NavTabId } from './Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTabId) => void;
  onTriggerMotion: () => void;
  onToggleLight: (turnOn: boolean) => void;
  onOpenConnector: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onTriggerMotion,
  onToggleLight,
  onOpenConnector,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Command items catalog
  const commands = [
    { id: 'chat', label: 'AI Workspace / Open Agent Chat', category: 'Navigation', icon: Bot, action: () => onNavigate('chat') },
    { id: 'live', label: 'Live Architectural Monitor (3D Room)', category: 'Navigation', icon: Activity, action: () => onNavigate('live') },
    { id: 'dashboard', label: 'Dashboard Overview & Controls', category: 'Navigation', icon: LayoutDashboard, action: () => onNavigate('dashboard') },
    { id: 'code', label: 'Code & File Explorer', category: 'Navigation', icon: Code2, action: () => onNavigate('code') },
    { id: 'analytics', label: 'Sensor Analytics & Recharts', category: 'Navigation', icon: BarChart3, action: () => onNavigate('analytics') },
    { id: 'ai-insights', label: 'AI Intelligence & Anomaly Report', category: 'Navigation', icon: BrainCircuit, action: () => onNavigate('ai-insights') },
    { id: 'verification', label: 'Verification Center & Compliance', category: 'Navigation', icon: CheckSquare2, action: () => onNavigate('verification') },
    { id: 'terminal', label: 'Integrated Terminal & Logs', category: 'Navigation', icon: Terminal, action: () => onNavigate('terminal') },
    { id: 'device', label: 'ESP32 Device Telemetry', category: 'Navigation', icon: Cpu, action: () => onNavigate('device') },
    { id: 'settings', label: 'Automation & Timeout Settings', category: 'Navigation', icon: Settings, action: () => onNavigate('settings') },
    
    // Quick Actions
    { id: 'motion', label: 'Simulate PIR Motion Trigger', category: 'Action', icon: Play, action: onTriggerMotion },
    { id: 'light-on', label: 'Turn Room Light ON (Relay Trigger)', category: 'Action', icon: Power, action: () => onToggleLight(true) },
    { id: 'light-off', label: 'Turn Room Light OFF', category: 'Action', icon: Power, action: () => onToggleLight(false) },
    { id: 'pair-esp32', label: 'Pair Physical ESP32 (Wi-Fi or USB)', category: 'Action', icon: Cpu, action: onOpenConnector },
    
    // File Jump
    { id: 'file-firmware', label: 'esp32/smart_hostel.ino', category: 'Files', icon: FileCode, action: () => onNavigate('code') },
    { id: 'file-backend', label: 'backend/app/main.py', category: 'Files', icon: FileCode, action: () => onNavigate('code') },
    { id: 'file-ai', label: 'backend/app/ai/anomaly_detection.py', category: 'Files', icon: FileCode, action: () => onNavigate('code') },
  ];

  const filtered = commands.filter(c => 
    c.label.toLowerCase().includes(query.toLowerCase()) || 
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl rounded-xl border border-white/15 bg-[#0b0e14] shadow-2xl overflow-hidden font-mono text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] bg-[#0f121a]">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, file name, or action..."
            className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-xs"
          />
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-white/[0.03]">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No matching commands or files found for "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30' : 'text-slate-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3 h-3 text-cyan-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 bg-black/40 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-500">
          <span>Navigate: <kbd className="text-slate-400">↑</kbd> <kbd className="text-slate-400">↓</kbd></span>
          <span>Execute: <kbd className="text-slate-400">Enter ↵</kbd></span>
          <span>Dismiss: <kbd className="text-slate-400">Esc</kbd></span>
        </div>
      </div>
    </div>
  );
};
