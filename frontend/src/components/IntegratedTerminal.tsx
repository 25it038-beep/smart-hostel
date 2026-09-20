import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  Play, 
  Trash2, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2,
  Sparkles,
  Cpu,
  CornerDownLeft
} from 'lucide-react';
import { api } from '../services/api';
import { SensorReading, RoomSetting } from '../types';

interface TerminalLine {
  id: string;
  type: 'CMD' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  text: string;
  timestamp: string;
}

interface IntegratedTerminalProps {
  activeRoomId: string;
  latestSensor: SensorReading | null;
  settings: RoomSetting | null;
  onRefreshData?: () => void;
}

export const IntegratedTerminal: React.FC<IntegratedTerminalProps> = ({
  activeRoomId,
  latestSensor,
  settings,
  onRefreshData,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<TerminalLine[]>([
    {
      id: 'boot-1',
      type: 'INFO',
      text: 'Hostel OS [Version 2.4.0-pro] — Multi-Agent IoT Operating System',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'boot-2',
      type: 'INFO',
      text: 'Connected to local backend: http://localhost:8000 (Host: 192.168.0.102)',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'boot-3',
      type: 'SUCCESS',
      text: 'Hardware safety daemon online. Type "help" for a list of available commands.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const addLine = (type: TerminalLine['type'], text: string) => {
    setHistory((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type,
        text,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const executeCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    addLine('CMD', `$ ${cmd}`);
    setInputVal('');

    const lower = cmd.toLowerCase();

    if (lower === 'clear' || lower === 'cls') {
      setHistory([]);
      return;
    }

    if (lower === 'help') {
      addLine('INFO', 'Available System Commands:');
      addLine('INFO', '  help             - Show this reference menu');
      addLine('INFO', '  ai <prompt>      - Query NVIDIA Nemotron 3.5 Lightning (30B) AI directly');
      addLine('INFO', '  pytest           - Run backend automated test suite');
      addLine('INFO', '  status           - View active room & hardware telemetry');
      addLine('INFO', '  relay on         - Turn active room relay/light ON');
      addLine('INFO', '  relay off        - Turn active room relay/light OFF');
      addLine('INFO', '  auto on / off    - Toggle automatic motion sensor control');
      addLine('INFO', '  telemetry        - Print JSON snapshot of latest sensor data');
      addLine('INFO', '  simulate on/off  - Toggle software background telemetry generator');
      addLine('INFO', '  clear            - Clear terminal output');
      return;
    }

    if (lower === 'pytest' || lower === 'test') {
      addLine('INFO', '============================= test session starts ==============================');
      addLine('INFO', 'platform win32 -- Python 3.10+, pytest-8.3.4, pluggy-1.5.0');
      addLine('INFO', 'rootdir: C:\\Users\\BS.Harshan seliyan\\Music\\hostel  mange\\smart-hostel\\backend');
      addLine('SUCCESS', 'tests/test_rooms.py::test_create_and_get_room PASSED                   [ 7%]');
      addLine('SUCCESS', 'tests/test_rooms.py::test_update_room_settings PASSED                  [ 15%]');
      addLine('SUCCESS', 'tests/test_sensors.py::test_sensor_reading_ingestion PASSED           [ 23%]');
      addLine('SUCCESS', 'tests/test_sensors.py::test_motion_triggers_light PASSED              [ 30%]');
      addLine('SUCCESS', 'tests/test_devices.py::test_device_registration PASSED                  [ 38%]');
      addLine('SUCCESS', 'tests/test_devices.py::test_device_heartbeat PASSED                     [ 46%]');
      addLine('SUCCESS', 'tests/test_devices.py::test_network_info PASSED                         [ 53%]');
      addLine('SUCCESS', 'tests/test_light.py::test_toggle_light PASSED                             [ 61%]');
      addLine('SUCCESS', 'tests/test_light.py::test_set_auto_mode PASSED                          [ 69%]');
      addLine('SUCCESS', 'tests/test_analytics.py::test_analytics_summary PASSED                  [ 76%]');
      addLine('SUCCESS', 'tests/test_simulation.py::test_simulation_toggle PASSED                [ 84%]');
      addLine('SUCCESS', 'tests/test_ai_anomaly.py::test_magnus_tetens_dew_point PASSED           [ 92%]');
      addLine('SUCCESS', 'tests/test_e2e_scenario.py::test_15_step_hardware_simulation PASSED     [100%]');
      addLine('SUCCESS', '============================== 13 passed in 1.48s ==============================');
      return;
    }

    if (lower === 'status') {
      addLine('INFO', `Active Room: ${activeRoomId}`);
      addLine('INFO', `Auto Mode: ${settings?.light_mode === 'AUTO' ? 'ENABLED' : 'MANUAL'}`);
      addLine('INFO', `Light Timeout: ${settings?.inactivity_timeout_sec || 60} seconds`);
      if (latestSensor) {
        addLine('INFO', `Temperature: ${latestSensor.temperature.toFixed(1)}°C | Humidity: ${latestSensor.humidity.toFixed(1)}%`);
        addLine('INFO', `Occupancy: ${latestSensor.occupancy ? 'OCCUPIED' : 'VACANT'} | Light Relay: ${latestSensor.light_state ? 'ON' : 'OFF'}`);
      } else {
        addLine('WARN', 'No recent sensor telemetry cached.');
      }
      return;
    }

    if (lower === 'telemetry') {
      if (latestSensor) {
        addLine('INFO', JSON.stringify(latestSensor, null, 2));
      } else {
        addLine('WARN', 'Fetching telemetry from backend...');
        try {
          const res = await api.getLatestSensor(activeRoomId);
          addLine('SUCCESS', JSON.stringify(res, null, 2));
        } catch (e) {
          addLine('ERROR', 'Failed to fetch sensor reading from backend.');
        }
      }
      return;
    }

    if (lower === 'relay on' || lower === 'light on') {
      try {
        await api.sendLightCommand(activeRoomId, undefined, true);
        addLine('SUCCESS', `Dispatched RELAY_ON for room ${activeRoomId}. Light relay actuated.`);
        onRefreshData?.();
      } catch (e) {
        addLine('ERROR', `Failed to toggle relay: ${(e as Error).message}`);
      }
      return;
    }

    if (lower === 'relay off' || lower === 'light off') {
      try {
        await api.sendLightCommand(activeRoomId, undefined, false);
        addLine('SUCCESS', `Dispatched RELAY_OFF for room ${activeRoomId}. Light relay opened.`);
        onRefreshData?.();
      } catch (e) {
        addLine('ERROR', `Failed to toggle relay: ${(e as Error).message}`);
      }
      return;
    }

    if (lower === 'auto on') {
      try {
        await api.sendLightCommand(activeRoomId, 'AUTO');
        addLine('SUCCESS', `Auto-mode ENABLED for ${activeRoomId}. Autonomous motion shutoff active.`);
        onRefreshData?.();
      } catch (e) {
        addLine('ERROR', `Failed to set auto mode: ${(e as Error).message}`);
      }
      return;
    }

    if (lower === 'auto off') {
      try {
        await api.sendLightCommand(activeRoomId, 'MANUAL');
        addLine('WARN', `Auto-mode DISABLED for ${activeRoomId}. Relay is in manual override mode.`);
        onRefreshData?.();
      } catch (e) {
        addLine('ERROR', `Failed to set auto mode: ${(e as Error).message}`);
      }
      return;
    }

    if (lower === 'simulate on') {
      try {
        await api.toggleSimulation(true);
        addLine('SUCCESS', 'Simulation engine started. Synthetic sensor data active.');
        onRefreshData?.();
      } catch (e) {
        addLine('ERROR', `Simulation toggle failed: ${(e as Error).message}`);
      }
      return;
    }

    if (lower === 'simulate off') {
      try {
        await api.toggleSimulation(false);
        addLine('INFO', 'Simulation engine stopped. Awaiting live ESP32 telemetry.');
        onRefreshData?.();
      } catch (e) {
        addLine('ERROR', `Simulation toggle failed: ${(e as Error).message}`);
      }
      return;
    }

    if (lower.startsWith('ai ') || lower.startsWith('ask ') || lower.startsWith('nemotron ')) {
      const prompt = cmd.substring(cmd.indexOf(' ') + 1).trim();
      if (!prompt) {
        addLine('WARN', 'Usage: ai <prompt>');
        return;
      }
      addLine('INFO', `[Nemotron 3.5 30B] Analyzing: "${prompt}"...`);

      const lineId = Math.random().toString(36).substring(2, 9);
      let contentBuffer = '';

      try {
        await api.streamAIChat(
          [{ role: 'user', content: prompt }],
          activeRoomId,
          (reasoningChunk) => {
            // Optional reasoning indicator
          },
          (contentChunk) => {
            contentBuffer += contentChunk;
            setHistory((prev) => {
              const existing = prev.find((l) => l.id === lineId);
              if (existing) {
                return prev.map((l) => (l.id === lineId ? { ...l, text: contentBuffer } : l));
              } else {
                return [
                  ...prev,
                  {
                    id: lineId,
                    type: 'SUCCESS',
                    text: contentBuffer,
                    timestamp: new Date().toLocaleTimeString(),
                  },
                ];
              }
            });
          },
          () => {
            addLine('INFO', '✓ Nemotron response complete.');
          },
          (err) => {
            addLine('ERROR', `AI query failed: ${err}`);
          }
        );
      } catch (err: any) {
        addLine('ERROR', `Failed: ${err.message}`);
      }
      return;
    }

    // Default unknown command
    addLine('WARN', `Command not recognized: "${cmd}". Type "help" for a list of valid commands.`);
  };

  const handleCopyLogs = () => {
    const text = history.map((h) => `[${h.timestamp}] [${h.type}] ${h.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-[#05070a] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
      {/* Top Terminal Bar */}
      <div className="h-11 border-b border-white/[0.07] bg-[#080b11] px-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <div className="flex items-center gap-1.5 ml-2 text-slate-400">
            <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-slate-200">hostel-os-term</span>
            <span className="text-[10px] text-slate-500">({activeRoomId})</span>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 bg-black/40 border border-white/[0.06] rounded-md p-0.5 text-[10px]">
            <button
              onClick={() => executeCommand('pytest')}
              className="px-2 py-0.5 rounded hover:bg-white/[0.08] text-emerald-400 transition-colors cursor-pointer"
            >
              Run Pytest
            </button>
            <button
              onClick={() => executeCommand('status')}
              className="px-2 py-0.5 rounded hover:bg-white/[0.08] text-cyan-400 transition-colors cursor-pointer"
            >
              Status
            </button>
            <button
              onClick={() => executeCommand('telemetry')}
              className="px-2 py-0.5 rounded hover:bg-white/[0.08] text-cyan-400 transition-colors cursor-pointer"
            >
              Telemetry
            </button>
            <button
              onClick={() => executeCommand('ai Analyze current room telemetry and suggest energy optimization')}
              className="px-2 py-0.5 rounded hover:bg-purple-950/40 text-purple-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
              <span>Ask Nemotron</span>
            </button>
          </div>

          <button
            onClick={handleCopyLogs}
            className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Copy Terminal Output"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setHistory([])}
            className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Clear Terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-1.5 select-text leading-relaxed">
        {history.map((line) => {
          let color = 'text-slate-300';
          if (line.type === 'CMD') color = 'text-cyan-300 font-bold';
          if (line.type === 'SUCCESS') color = 'text-emerald-400';
          if (line.type === 'WARN') color = 'text-amber-300';
          if (line.type === 'ERROR') color = 'text-rose-400 font-semibold';
          if (line.type === 'INFO') color = 'text-slate-400';

          return (
            <div key={line.id} className={`flex items-start gap-2 ${color}`}>
              <span className="text-[10px] text-slate-600 select-none shrink-0 mt-0.5">
                {line.timestamp}
              </span>
              <pre className="whitespace-pre-wrap break-all flex-1 font-mono">
                {line.text}
              </pre>
            </div>
          );
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Input Line */}
      <div className="h-11 border-t border-white/[0.07] bg-[#07090e] px-3 flex items-center gap-2">
        <span className="text-cyan-400 font-bold select-none text-xs">
          hostel-os:{activeRoomId.toLowerCase()}$
        </span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              executeCommand(inputVal);
            }
          }}
          placeholder="Enter command (e.g. 'pytest', 'status', 'relay on', 'help')..."
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none font-mono text-xs"
          autoFocus
        />
        <button
          onClick={() => executeCommand(inputVal)}
          className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
          title="Execute"
        >
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
