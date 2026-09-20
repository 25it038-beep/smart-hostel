import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  statusBadgeText?: string;
  statusType?: 'success' | 'warning' | 'info' | 'neutral' | 'danger';
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  statusBadgeText,
  statusType = 'neutral',
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  highlight = false,
}) => {
  const getStatusColor = () => {
    switch (statusType) {
      case 'success':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
      case 'warning':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
      case 'danger':
        return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
      case 'info':
        return 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60';
      default:
        return 'text-slate-400 bg-slate-800/60 border-slate-700/60';
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-200 ${
        highlight
          ? 'bg-gradient-to-br from-slate-900 via-[#101728] to-[#121c33] border-cyan-500/40 shadow-lg shadow-cyan-950/20'
          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold tracking-tight text-white font-mono">{value}</h3>
            {trend && (
              <span
                className={`text-xs font-mono font-medium ${
                  trendDirection === 'up'
                    ? 'text-rose-400'
                    : trendDirection === 'down'
                    ? 'text-cyan-400'
                    : 'text-slate-400'
                }`}
              >
                {trend}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-cyan-400">
            <Icon className="w-5 h-5" />
          </div>
          {statusBadgeText && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${getStatusColor()}`}
            >
              {statusBadgeText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
