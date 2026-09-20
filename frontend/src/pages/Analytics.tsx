import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  Lightbulb, 
  Users, 
  Zap, 
  Timer, 
  Info, 
  TrendingUp,
  Sliders
} from 'lucide-react';
import { AnalyticsSummary, SensorReading } from '../types';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';

interface AnalyticsProps {
  roomId: string;
}

export const Analytics: React.FC<AnalyticsProps> = ({ roomId }) => {
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | 'custom'>('today');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [roomId, timeframe]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, histData] = await Promise.all([
        api.getAnalytics(roomId, timeframe),
        api.getSensorHistory(roomId, 120),
      ]);
      setSummary(sumData);
      setHistory(histData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart series
  const formattedChartData = history.map((h) => ({
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temperature: h.temperature,
    humidity: h.humidity,
    occupancy: h.occupancy ? 1 : 0,
    light: h.light_state ? 1 : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header and Timeframe Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono tracking-wide">HISTORICAL SENSOR & USAGE ANALYTICS</h2>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated statistics and telemetry history for {roomId}.
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex items-center rounded-lg bg-slate-900 p-1 border border-slate-800">
          {(['today', '7d', '30d', 'custom'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold uppercase transition-all ${
                timeframe === tf
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf === 'today' ? 'Today' : tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 13: LIGHT USAGE & OCCUPANCY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Light Usage */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Light Usage</span>
            <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/40">
              <Lightbulb className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-white">
            {summary?.total_light_on_formatted ?? '0m'}
          </div>
          <p className="text-xs text-slate-400 mt-1">Cumulative relay ON duration</p>
        </div>

        {/* Occupancy Duration */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Occupancy</span>
            <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-white">
            {summary?.total_occupancy_formatted ?? '0m'}
          </div>
          <p className="text-xs text-slate-400 mt-1">Total PIR motion detected</p>
        </div>

        {/* Automatic Activations */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Activations</span>
            <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/40">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-white">
            {summary?.automatic_activations_count ?? 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Auto PIR light triggers</p>
        </div>

        {/* Average Session */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Avg Session</span>
            <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/40">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-white">
            {summary?.avg_session_duration_formatted ?? '0m'}
          </div>
          <p className="text-xs text-slate-400 mt-1">Mean duration per trigger</p>
        </div>
      </div>

      {/* MANDATORY DISCLAIMER BOX PER SECTION 13 */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Engineering Measurement Disclaimer: </span>
          {summary?.disclaimer || (
            "Light usage durations and activation counts are calculated strictly from the relay command state and occupancy events, not from optical photodetectors or measuring the lamp's physical luminous output."
          )}
        </div>
      </div>

      {/* SECTION 12: HISTORICAL SENSOR CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Temperature vs Time */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-white">TEMPERATURE VS TIME</h3>
              <p className="text-xs text-slate-400">Recorded thermal fluctuations (°C)</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
              DHT22 SENSOR
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                <Area type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#tempGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Humidity vs Time */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-white">HUMIDITY VS TIME</h3>
              <p className="text-xs text-slate-400">Relative moisture trend (% RH)</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800">
              DHT22 SENSOR
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                <Area type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#humGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Occupancy vs Time */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-white">OCCUPANCY VS TIME</h3>
              <p className="text-xs text-slate-400">PIR binary occupancy state (1 = Occupied, 0 = Empty)</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-400 border border-purple-800">
              HC-SR501 PIR
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 1]} ticks={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Line type="stepAfter" dataKey="occupancy" name="Occupancy" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Light ON/OFF vs Time */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-white">LIGHT USAGE (RELAY STATE) VS TIME</h3>
              <p className="text-xs text-slate-400">Relay state duty cycle (1 = ON, 0 = OFF)</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800">
              RELAY OUTPUT
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 1]} ticks={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Line type="stepAfter" dataKey="light" name="Light ON" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
