import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Activity, 
  LayoutDashboard, 
  DoorClosed, 
  Code2, 
  BarChart3, 
  BrainCircuit, 
  GitPullRequest, 
  Terminal, 
  CheckSquare2, 
  Cpu, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';

export type NavTabId = 
  | 'chat' 
  | 'live' 
  | 'dashboard' 
  | 'rooms' 
  | 'code' 
  | 'analytics' 
  | 'ai-insights' 
  | 'workflow' 
  | 'terminal' 
  | 'verification' 
  | 'device' 
  | 'settings';

interface SidebarProps {
  currentTab: NavTabId;
  setCurrentTab: (tab: NavTabId) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  deviceConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isExpanded,
  setIsExpanded,
  deviceConnected,
}) => {
  // Toggle shortcut Ctrl + B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsExpanded(!isExpanded);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, setIsExpanded]);

  const navItems: {
    id: NavTabId;
    label: string;
    icon: any;
    shortcut?: string;
    badge?: string;
    badgeType?: 'emerald' | 'cyan' | 'purple' | 'amber';
  }[] = [
    { id: 'chat', label: 'AI Workspace', icon: Bot, shortcut: '1', badge: 'AGENT', badgeType: 'purple' },
    { id: 'live', label: 'Live Monitor', icon: Activity, shortcut: '2', badge: '3D MAP', badgeType: 'cyan' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: '3' },
    { id: 'rooms', label: 'Dorm Rooms', icon: DoorClosed, shortcut: '4' },
    { id: 'code', label: 'Code & Files', icon: Code2, shortcut: '5' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, shortcut: '6' },
    { id: 'ai-insights', label: 'AI Intelligence', icon: BrainCircuit, shortcut: '7', badge: 'KDE', badgeType: 'purple' },
    { id: 'workflow', label: 'Agent Tasks', icon: GitPullRequest, shortcut: '8' },
    { id: 'terminal', label: 'Terminal', icon: Terminal, shortcut: '9' },
    { id: 'verification', label: 'Verification', icon: CheckSquare2, badge: '98%', badgeType: 'emerald' },
    { id: 'device', label: 'ESP32 Device', icon: Cpu, badge: deviceConnected ? 'LIVE' : 'OFFLINE', badgeType: deviceConnected ? 'emerald' : 'amber' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col justify-between border-r border-white/[0.07] bg-[#080a0f] transition-all duration-300 ease-in-out select-none ${
        isExpanded ? 'w-56' : 'w-14'
      }`}
    >
      {/* Top Header / App Logo */}
      <div>
        <div className="h-12 border-b border-white/[0.06] flex items-center justify-between px-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-cyan-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            {isExpanded && (
              <div className="flex flex-col truncate">
                <span className="font-mono font-bold text-xs text-white tracking-wider">SMART HOSTEL</span>
                <span className="text-[9px] font-mono text-cyan-400 -mt-0.5 tracking-tight">AI PLATFORM OS</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-white/[0.08] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Sidebar (Ctrl+B)' : 'Expand Sidebar (Ctrl+B)'}
          >
            {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
                title={!isExpanded ? `${item.label} (${item.shortcut || ''})` : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  {isExpanded && (
                    <span className="truncate tracking-wide">{item.label}</span>
                  )}
                </div>

                {isExpanded && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase tracking-wider ${
                          item.badgeType === 'emerald'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                            : item.badgeType === 'cyan'
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                            : item.badgeType === 'purple'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.shortcut && (
                      <span className="text-[10px] text-slate-600 group-hover:text-slate-500 font-mono">
                        {item.shortcut}
                      </span>
                    )}
                  </div>
                )}

                {/* Left Active Glow Indicator Strip */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-2 border-t border-white/[0.06] text-[10px] font-mono text-slate-500">
        {isExpanded ? (
          <div className="px-2 py-1 flex items-center justify-between">
            <span>Toggle: <kbd className="text-slate-400">Ctrl B</kbd></span>
            <span className="text-cyan-400 font-bold">v2.4 Pro</span>
          </div>
        ) : (
          <div className="text-center py-1 text-[9px] text-slate-600">v2.4</div>
        )}
      </div>
    </aside>
  );
};
