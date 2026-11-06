import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Code2,
  Columns2,
  Footprints,
  RotateCcw,
  Apple,
  Droplets,
  BarChart2,
} from 'lucide-react';
import { IPhoneFrame } from './components/iphone/IPhoneFrame';
import { MainDashboard } from './components/views/MainDashboard';
import { MealEntryModal } from './components/views/MealEntryModal';
import { WeeklyTrendsModal } from './components/views/WeeklyTrendsModal';
import { OnboardingProfileView } from './components/views/OnboardingProfileView';
import { CodeArchitectureViewer } from './components/views/CodeArchitectureViewer';
import {
  calculateMacroTargets,
  calculateStepCalories,
  type UserMetrics,
  type MealItemLog,
} from './utils/nutrition';
import { haptic } from './utils/haptics';

// Default initial state
const INITIAL_METRICS: UserMetrics = {
  weightKg: 76.5,
  heightCm: 178,
  ageYears: 28,
  gender: 'male',
  activityLevel: 'moderate',
  goal: 'fatLoss',
};

const INITIAL_MEALS: MealItemLog[] = [
  {
    id: 'm1',
    name: 'Scrambled Eggs & Avocado Sourdough',
    mealType: 'breakfast',
    calories: 460,
    protein: 26,
    carbs: 38,
    fat: 22,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'm2',
    name: 'Grilled Chicken Breast & Quinoa Bowl',
    mealType: 'lunch',
    calories: 580,
    protein: 52,
    carbs: 58,
    fat: 12,
    timestamp: new Date().toISOString(),
  },
];

const INITIAL_WEEKLY_DATA = [
  { dayName: 'Sat', steps: 8450, waterMl: 2100 },
  { dayName: 'Sun', steps: 6920, waterMl: 1850 },
  { dayName: 'Mon', steps: 11200, waterMl: 2750 },
  { dayName: 'Tue', steps: 9400, waterMl: 2400 },
  { dayName: 'Wed', steps: 10850, waterMl: 2600 },
  { dayName: 'Thu', steps: 7800, waterMl: 2050 },
  { dayName: 'Fri', steps: 8420, waterMl: 1250 },
];

export default function App() {
  // Studio View Mode: 'split' | 'phone' | 'code'
  const [viewMode, setViewMode] = useState<'split' | 'phone' | 'code'>('split');

  // iPhone internal tab: 'dashboard' | 'log' | 'profile'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'log' | 'profile'>('dashboard');

  // Core application state
  const [metrics, setMetrics] = useState<UserMetrics>(INITIAL_METRICS);
  const [meals, setMeals] = useState<MealItemLog[]>(INITIAL_MEALS);
  const [stepCount, setStepCount] = useState<number>(8420);
  const [waterIntakeMl, setWaterIntakeMl] = useState<number>(1250);
  const [weeklyData, setWeeklyData] = useState(INITIAL_WEEKLY_DATA);
  const [lastIslandAction, setLastIslandAction] = useState<string>('');

  // Modals state
  const [modalSlot, setModalSlot] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast');
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [isWeeklyTrendsOpen, setIsWeeklyTrendsOpen] = useState(false);

  // Computed metabolic values
  const macroTargets = useMemo(() => calculateMacroTargets(metrics), [metrics]);
  const activeBurn = useMemo(
    () => calculateStepCalories(stepCount, metrics.weightKg),
    [stepCount, metrics.weightKg]
  );

  const handleOpenMealEntry = (slot: 'breakfast' | 'lunch' | 'dinner') => {
    setModalSlot(slot);
    setIsMealModalOpen(true);
  };

  const handleSaveMeal = (newMeal: Omit<MealItemLog, 'id' | 'timestamp'>) => {
    const mealWithId: MealItemLog = {
      ...newMeal,
      id: 'm_' + Date.now(),
      timestamp: new Date().toISOString(),
    };
    setMeals((prev) => [...prev, mealWithId]);
    setLastIslandAction(`+${mealWithId.calories} kcal logged`);
    setTimeout(() => setLastIslandAction(''), 3000);
  };

  const handleDeleteMeal = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSyncHealthKit = () => {
    const incrementalSteps = 600;
    setStepCount((prev) => {
      const nextSteps = prev + incrementalSteps;
      setWeeklyData((curr) => {
        const copy = [...curr];
        copy[copy.length - 1].steps = nextSteps;
        return copy;
      });
      return nextSteps;
    });
    setLastIslandAction(`+${incrementalSteps} steps synced`);
    setTimeout(() => setLastIslandAction(''), 3000);
  };

  const handleAddWater = (ml: number) => {
    setWaterIntakeMl((prev) => {
      const nextWater = prev + ml;
      setWeeklyData((curr) => {
        const copy = [...curr];
        copy[copy.length - 1].waterMl = nextWater;
        return copy;
      });
      return nextWater;
    });
    setLastIslandAction(`+${ml}ml water logged`);
    setTimeout(() => setLastIslandAction(''), 3000);
  };

  const handleReset = () => {
    haptic.trigger('medium');
    setMetrics(INITIAL_METRICS);
    setMeals(INITIAL_MEALS);
    setStepCount(8420);
    setWaterIntakeMl(1250);
    setWeeklyData(INITIAL_WEEKLY_DATA);
    setActiveTab('dashboard');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#07090b] text-neutral-100 font-sans">
      {/* Top Studio Control Bar */}
      <header className="h-13 shrink-0 px-4 bg-[#0d0f12] border-b border-white/10 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.06] border border-white/10">
            <Apple className="w-4 h-4 text-white" />
            <span className="text-xs font-extrabold tracking-tight text-white">
              PulseTrack
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full font-bold">
              iOS 27
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-white/50">
            <span>iPhone 16 Pro</span>
            <span>·</span>
            <span>Gemini AI Meal Estimation</span>
            <span>·</span>
            <span>HealthKit Dietary Water</span>
          </div>
        </div>

        {/* Studio Controls */}
        <div className="flex items-center gap-2">
          {/* HealthKit Quick Step Adder */}
          <button
            onClick={() => {
              haptic.trigger('light');
              handleSyncHealthKit();
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all active:scale-95"
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>+600 Steps</span>
          </button>

          {/* Quick Water Button */}
          <button
            onClick={() => {
              haptic.trigger('medium');
              handleAddWater(250);
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all active:scale-95"
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>+250ml Water</span>
          </button>

          {/* Reset State */}
          <button
            onClick={handleReset}
            title="Reset to default demo data"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-black/60 p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => {
                haptic.trigger('light');
                setViewMode('phone');
              }}
              title="iPhone 16 View"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'phone'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                haptic.trigger('light');
                setViewMode('split');
              }}
              title="Split View (Simulator + Swift Studio)"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'split'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                haptic.trigger('light');
                setViewMode('code');
              }}
              title="Swift Architecture Inspector"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'code'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: iPhone 16 Interactive Canvas */}
        {(viewMode === 'split' || viewMode === 'phone') && (
          <div
            className={`flex-1 flex items-center justify-center p-2 sm:p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900/60 via-black to-black overflow-y-auto ${
              viewMode === 'phone' ? 'w-full' : 'max-w-[500px] border-r border-white/10'
            }`}
          >
            <IPhoneFrame
              activeTab={activeTab}
              onTabChange={setActiveTab}
              stepCount={stepCount}
              activeCalories={activeBurn}
              lastAction={lastIslandAction}
            >
              {activeTab === 'dashboard' && (
                <MainDashboard
                  metrics={metrics}
                  macroTargets={macroTargets}
                  meals={meals}
                  stepCount={stepCount}
                  activeBurn={activeBurn}
                  waterIntakeMl={waterIntakeMl}
                  onOpenMealEntry={handleOpenMealEntry}
                  onDeleteMeal={handleDeleteMeal}
                  onSyncHealthKit={handleSyncHealthKit}
                  onAddWater={handleAddWater}
                  onOpenWeeklyTrends={() => setIsWeeklyTrendsOpen(true)}
                />
              )}

              {activeTab === 'log' && (
                <div className="p-4 flex flex-col gap-4 text-white">
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Dietary Entry
                    </span>
                    <h2 className="text-xl font-bold">Add to Today&apos;s Diet</h2>
                    <p className="text-xs text-white/50">
                      Strictly choose between 3 daily slots: Breakfast, Lunch, or Dinner.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      { slot: 'breakfast' as const, label: 'Breakfast Slot', time: 'Morning meal' },
                      { slot: 'lunch' as const, label: 'Lunch Slot', time: 'Mid-day meal' },
                      { slot: 'dinner' as const, label: 'Dinner Slot', time: 'Evening meal' },
                    ].map(({ slot, label, time }) => (
                      <button
                        key={slot}
                        onClick={() => handleOpenMealEntry(slot)}
                        className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-emerald-400/50 flex items-center justify-between text-left transition-all active:scale-95"
                      >
                        <div>
                          <div className="text-sm font-bold text-white">{label}</div>
                          <div className="text-xs text-white/40">{time}</div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                          Log Food +
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Summary of current meals */}
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                      Logged Today ({meals.length} items)
                    </h3>
                    <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                      {meals.map((m) => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white/90">{m.name}</span>
                            <div className="text-[10px] text-white/40 uppercase">
                              {m.mealType} · {m.calories} kcal
                            </div>
                          </div>
                          <span className="font-mono text-emerald-400 text-xs font-bold">
                            {m.protein}g P
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <OnboardingProfileView
                  metrics={metrics}
                  onUpdateMetrics={(newM) => {
                    setMetrics(newM);
                    setLastIslandAction('BMR Recalibrated');
                    setTimeout(() => setLastIslandAction(''), 3000);
                  }}
                />
              )}
            </IPhoneFrame>
          </div>
        )}

        {/* Right Side: Swift Architecture Studio & Codebase Viewer */}
        {(viewMode === 'split' || viewMode === 'code') && (
          <CodeArchitectureViewer />
        )}
      </div>

      {/* Global Meal Entry Modal Sheet with Gemini AI Natural Language input */}
      <MealEntryModal
        initialSlot={modalSlot}
        isOpen={isMealModalOpen}
        onClose={() => setIsMealModalOpen(false)}
        onSaveMeal={handleSaveMeal}
      />

      {/* Weekly Trends Modal (Swift Charts Analytics) */}
      <WeeklyTrendsModal
        isOpen={isWeeklyTrendsOpen}
        onClose={() => setIsWeeklyTrendsOpen(false)}
        weeklyData={weeklyData}
      />
    </div>
  );
}
