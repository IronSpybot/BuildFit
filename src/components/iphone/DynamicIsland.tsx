import React, { useState } from 'react';
import { Wifi, BatteryMedium, Flame, Activity } from 'lucide-react';

interface DynamicIslandProps {
  stepCount: number;
  activeCalories: number;
  lastAction?: string;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  stepCount,
  activeCalories,
  lastAction,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative w-full pt-3 pb-2 px-7 flex items-center justify-between z-40 select-none">
      {/* iOS Time Display */}
      <span className="text-[14px] font-semibold tracking-tight text-white/95 font-mono">
        9:41
      </span>

      {/* Dynamic Island Capsule */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Dynamic Island Health Activity"
        className={`bg-black border border-white/10 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer shadow-lg hover:border-white/25 ${
          isExpanded
            ? 'px-4 py-2 w-72 h-10 gap-3'
            : 'px-3 py-1.5 w-28 h-[28px] gap-2'
        }`}
      >
        {isExpanded ? (
          <div className="flex items-center justify-between w-full text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-semibold">{stepCount.toLocaleString()} steps</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <Flame className="w-3.5 h-3.5" />
              <span className="font-semibold">+{Math.round(activeCalories)} kcal</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full px-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
            <span className="text-[11px] font-medium text-white/75 truncate">
              {lastAction ? lastAction : `${(stepCount / 1000).toFixed(1)}k steps`}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />
          </div>
        )}
      </button>

      {/* iOS Status Icons */}
      <div className="flex items-center gap-2 text-white/90">
        <Wifi className="w-3.5 h-3.5" />
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-semibold">5G</span>
          <BatteryMedium className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
    </div>
  );
};
