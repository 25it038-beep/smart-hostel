import React, { useState } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Users, 
  Lightbulb, 
  Cpu, 
  Power, 
  Clock, 
  SlidersHorizontal,
  AlertCircle,
  CheckCircle2,
  Hourglass
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { MiniRoom } from '../components/MiniRoom';
import { StatusBadge } from '../components/StatusBadge';
import { SensorReading, RoomSetting, LightStateResponse } from '../types';
import { api } from '../services/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardProps {
  roomId: string;
  latestSensor: SensorReading | null;
  history: SensorReading[];
  settings: RoomSetting | null;
  deviceStatus: 'CONNECTED' | 'OFFLINE';
  secondsSinceSeen: number;
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  roomId,
  latestSensor,
  history,
  settings,
  deviceStatus,
  secondsSinceSeen,
  onRefresh,
}) => {
  const [commandInProgress, setCommandInProgress] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState<{
    status: string;
    message: string;
  } | null>(null);

  const temperature = latestSensor?.temperature ?? 28.4;
  const humidity = latestSensor?.humidity ?? 61.0;
  const occupancy = latestSensor?.occupancy ?? false;
  const lightState = latestSensor?.light_state ?? false;
  const mode = settings?.light_mode ?? 'AUTO';
  const timeout = settings?.inactivity_timeout_sec ?? 60;

  // Handle Manual Mode Light Toggling
  const handleToggleLight = async (turnOn: boolean) => {
    setCommandInProgress(true);
    setCommandFeedback({
      status: 'WAITING_FOR_ESP32',
      message: 'Command sent. Waiting for ESP32...',
    });

    try {
      const resp = await api.sendLightCommand(roomId, 'MANUAL', turnOn);
      setCommandFeedback({
        status: resp.command_status,
        message: resp.message,
      });
      onRefresh();
    } catch (err: any) {
      setCommandFeedback({
        status: 'ERROR',
        message: err.message || 'Failed to dispatch command to backend.',
      });
    } finally {
      setCommandInProgress(false);
    }
  };

  // Switch between AUTO and MANUAL modes
  const handleModeChange = async (newMode: 'AUTO' | 'MANUAL') => {
    setCommandInProgress(true);
    try {
      const resp = await api.sendLightCommand(roomId, newMode, lightState);
      setCommandFeedback({
        status: resp.command_status,
        message: resp.message,
      });
      onRefresh();
    } catch (err: any) {
      setCommandFeedback({
        status: 'ERROR',
        message: err.message || 'Failed to update mode.',
      });
    } finally {
      setCommandInProgress(false);
    }
  };

  // Format chart data
  const chartData = history.slice(-20).map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    temperature: r.temperature,
    humidity: r.humidity,
  }));

  return (
    <div className="space-y-6">
      {/* SECTION 5: METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Temperature Card */}
        <MetricCard
          title="Temperature"
          value={`${temperature.toFixed(1)}°C`}
          subtitle="Ambient room temp"
          statusBadgeText={temperature > 31 ? 'HIGH' : temperature < 22 ? 'LOW' : 'Normal'}
          statusType={temperature > 31 ? 'warning' : 'success'}
          icon={Thermometer}
          trend={temperature > 29 ? '+0.4°' : '-0.2°'}
          trendDirection={temperature > 29 ? 'up' : 'down'}
        />

        {/* 2. Humidity Card */}
        <MetricCard
          title="Humidity"
          value={`${humidity.toFixed(0)}%`}
          subtitle="Relative moisture"
          statusBadgeText={humidity > 70 ? 'HUMID' : 'Normal'}
          statusType="info"
          icon={Droplets}
        />

        {/* 3. Occupancy Card */}
        <MetricCard
          title="Occupancy"
          value={occupancy ? 'OCCUPIED' : 'EMPTY'}
          subtitle={occupancy ? 'Motion detected' : 'No motion'}
          statusBadgeText={occupancy ? 'ACTIVE' : 'IDLE'}
          statusType={occupancy ? 'info' : 'neutral'}
          icon={Users}
          highlight={occupancy}
        />

        {/* 4. Light Card */}
        <MetricCard
          title="Light Control"
          value={lightState ? 'ON' : 'OFF'}
          subtitle={`${mode === 'AUTO' ? 'Automatic' : 'Manual'} mode`}
          statusBadgeText={lightState ? 'RELAY CLOSED' : 'RELAY OPEN'}
          statusType={lightState ? 'warning' : 'neutral'}
          icon={Lightbulb}
          highlight={lightState}
        />

        {/* 5. ESP32 Node Card */}
        <MetricCard
          title="ESP32 Node"
          value={deviceStatus}
          subtitle={`Last seen: ${Math.max(1, Math.round(secondsSinceSeen))} sec ago`}
          statusBadgeText={deviceStatus === 'CONNECTED' ? 'ONLINE' : 'DISCONNECTED'}
          statusType={deviceStatus === 'CONNECTED' ? 'success' : 'danger'}
          icon={Cpu}
        />
      </div>

      {/* HARDWARE CONTROL & COMMAND STATUS PANEL */}
      <div className="rounded-xl border border-slate-800 bg-[#0e1422] p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Direct Light Control & Mode Selection
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              In AUTO mode, PIR motion toggles relay with {timeout}s timeout. In MANUAL mode, use controls below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Switch: AUTO vs MANUAL */}
            <div className="flex items-center rounded-lg bg-slate-900 p-1 border border-slate-800">
              <button
                onClick={() => handleModeChange('AUTO')}
                disabled={commandInProgress}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                  mode === 'AUTO'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AUTO MODE
              </button>
              <button
                onClick={() => handleModeChange('MANUAL')}
                disabled={commandInProgress}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                  mode === 'MANUAL'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                MANUAL MODE
              </button>
            </div>

            {/* Manual Light ON / OFF Buttons */}
            {mode === 'MANUAL' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleLight(true)}
                  disabled={commandInProgress || lightState === true}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                    lightState
                      ? 'bg-amber-950/60 text-amber-300 border-amber-600 opacity-60 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  TURN LIGHT ON
                </button>
                <button
                  onClick={() => handleToggleLight(false)}
                  disabled={commandInProgress || lightState === false}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                    !lightState
                      ? 'bg-slate-800 text-slate-500 border-slate-700 opacity-60 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-rose-800/80 shadow-md'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  TURN LIGHT OFF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Command Status Feedback Display */}
        {commandFeedback && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs font-mono">
            {commandFeedback.status === 'ESP32_OFFLINE' ? (
              <div className="text-rose-400 flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>ESP32 OFFLINE: Unable to send command to physical hardware.</span>
              </div>
            ) : commandFeedback.status === 'WAITING_FOR_ESP32' ? (
              <div className="text-amber-400 flex items-center gap-2">
                <Hourglass className="w-4 h-4 animate-spin" />
                <span>Command sent. Waiting for ESP32 acknowledgment...</span>
              </div>
            ) : (
              <div className="text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Command acknowledged: {commandFeedback.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ARCHITECTURAL MINI ROOM & LIVE SENSOR CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mini Room Visual Layout (7 Cols) */}
        <div className="lg:col-span-7">
          <MiniRoom
            roomId={roomId}
            temperature={temperature}
            humidity={humidity}
            occupancy={occupancy}
            lightState={lightState}
            deviceStatus={deviceStatus}
            lastSeenText={`${Math.max(1, Math.round(secondsSinceSeen))} sec ago`}
            mode={mode}
          />
        </div>

        {/* Real-Time Live Trend Chart (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono tracking-wider">REAL-TIME TELEMETRY STREAM</h3>
                <p className="text-xs text-slate-400">Continuous 5s sampling interval</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                LIVE BUFFER
              </span>
            </div>

            <div className="h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      name="Temperature (°C)"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      name="Humidity (%)"
                      stroke="#3b82f6"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  Awaiting sensor samples...
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Temp: {temperature.toFixed(1)}°C</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Humidity: {humidity.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Timeout: {timeout}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
