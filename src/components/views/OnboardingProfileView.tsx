import React, { useState } from 'react';
import {
  Sparkles,
  Calculator,
  Flame,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  calculateBMR,
  calculateTDEE,
  calculateMacroTargets,
  ACTIVITY_MULTIPLIERS,
  GOAL_CALORIE_ADJUSTMENTS,
  type UserMetrics,
  type Gender,
  type ActivityLevel,
  type FitnessGoal,
} from '../../utils/nutrition';
import { haptic } from '../../utils/haptics';

interface OnboardingProfileViewProps {
  metrics: UserMetrics;
  onUpdateMetrics: (newMetrics: UserMetrics) => void;
}

export const OnboardingProfileView: React.FC<OnboardingProfileViewProps> = ({
  metrics,
  onUpdateMetrics,
}) => {
  const [weightKg, setWeightKg] = useState(metrics.weightKg);
  const [heightCm, setHeightCm] = useState(metrics.heightCm);
  const [age, setAge] = useState(metrics.ageYears);
  const [gender, setGender] = useState<Gender>(metrics.gender);
  const [activity, setActivity] = useState<ActivityLevel>(metrics.activityLevel);
  const [goal, setGoal] = useState<FitnessGoal>(metrics.goal);
  const [savedToast, setSavedToast] = useState(false);
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  // Live computations
  const currentMetrics: UserMetrics = {
    weightKg,
    heightCm,
    ageYears: age,
    gender,
    activityLevel: activity,
    goal,
  };

  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  const tdee = calculateTDEE(bmr, activity);
  const macroTargets = calculateMacroTargets(currentMetrics);

  const handleSave = () => {
    haptic.trigger('success');
    onUpdateMetrics(currentMetrics);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="flex flex-col gap-5 px-4 pt-1 pb-24 text-white select-none">
      {/* Title */}
      <div>
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Biometric Calibrator</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mt-0.5">
          Profile & Metabolism
        </h1>
        <p className="text-xs text-white/50 mt-1">
          Clinically calibrated via the Mifflin-St Jeor equation to compute baseline BMR, TDEE, & macro splits.
        </p>
      </div>

      {/* Live Metabolic HUD Card */}
      <div className="p-4 rounded-3xl bg-neutral-900/80 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col gap-3.5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/5">
            <span className="text-[10px] text-white/50 uppercase font-semibold">
              BMR (Resting)
            </span>
            <div className="text-lg font-black font-mono text-white mt-0.5">
              {bmr}
            </div>
            <span className="text-[9px] text-white/40">kcal/day</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
            <span className="text-[10px] text-cyan-400 uppercase font-semibold">
              TDEE (Burn)
            </span>
            <div className="text-lg font-black font-mono text-cyan-300 mt-0.5">
              {tdee}
            </div>
            <span className="text-[9px] text-cyan-400/60">maintenance</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-400 uppercase font-semibold">
              Target Goal
            </span>
            <div className="text-lg font-black font-mono text-emerald-300 mt-0.5">
              {macroTargets.calories}
            </div>
            <span className="text-[9px] text-emerald-400/60">kcal budget</span>
          </div>
        </div>

        {/* Target Macro Pills */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-xl bg-[#30D158]/10 border border-[#30D158]/20 text-center">
            <div className="text-[10px] text-[#30D158] font-bold">Protein</div>
            <div className="text-base font-extrabold font-mono text-white">
              {macroTargets.proteinGrams}g
            </div>
            <div className="text-[9px] text-white/40 font-mono">
              {Math.round(macroTargets.proteinGrams * 4)} kcal
            </div>
          </div>

          <div className="p-2 rounded-xl bg-[#64D2FF]/10 border border-[#64D2FF]/20 text-center">
            <div className="text-[10px] text-[#64D2FF] font-bold">Carbs</div>
            <div className="text-base font-extrabold font-mono text-white">
              {macroTargets.carbsGrams}g
            </div>
            <div className="text-[9px] text-white/40 font-mono">
              {Math.round(macroTargets.carbsGrams * 4)} kcal
            </div>
          </div>

          <div className="p-2 rounded-xl bg-[#BF5AF2]/10 border border-[#BF5AF2]/20 text-center">
            <div className="text-[10px] text-[#BF5AF2] font-bold">Fats</div>
            <div className="text-base font-extrabold font-mono text-white">
              {macroTargets.fatGrams}g
            </div>
            <div className="text-[9px] text-white/40 font-mono">
              {Math.round(macroTargets.fatGrams * 9)} kcal
            </div>
          </div>
        </div>

        {/* Accordion for Mathematical Proof */}
        <button
          onClick={() => setShowFormulaDetails(!showFormulaDetails)}
          className="flex items-center justify-between text-xs text-white/60 hover:text-white pt-1 px-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            {showFormulaDetails ? 'Hide calculation details' : 'View Mifflin-St Jeor formula breakdown'}
          </span>
          <span className="text-cyan-400 font-mono font-bold">
            {showFormulaDetails ? '▲' : '▼'}
          </span>
        </button>

        {showFormulaDetails && (
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-[11px] font-mono text-white/70 space-y-1.5">
            <p className="text-emerald-400 font-bold">
              • BMR (Mifflin-St Jeor):
            </p>
            <p className="pl-2">
              {gender === 'female'
                ? `10×${weightKg} + 6.25×${heightCm} - 5×${age} - 161 = ${bmr} kcal`
                : `10×${weightKg} + 6.25×${heightCm} - 5×${age} + 5 = ${bmr} kcal`}
            </p>
            <p className="text-cyan-400 font-bold">• TDEE Calculation:</p>
            <p className="pl-2">
              {bmr} × {ACTIVITY_MULTIPLIERS[activity]} ({activity}) = {tdee} kcal
            </p>
            <p className="text-purple-400 font-bold">• Goal Calorie Adjustment:</p>
            <p className="pl-2">
              {tdee} {GOAL_CALORIE_ADJUSTMENTS[goal] >= 0 ? `+ ${GOAL_CALORIE_ADJUSTMENTS[goal]}` : `- 500`} = {macroTargets.calories} kcal
            </p>
          </div>
        )}
      </div>

      {/* Inputs Form Card */}
      <div className="p-4 rounded-3xl bg-neutral-900/70 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col gap-4">
        {/* Gender Segmented Control */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
            Biological Sex (Formula Calibrator)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['male', 'female', 'other'] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  haptic.trigger('light');
                  setGender(g);
                }}
                className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                  gender === g
                    ? 'bg-white text-black border-white shadow-md'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-3">
          {/* Weight */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-white/70">Body Weight</span>
              <span className="font-mono text-emerald-400 font-bold">
                {weightKg} kg ({(weightKg * 2.20462).toFixed(1)} lbs)
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="160"
              step="0.5"
              value={weightKg}
              onChange={(e) => setWeightKg(parseFloat(e.target.value))}
              className="accent-emerald-400 h-1.5 rounded-lg bg-white/10 cursor-pointer"
            />
          </div>

          {/* Height */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-white/70">Height</span>
              <span className="font-mono text-cyan-400 font-bold">
                {heightCm} cm ({Math.floor(heightCm / 30.48)}&apos;{Math.round((heightCm % 30.48) / 2.54)}&quot;)
              </span>
            </div>
            <input
              type="range"
              min="130"
              max="220"
              step="1"
              value={heightCm}
              onChange={(e) => setHeightCm(parseInt(e.target.value, 10))}
              className="accent-cyan-400 h-1.5 rounded-lg bg-white/10 cursor-pointer"
            />
          </div>

          {/* Age */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-white/70">Age</span>
              <span className="font-mono text-purple-400 font-bold">
                {age} years old
              </span>
            </div>
            <input
              type="range"
              min="16"
              max="85"
              step="1"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value, 10))}
              className="accent-purple-400 h-1.5 rounded-lg bg-white/10 cursor-pointer"
            />
          </div>
        </div>

        {/* Activity Level Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
            Daily Physical Activity Level
          </label>
          <div className="flex flex-col gap-1.5">
            {[
              { id: 'sedentary' as const, label: 'Sedentary', desc: 'Desk job, little exercise', mult: '1.20x' },
              { id: 'light' as const, label: 'Lightly Active', desc: '1-3 days light exercise', mult: '1.38x' },
              { id: 'moderate' as const, label: 'Moderately Active', desc: '3-5 days moderate workouts', mult: '1.55x' },
              { id: 'veryActive' as const, label: 'Very Active', desc: '6-7 days heavy training', mult: '1.73x' },
              { id: 'extraActive' as const, label: 'Athlete', desc: 'Intense 2x daily or physical job', mult: '1.90x' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  haptic.trigger('light');
                  setActivity(lvl.id);
                }}
                className={`p-2.5 rounded-xl flex items-center justify-between text-left transition-all border ${
                  activity === lvl.id
                    ? 'bg-cyan-500/15 border-cyan-400/50 text-white'
                    : 'bg-white/[0.04] border-white/5 text-white/60 hover:bg-white/[0.08]'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    {lvl.label}
                    {activity === lvl.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    )}
                  </div>
                  <div className="text-[10px] text-white/40">{lvl.desc}</div>
                </div>
                <span className="text-[11px] font-mono font-bold text-cyan-400">
                  {lvl.mult}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Fitness Objective */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
            Fitness Objective
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'fatLoss' as const, label: 'Fat Loss', tag: '-500 kcal' },
              { id: 'maintenance' as const, label: 'Maintain', tag: '0 kcal' },
              { id: 'muscleGain' as const, label: 'Lean Bulk', tag: '+350 kcal' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  haptic.trigger('light');
                  setGoal(g.id);
                }}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center text-center transition-all border ${
                  goal === g.id
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(48,209,88,0.3)]'
                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                }`}
              >
                <span className="text-xs font-bold text-white">{g.label}</span>
                <span className="text-[9px] font-mono text-emerald-400/80">
                  {g.tag}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Save & Calibrate Baselines</span>
        </button>

        {savedToast && (
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-semibold animate-fade-in">
            Baselines persisted to SwiftData! Macro targets updated.
          </div>
        )}
      </div>
    </div>
  );
};
