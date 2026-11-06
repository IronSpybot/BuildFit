import React from 'react';
import { X, Footprints, Droplets, Calendar, Sparkles } from 'lucide-react';
import { haptic } from '../../utils/haptics';

interface DayMetric {
  dayName: string;
  steps: number;
  waterMl: number;
}

interface WeeklyTrendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeklyData: DayMetric[];
}

export const WeeklyTrendsModal: React.FC<WeeklyTrendsModalProps> = ({
  isOpen,
  onClose,
  weeklyData,
}) => {
  if (!isOpen) return null;

  const maxSteps = Math.max(12000, ...weeklyData.map((d) => d.steps));
  const maxWater = Math.max(3000, ...weeklyData.map((d) => d.waterMl));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-neutral-950 border border-white/15 p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Calendar className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                7-Day HealthKit Analytics
              </h3>
              <p className="text-[11px] text-white/50">
                Swift Charts HKStatisticsCollectionQuery
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              haptic.trigger('light');
              onClose();
            }}
            aria-label="Close trends modal"
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Step Count 7-Day Bar Chart */}
        <div className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Daily Steps</span>
            </div>
            <span className="text-[10px] font-mono text-white/40">Goal: 10,000 steps</span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-32 flex items-end justify-between gap-2 pt-4 px-1 border-b border-white/10 relative">
            {/* 10k Goal Reference Line */}
            <div
              className="absolute left-0 right-0 border-b border-dashed border-amber-400/40 pointer-events-none"
              style={{ bottom: `${(10000 / maxSteps) * 100}%` }}
            >
              <span className="text-[9px] text-amber-400/70 absolute right-1 -top-3.5 font-mono">
                10k
              </span>
            </div>

            {weeklyData.map((d, i) => {
              const heightPct = Math.min(100, (d.steps / maxSteps) * 100);
              const isToday = i === weeklyData.length - 1;

              return (
                <div key={d.dayName} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="text-[9px] font-mono text-white/40 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(d.steps / 1000).toFixed(1)}k
                  </div>
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ease-out ${
                      isToday
                        ? 'bg-gradient-to-t from-orange-500 to-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                        : 'bg-white/20 hover:bg-white/40'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className={`text-[10px] font-mono mt-1.5 ${isToday ? 'text-amber-400 font-bold' : 'text-white/40'}`}>
                    {d.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Hydration Volume 7-Day Bar Chart */}
        <div className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">Dietary Water</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/80">Goal: 2,500 ml</span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-32 flex items-end justify-between gap-2 pt-4 px-1 border-b border-white/10 relative">
            {/* 2.5L Goal Line */}
            <div
              className="absolute left-0 right-0 border-b border-dashed border-cyan-400/40 pointer-events-none"
              style={{ bottom: `${(2500 / maxWater) * 100}%` }}
            >
              <span className="text-[9px] text-cyan-400/70 absolute right-1 -top-3.5 font-mono">
                2.5L
              </span>
            </div>

            {weeklyData.map((d, i) => {
              const heightPct = Math.min(100, (d.waterMl / maxWater) * 100);
              const isToday = i === weeklyData.length - 1;

              return (
                <div key={d.dayName} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="text-[9px] font-mono text-cyan-300/60 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(d.waterMl / 1000).toFixed(1)}L
                  </div>
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ease-out ${
                      isToday
                        ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(100,210,255,0.5)]'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/40'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className={`text-[10px] font-mono mt-1.5 ${isToday ? 'text-cyan-400 font-bold' : 'text-white/40'}`}>
                    {d.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs text-center active:scale-95 transition-all"
        >
          Close Trends
        </button>
      </div>
    </div>
  );
};
