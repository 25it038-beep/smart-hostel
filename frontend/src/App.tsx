import React, { useState, useEffect, useCallback } from 'react';
import { TopCommandBar } from './components/TopCommandBar';
import { Sidebar, NavTabId } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { ESP32Connector } from './components/ESP32Connector';
import { SimulationBar } from './components/SimulationBar';

// Pages & Components
import { AIWorkspace } from './pages/AIWorkspace';
import { LiveMonitor } from './pages/LiveMonitor';
import { Dashboard } from './pages/Dashboard';
import { Rooms } from './pages/Rooms';
import { CodeViewer } from './components/CodeViewer';
import { Analytics } from './pages/Analytics';
import { AIInsights } from './pages/AIInsights';
import { AgentWorkflow } from './components/AgentWorkflow';
import { IntegratedTerminal } from './components/IntegratedTerminal';
import { VerificationCenter } from './components/VerificationCenter';
import { DevicePage } from './pages/DevicePage';
import { SettingsPage } from './pages/SettingsPage';

// Types & Services
import { Room, SensorReading, RoomSetting } from './types';
import { api } from './services/api';
import { useRoomWebSocket } from './hooks/useWebSocket';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTabId>('chat');
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(true);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [isConnectorOpen, setIsConnectorOpen] = useState<boolean>(false);

  // Core IoT Telemetry State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('ROOM_01');
  const [latestSensor, setLatestSensor] = useState<SensorReading | null>(null);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [settings, setSettings] = useState<RoomSetting | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<'CONNECTED' | 'OFFLINE'>('CONNECTED');
  const [secondsSinceSeen, setSecondsSinceSeen] = useState<number>(2);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Global Ctrl + K command palette keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load Rooms list
  const loadRooms = useCallback(async () => {
    try {
      const data = await api.getRooms();
      setRooms(data);
      if (data.length > 0 && !data.some((r) => r.room_id === activeRoomId)) {
        setActiveRoomId(data[0].room_id);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    }
  }, [activeRoomId]);

  // Load active room telemetry & settings
  const loadRoomData = useCallback(async () => {
    if (!activeRoomId) return;
    try {
      const [roomData, latest, hist, devices, simStatus] = await Promise.all([
        api.getRoom(activeRoomId),
        api.getLatestSensor(activeRoomId),
        api.getSensorHistory(activeRoomId, 60),
        api.getDevices(),
        api.getSimulationStatus(),
      ]);

      if (roomData.settings) {
        setSettings(roomData.settings);
      }
      if (latest) {
        setLatestSensor(latest);
      }
      setHistory(hist);
      setIsSimulating(simStatus.enabled);

      const dev = devices.find((d) => d.room_id === activeRoomId);
      if (dev) {
        setDeviceStatus(dev.status as any);
        setSecondsSinceSeen(dev.seconds_since_seen ?? 2);
      } else {
        setDeviceStatus(simStatus.enabled ? 'CONNECTED' : 'OFFLINE');
      }
    } catch (err) {
      console.error('Failed to load room data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeRoomId]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    loadRoomData();
  }, [loadRoomData]);

  // Real-time WebSocket event dispatcher
  const handleWsMessage = useCallback(
    (msg: any) => {
      if (msg.room_id === activeRoomId) {
        if (msg.event === 'sensor_update') {
          const newReading: SensorReading = {
            room_id: msg.room_id,
            device_id: msg.device_id,
            temperature: msg.temperature,
            humidity: msg.humidity,
            occupancy: msg.occupancy,
            light_state: msg.light_state,
            timestamp: msg.timestamp,
            is_simulated: msg.is_simulated,
          };

          setLatestSensor(newReading);
          setHistory((prev) => [...prev.slice(-99), newReading]);
          setDeviceStatus('CONNECTED');
          setSecondsSinceSeen(1);
        } else if (msg.event === 'light_command_dispatched') {
          if (latestSensor) {
            setLatestSensor({
              ...latestSensor,
              light_state: msg.light_state,
            });
          }
        }
      }
    },
    [activeRoomId, latestSensor]
  );

  useRoomWebSocket(activeRoomId, handleWsMessage);

  // Heartbeat counter
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSinceSeen((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeRoom = rooms.find((r) => r.room_id === activeRoomId) || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#07080c] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 antialiased">
      {/* Top Universal Command Bar */}
      <TopCommandBar
        rooms={rooms}
        activeRoomId={activeRoomId}
        setActiveRoomId={setActiveRoomId}
        deviceStatus={deviceStatus}
        onOpenConnector={() => setIsConnectorOpen(true)}
        onOpenCommandPalette={() => setIsPaletteOpen(true)}
        onOpenNotifications={() => {
          alert('Hostel OS Notification: All microservices and failsafe safety timers operating normally.');
        }}
      />

      {/* Global Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          setIsPaletteOpen(false);
        }}
        onTriggerMotion={async () => {
          await api.triggerMotion();
          loadRoomData();
        }}
        onToggleLight={async (turnOn) => {
          await api.sendLightCommand(activeRoomId, undefined, turnOn);
          loadRoomData();
        }}
        onOpenConnector={() => {
          setIsPaletteOpen(false);
          setIsConnectorOpen(true);
        }}
      />

      {/* ESP32 Hardware Connector Modal (Dual Wi-Fi & WebSerial 115200) */}
      <ESP32Connector
        activeRoomId={activeRoomId}
        deviceStatus={deviceStatus}
        isOpen={isConnectorOpen}
        onClose={() => setIsConnectorOpen(false)}
        onSerialTelemetry={(data) => {
          setLatestSensor(data);
          setHistory((prev) => [...prev.slice(-99), data]);
          setDeviceStatus('CONNECTED');
          setSecondsSinceSeen(1);
        }}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isExpanded={sidebarExpanded}
          setIsExpanded={setSidebarExpanded}
          deviceConnected={deviceStatus === 'CONNECTED'}
        />

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#07080c]">
          {/* Simulation Notification & Mode Controller */}
          <SimulationBar
            isSimulating={isSimulating}
            onSimulationChange={(active) => {
              setIsSimulating(active);
              loadRoomData();
            }}
            activeRoomId={activeRoomId}
          />

          {/* Tab View Container */}
          <main className="flex-1 p-4 sm:p-6 max-w-[1680px] w-full mx-auto">
            {loading ? (
              <div className="flex items-center justify-center min-h-[450px]">
                <div className="flex flex-col items-center gap-3 font-mono text-cyan-400">
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs tracking-wider">SYNCING HOSTEL TELEMETRY MATRIX...</span>
                </div>
              </div>
            ) : (
              <>
                {/* 1. AI Workspace / Agent Chat */}
                {currentTab === 'chat' && (
                  <AIWorkspace
                    activeRoomId={activeRoomId}
                    onNavigateToTab={setCurrentTab}
                    onSimulateMotion={async () => {
                      await api.triggerMotion();
                      loadRoomData();
                    }}
                  />
                )}

                {/* 2. Live Architectural 3D Monitor */}
                {currentTab === 'live' && (
                  <LiveMonitor
                    roomId={activeRoomId}
                    latestSensor={latestSensor}
                    settings={settings}
                    deviceStatus={deviceStatus}
                    secondsSinceSeen={secondsSinceSeen}
                  />
                )}

                {/* 3. Operational Dashboard */}
                {currentTab === 'dashboard' && (
                  <Dashboard
                    roomId={activeRoomId}
                    latestSensor={latestSensor}
                    history={history}
                    settings={settings}
                    deviceStatus={deviceStatus}
                    secondsSinceSeen={secondsSinceSeen}
                    onRefresh={loadRoomData}
                  />
                )}

                {/* 4. Dorm Rooms Multi-Room Manager */}
                {currentTab === 'rooms' && (
                  <Rooms
                    rooms={rooms}
                    activeRoomId={activeRoomId}
                    setActiveRoomId={setActiveRoomId}
                    onRefreshRooms={loadRooms}
                  />
                )}

                {/* 5. Code & Project Explorer */}
                {currentTab === 'code' && <CodeViewer />}

                {/* 6. Historical Telemetry & Sensor Analytics */}
                {currentTab === 'analytics' && <Analytics roomId={activeRoomId} />}

                {/* 7. Empirical AI & Psychrometric Anomaly Engine */}
                {currentTab === 'ai-insights' && <AIInsights roomId={activeRoomId} />}

                {/* 8. Autonomous Agent Workflow Pipeline */}
                {currentTab === 'workflow' && (
                  <AgentWorkflow onNavigateToCode={() => setCurrentTab('code')} />
                )}

                {/* 9. Integrated OS Terminal & Pytest Suite */}
                {currentTab === 'terminal' && (
                  <IntegratedTerminal
                    activeRoomId={activeRoomId}
                    latestSensor={latestSensor}
                    settings={settings}
                    onRefreshData={loadRoomData}
                  />
                )}

                {/* 10. Architectural Requirement Verification Center */}
                {currentTab === 'verification' && (
                  <VerificationCenter onNavigateToCode={() => setCurrentTab('code')} />
                )}

                {/* 11. ESP32 Hardware & Diagnostics Page */}
                {currentTab === 'device' && (
                  <DevicePage
                    activeRoomId={activeRoomId}
                    onOpenConnector={() => setIsConnectorOpen(true)}
                  />
                )}

                {/* 12. System Settings & Timing Thresholds */}
                {currentTab === 'settings' && (
                  <SettingsPage
                    roomId={activeRoomId}
                    room={activeRoom}
                    settings={settings}
                    onSettingsUpdated={loadRoomData}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Sleek Engineering OS Status Bar */}
      <footer className="h-7 border-t border-white/[0.06] bg-[#050609] px-4 flex items-center justify-between text-[11px] font-mono text-slate-500 select-none z-20">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>HOSTEL OS 2.4</span>
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline text-slate-400">ROOM: {activeRoomId}</span>
          <span className="hidden md:inline text-slate-600">•</span>
          <span className="hidden md:inline text-slate-400">
            FAILSAFE TIMEOUT: {settings?.inactivity_timeout_sec || 60}s
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-400">
            LDR CONSTRAINT: <span className="text-emerald-400 font-bold">COMPLIANT (EXCLUDED)</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400">WS CONNECTED</span>
        </div>
      </footer>
    </div>
  );
}
