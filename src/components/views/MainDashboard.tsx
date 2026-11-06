import React from 'react';
import {
  Flame,
  Plus,
  Footprints,
  Sun,
  SunMedium,
  Moon,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { ConcentricFitnessRings } from '../iphone/ConcentricFitnessRings';
import type { MealItemLog, UserMetrics, MacroTarget } from '../../utils/nutrition';
import { haptic } from '../../utils/haptics';

interface MainDashboardProps {
  metrics: UserMetrics;
  macroTargets: MacroTarget;
  meals: MealItemLog[];
  stepCount: number;
  activeBurn: number;
  onOpenMealEntry: (slot: 'breakfast' | 'lunch' | 'dinner') => void;
  onDeleteMeal: (id: string) => void;
  onSyncHealthKit: () => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  macroTargets,
  meals,
  stepCount,
  activeBurn,
  onOpenMealEntry,
  onDeleteMeal,
  onSyncHealthKit,
}) => {
  // Aggregate nutrition
  const totalConsumed = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);

  const netCalories = Math.max(0, totalConsumed - activeBurn);
  const remainingCalories = Math.round(macroTargets.calories - netCalories);

  // Ratios for rings
  const pRatio = totalProtein / Math.max(1, macroTargets.proteinGrams);
  const cRatio = totalCarbs / Math.max(1, macroTargets.carbsGrams);
  const fRatio = totalFat / Math.max(1, macroTargets.fatGrams);

  const mealSlots: Array<{
    slot: 'breakfast' | 'lunch' | 'dinner';
    label: string;
    icon: typeof Sun;
    color: string;
  }> = [
    { slot: 'breakfast', label: 'Breakfast', icon: Sun, color: 'text-amber-400' },
    { slot: 'lunch', label: 'Lunch', icon: SunMedium, color: 'text-orange-400' },
    { slot: 'dinner', label: 'Dinner', icon: Moon, color: 'text-indigo-400' },
  ];

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="flex flex-col gap-5 px-4 pt-1 pb-24 text-white select-none">
      {/* Date & Net Calorie Pill */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider font-mono">
            {todayStr}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Daily Balance
          </h1>
        </div>

        <div className="flex flex-col items-end px-3 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 shadow-inner">
          <span className="text-[9px] font-bold text-white/50 tracking-wider">
            NET INTAKE
          </span>
          <span className="text-xs font-mono font-bold text-rose-400">
            {netCalories} / {macroTargets.calories} kcal
          </span>
        </div>
      </div>

      {/* Apple Fitness-style Concentric Rings Card */}
      <div className="p-4 rounded-3xl bg-neutral-900/70 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <ConcentricFitnessRings
            proteinRatio={pRatio}
            carbsRatio={cRatio}
            fatRatio={fRatio}
            size={140}
          />

          {/* Macro Legends */}
          <div className="flex-1 flex flex-col gap-2.5">
            {/* Protein */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#30D158] shadow-[0_0_8px_#30D158]" />
                <span className="text-xs font-semibold text-white/90">Protein</span>
              </div>
              <span className="text-xs font-mono font-bold text-white/70">
                {Math.round(totalProtein)} / {macroTargets.proteinGrams}g
              </span>
            </div>

            {/* Carbs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#64D2FF] shadow-[0_0_8px_#64D2FF]" />
                <span className="text-xs font-semibold text-white/90">Carbs</span>
              </div>
              <span className="text-xs font-mono font-bold text-white/70">
                {Math.round(totalCarbs)} / {macroTargets.carbsGrams}g
              </span>
            </div>

            {/* Fats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BF5AF2] shadow-[0_0_8px_#BF5AF2]" />
                <span className="text-xs font-semibold text-white/90">Fats</span>
              </div>
              <span className="text-xs font-mono font-bold text-white/70">
                {Math.round(totalFat)} / {macroTargets.fatGrams}g
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 my-3.5" />

        {/* Caloric Metrics Bar */}
        <div className="grid grid-cols-3 text-center divide-x divide-white/10">
          <div>
            <div className="text-[10px] text-white/50 font-medium">Consumed</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              {totalConsumed} kcal
            </div>
          </div>
          <div>
            <div className="text-[10px] text-white/50 font-medium">Burned (Steps)</div>
            <div className="text-sm font-bold font-mono text-amber-400 mt-0.5 flex items-center justify-center gap-0.5">
              <Flame className="w-3.5 h-3.5" /> -{activeBurn}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-white/50 font-medium">Remaining</div>
            <div
              className={`text-sm font-bold font-mono mt-0.5 ${
                remainingCalories >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {remainingCalories} kcal
            </div>
          </div>
        </div>
      </div>

      {/* HealthKit Step Activity Card */}
      <div className="p-4 rounded-3xl bg-neutral-900/70 backdrop-blur-xl border border-white/10 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/30 border border-orange-500/30 flex items-center justify-center">
            <Footprints className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-white/50 tracking-wider">
                APPLE HEALTHKIT
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-white font-mono">
                {stepCount.toLocaleString()}
              </span>
              <span className="text-xs text-white/50 font-mono">/ 10,000 steps</span>
            </div>
            <p className="text-[11px] font-medium text-amber-400/90 flex items-center gap-1">
              <Flame className="w-3 h-3" /> +{activeBurn} kcal active burn
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            haptic.trigger('light');
            onSyncHealthKit();
          }}
          aria-label="Sync Apple HealthKit steps"
          className="p-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] active:scale-95 transition-all text-white/80 border border-white/10"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" />
        </button>
      </div>

      {/* Strictly 3 Meal Slots: Breakfast, Lunch, Dinner */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-white tracking-tight">
            Daily Meals (3 Slots)
          </h2>
          <span className="text-[11px] font-medium text-white/40">
            {meals.length} item{meals.length === 1 ? '' : 's'} logged
          </span>
        </div>

        {mealSlots.map(({ slot, label, icon: Icon, color }) => {
          const slotMeals = meals.filter((m) => m.mealType === slot);
          const slotCalories = slotMeals.reduce((sum, m) => sum + m.calories, 0);

          return (
            <div
              key={slot}
              className="p-3.5 rounded-2xl bg-neutral-900/60 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-xl bg-white/[0.06] ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{label}</h3>
                    <p className="text-[11px] font-mono text-white/50">
                      {slotCalories} kcal
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    haptic.trigger('light');
                    onOpenMealEntry(slot);
                  }}
                  aria-label={`Log food for ${label}`}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log</span>
                </button>
              </div>

              {/* Items in this slot */}
              {slotMeals.length > 0 ? (
                <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-col gap-1.5">
                  {slotMeals.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-white/[0.04]"
                    >
                      <div className="flex-1 truncate pr-2">
                        <span className="font-medium text-white/90">
                          {item.name}
                        </span>
                        <div className="text-[10px] text-white/40 font-mono space-x-1.5">
                          <span>{item.calories} kcal</span>
                          <span>·</span>
                          <span className="text-emerald-400/80">P:{item.protein}g</span>
                          <span className="text-cyan-400/80">C:{item.carbs}g</span>
                          <span className="text-purple-400/80">F:{item.fat}g</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          haptic.trigger('delete');
                          onDeleteMeal(item.id);
                        }}
                        aria-label={`Delete ${item.name}`}
                        className="p-1 text-white/30 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-white/30 italic mt-1.5 pl-8">
                  No food logged for {label.toLowerCase()} yet.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
