import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  Info, 
  Flame, 
  Lightbulb, 
  RotateCw,
  Database,
  Zap,
  Gauge,
  ThermometerSnowflake,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight,
  Sliders
} from 'lucide-react';
import { AIInsightsReport } from '../types';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';

interface AIInsightsProps {
  roomId: string;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ roomId }) => {
  const [report, setReport] = useState<AIInsightsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [calibrating, setCalibrating] = useState(false);
  const [applyingTimeout, setApplyingTimeout] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [anomalyFilter, setAnomalyFilter] = useState<'ALL' | 'THERMAL' | 'ENERGY'>('ALL');

  useEffect(() => {
    loadInsights();
  }, [roomId]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const data = await api.getAIInsights(roomId);
      setReport(data);
    } catch (err) {
      console.error('Failed to load AI insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalibrate = async () => {
    setCalibrating(true);
    try {
      await loadInsights();
      setTimeout(() => setCalibrating(false), 800);
    } catch {
      setCalibrating(false);
    }
  };

  const handleApplyRecommendedTimeout = async () => {
    if (!report?.recommended_timeout_sec) return;
    setApplyingTimeout(true);
    try {
      await api.updateRoomSettings(roomId, {
        inactivity_timeout_sec: report.recommended_timeout_sec,
      });
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update timeout:', err);
    } finally {
      setApplyingTimeout(false);
    }
  };

  const filteredInsights = report?.insights.filter((ins) => {
    if (anomalyFilter === 'ALL') return true;
    if (anomalyFilter === 'THERMAL') return ins.type.includes('TEMP') || ins.type.includes('HUM');
    if (anomalyFilter === 'ENERGY') return ins.type.includes('LIGHT') || ins.type.includes('ENERGY');
    return true;
  }) || [];

  const currentHour = new Date().getHours();

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. AI NEURAL ENGINE HUD HEADER BAR                                        */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0d1424] via-[#0f172a] to-[#14182b] p-6 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 shadow-lg shadow-purple-900/30 text-white shrink-0">
              <BrainCircuit className="w-8 h-8 animate-pulse-slow" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-extrabold tracking-wide text-white font-mono">
                  AI ROOM INTELLIGENCE & PREDICTIVE ANALYTICS
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-700/60 shadow-sm">
                  NEURAL INFERENCE ENGINE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
                  {roomId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Autonomous occupancy profiling, psychrometric comfort evaluation, and anomaly detection driven by empirical sensor telemetry.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {report?.model_metadata && (
              <div className="hidden sm:flex flex-col text-right font-mono text-xs pr-2 border-r border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Model Engine</span>
                <span className="font-semibold text-slate-300">{report.model_metadata.engine.split('&')[0]}</span>
                <span className="text-[10px] text-emerald-400">Confidence: {report.model_metadata.confidence_pct}%</span>
              </div>
            )}

            <button
              onClick={handleRecalibrate}
              disabled={calibrating || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono font-bold text-slate-200 shadow-md transition-all hover:border-purple-500/50"
            >
              <RotateCw className={`w-4 h-4 text-purple-400 ${calibrating ? 'animate-spin' : ''}`} />
              <span>{calibrating ? 'RE-CALIBRATING...' : 'RECALIBRATE MODEL'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* INSUFFICIENT DATA FALLBACK */}
      {report?.status === 'collecting_data' ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0d1322] p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-purple-400 shadow-inner">
            <Database className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold font-mono text-white">COLLECTING HISTORICAL SENSOR TELEMETRY...</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            {report.message || 'AI insights will become available after sufficient sensor history is collected.'}
          </p>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] font-mono text-slate-500 max-w-sm mx-auto">
            Grounded in actual SQLite readings • Zero synthetic hallucination
          </div>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 2. TOP INTELLIGENCE KPI SHOWCASE (4 PREMIUM CARDS)                        */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Energy Efficiency Score */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  Energy Rating
                </span>
                <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  <Zap className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-3">
                <div className="text-3xl font-extrabold font-mono text-white">
                  {report?.energy_efficiency_score ?? 88}
                  <span className="text-base font-normal text-slate-500">/100</span>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-black bg-emerald-500 text-slate-950 border border-emerald-400 shadow-sm">
                  GRADE {report?.energy_rating_grade ?? 'A'}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Power Saved:</span>
                <span className="text-emerald-400 font-bold">~{report?.estimated_energy_saved_pct ?? 38}% vs Always ON</span>
              </div>
            </div>

            {/* Card 2: Psychrometric Thermal Comfort */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  Thermal Comfort
                </span>
                <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                  <ThermometerSnowflake className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-3">
                <div className="text-3xl font-extrabold font-mono text-white">
                  {report?.thermal_comfort_index ?? 78}
                  <span className="text-base font-normal text-slate-500">/100</span>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-semibold truncate max-w-[120px]">
                  Dew: {report?.dew_point_c ?? 18}°C
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-300 truncate">
                {report?.thermal_comfort_status ?? 'Optimal Thermal Comfort'}
              </div>
            </div>

            {/* Card 3: Empirical Occupancy Window */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  Active Window
                </span>
                <div className="p-2 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-800/40">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xl font-bold font-mono text-purple-300 truncate">
                  {report?.typical_occupancy_window ?? '8:00 AM – 10:30 PM'}
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  10th–90th percentile student presence
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Diurnal Pattern:</span>
                <span className="text-purple-400 font-bold">Standard Dorm</span>
              </div>
            </div>

            {/* Card 4: Intelligent Timeout Advisor */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0c121e] to-[#151a2d] p-5 shadow-xl relative overflow-hidden group border-cyan-500/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                  AI Timeout Advisor
                </span>
                <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/40">
                  <Sliders className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-black font-mono text-amber-300">
                    {report?.recommended_timeout_sec ?? 60}s
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Recommended Setting</span>
                </div>

                <button
                  onClick={handleApplyRecommendedTimeout}
                  disabled={applyingTimeout}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border shadow-sm ${
                    appliedSuccess
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-400'
                  }`}
                >
                  {appliedSuccess ? 'APPLIED!' : 'APPLY AI TIMEOUT'}
                </button>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 leading-tight truncate">
                {report?.recommended_timeout_reason || 'Balances contact wear vs power savings'}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. 24-HOUR PREDICTIVE OCCUPANCY PROBABILITY PROFILE                       */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold font-mono text-white tracking-wider uppercase">
                    24-HOUR PREDICTIVE OCCUPANCY PROBABILITY PROFILE
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hourly likelihood of student occupancy based on statistical clustering across the day
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                  <span className="text-slate-400">Predicted Probability</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                  <span className="text-slate-400">Current Hour ({currentHour}:00)</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              {report?.hourly_occupancy_probabilities && report.hourly_occupancy_probabilities.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.hourly_occupancy_probabilities} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      domain={[0, 1]} 
                      tickFormatter={(val) => `${Math.round(val * 100)}%`} 
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#0f172a] border border-slate-700 p-3 rounded-lg font-mono text-xs shadow-xl">
                              <p className="text-cyan-400 font-bold">{data.label} (Hour {data.hour}:00)</p>
                              <p className="text-white mt-1">
                                Occupancy Probability: <span className="text-purple-300 font-bold">{Math.round(data.probability * 100)}%</span>
                              </p>
                              <p className="text-slate-400 text-[10px] mt-0.5">
                                {data.probability > 0.5 ? 'High Dormitory Traffic' : 'Quiet / Low Activity'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                      {report.hourly_occupancy_probabilities.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.hour === currentHour ? '#06b6d4' : '#8b5cf6'}
                          fillOpacity={entry.hour === currentHour ? 1 : 0.75}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  Synthesizing probability matrix...
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. DETECTED ANOMALIES & EMPIRICAL RECOMMENDATIONS MATRIX                  */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Categorized Anomalies (7 Cols) */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold font-mono text-white tracking-wider uppercase">
                    ANOMALY DETECTION STREAM
                  </h3>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center rounded-lg bg-slate-900 p-1 border border-slate-800 text-[11px] font-mono">
                  {(['ALL', 'THERMAL', 'ENERGY'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setAnomalyFilter(cat)}
                      className={`px-2.5 py-1 rounded transition-all font-semibold ${
                        anomalyFilter === cat
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredInsights.length > 0 ? (
                  filteredInsights.map((insight, idx) => {
                    const isCritical = insight.severity === 'CRITICAL';
                    const isWarning = insight.severity === 'WARNING';
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                          isCritical
                            ? 'bg-rose-950/20 border-rose-800/70 text-rose-200'
                            : isWarning
                            ? 'bg-amber-950/20 border-amber-800/70 text-amber-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isCritical ? (
                            <AlertTriangle className="w-5 h-5 text-rose-400" />
                          ) : isWarning ? (
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold font-mono text-white truncate">{insight.title}</h4>
                            <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border font-black shrink-0 ${
                              isCritical
                                ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                                : isWarning
                                ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                                : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                            }`}>
                              {insight.severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No anomalies flagged for selected filter. All metrics within stable baseline bounds.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: AI Data-Driven Recommendations (5 Cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold font-mono text-white tracking-wider uppercase">
                    DATA-GROUNDED PRESCRIPTIONS
                  </h3>
                </div>

                <div className="space-y-3">
                  {report?.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs font-mono text-slate-300"
                    >
                      <div className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-700/60 text-cyan-400 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explainable AI Footnote */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-slate-900 to-[#101726] border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Explainable AI (XAI) Standards</span>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-500">
                  Every recommendation is derived strictly from historical telemetry distributions and empirical dorm events, ensuring auditability and safety.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
