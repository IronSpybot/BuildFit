import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Sun, SunMedium, Moon, Wand2, Loader2 } from 'lucide-react';
import type { MealItemLog } from '../../utils/nutrition';
import { haptic } from '../../utils/haptics';

interface MealEntryModalProps {
  initialSlot: 'breakfast' | 'lunch' | 'dinner';
  isOpen: boolean;
  onClose: () => void;
  onSaveMeal: (meal: Omit<MealItemLog, 'id' | 'timestamp'>) => void;
}

export const MealEntryModal: React.FC<MealEntryModalProps> = ({
  initialSlot,
  isOpen,
  onClose,
  onSaveMeal,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<'breakfast' | 'lunch' | 'dinner'>(
    initialSlot
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedSlot(initialSlot);
    }
  }, [isOpen, initialSlot]);

  // AI Natural Language input
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [isAiEstimating, setIsAiEstimating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Form inputs
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('450');
  const [protein, setProtein] = useState('30');
  const [carbs, setCarbs] = useState('45');
  const [fat, setFat] = useState('15');

  // Quick food presets
  const presets = [
    { name: 'Oatmeal & Whey Protein', cal: 380, p: 32, c: 45, f: 6, slot: 'breakfast' },
    { name: 'Eggs & Avocado Sourdough', cal: 450, p: 24, c: 34, f: 22, slot: 'breakfast' },
    { name: 'Grilled Chicken Rice Bowl', cal: 540, p: 48, c: 56, f: 10, slot: 'lunch' },
    { name: 'Tuna Salad Wrap', cal: 410, p: 36, c: 38, f: 12, slot: 'lunch' },
    { name: 'Wild Salmon & Sweet Potato', cal: 580, p: 44, c: 42, f: 20, slot: 'dinner' },
    { name: '2 Chapatis & Chicken Curry', cal: 530, p: 36, c: 48, f: 16, slot: 'dinner' },
  ];

  if (!isOpen) return null;

  const handleApplyPreset = (p: typeof presets[0]) => {
    haptic.trigger('light');
    setFoodName(p.name);
    setCalories(p.cal.toString());
    setProtein(p.p.toString());
    setCarbs(p.c.toString());
    setFat(p.f.toString());
    setSelectedSlot(p.slot as 'breakfast' | 'lunch' | 'dinner');
  };

  const handleGeminiEstimate = async () => {
    if (!naturalLanguageInput.trim() || isAiEstimating) return;

    haptic.trigger('light');
    setIsAiEstimating(true);
    setAiError(null);

    try {
      const res = await fetch('/api/gemini/estimate-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: naturalLanguageInput.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Estimation failed with status ${res.status}`);
      }

      const data = await res.json();
      haptic.trigger('success');

      if (data.name) setFoodName(data.name);
      if (data.calories != null) setCalories(Math.round(data.calories).toString());
      if (data.protein != null) setProtein(Math.round(data.protein).toString());
      if (data.carbs != null) setCarbs(Math.round(data.carbs).toString());
      if (data.fat != null) setFat(Math.round(data.fat).toString());
    } catch (err: unknown) {
      console.error('Gemini error:', err);
      setAiError('Could not reach Gemini estimation service. Falling back to manual entry.');
      haptic.trigger('delete');
    } finally {
      setIsAiEstimating(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;

    haptic.trigger('success');
    onSaveMeal({
      name: foodName.trim(),
      mealType: selectedSlot,
      calories: Math.max(0, parseFloat(calories) || 0),
      protein: Math.max(0, parseFloat(protein) || 0),
      carbs: Math.max(0, parseFloat(carbs) || 0),
      fat: Math.max(0, parseFloat(fat) || 0),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-neutral-950 border border-white/15 p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Log Meal Entry
            </h3>
          </div>
          <button
            onClick={() => {
              haptic.trigger('light');
              onClose();
            }}
            aria-label="Close meal log modal"
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Strict 3-Slot Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
            Meal Slot (Strict 3 Categories)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { slot: 'breakfast' as const, label: 'Breakfast', icon: Sun },
              { slot: 'lunch' as const, label: 'Lunch', icon: SunMedium },
              { slot: 'dinner' as const, label: 'Dinner', icon: Moon },
            ].map(({ slot, label, icon: Icon }) => (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  haptic.trigger('light');
                  setSelectedSlot(slot);
                }}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all border active:scale-95 ${
                  selectedSlot === slot
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_12px_rgba(48,209,88,0.4)]'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 1. AI Smart Meal Logging (Gemini Integration) */}
        <div className="p-3.5 rounded-2xl bg-cyan-500/[0.07] border border-cyan-400/25 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-bold text-cyan-300">
                AI Smart Meal Logging (Gemini)
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              Natural Language
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={naturalLanguageInput}
              onChange={(e) => setNaturalLanguageInput(e.target.value)}
              placeholder="e.g. I ate 2 chapatis and chicken curry"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGeminiEstimate();
                }
              }}
              className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={handleGeminiEstimate}
              disabled={isAiEstimating || !naturalLanguageInput.trim()}
              aria-label="Estimate macros with Gemini"
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 text-black font-extrabold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
            >
              {isAiEstimating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Estimating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Estimate</span>
                </>
              )}
            </button>
          </div>

          {aiError && (
            <p className="text-[10px] text-rose-400 leading-tight">{aiError}</p>
          )}
        </div>

        {/* Presets */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
            Quick Nutrition Presets
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="whitespace-nowrap px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-left transition-all active:scale-95"
              >
                <div className="text-[11px] font-semibold text-white/90 truncate max-w-[140px]">
                  {p.name}
                </div>
                <div className="text-[10px] font-mono text-emerald-400">
                  {p.cal} kcal · {p.p}g P
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="food-name"
              className="text-[11px] font-bold text-white/50 uppercase tracking-wider"
            >
              Food or Meal Description
            </label>
            <input
              id="food-name"
              type="text"
              required
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g. Scrambled eggs & whole wheat toast"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Calories & Macros Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="input-calories"
                className="text-[11px] font-bold text-rose-400 uppercase tracking-wider"
              >
                Calories (kcal)
              </label>
              <input
                id="input-calories"
                type="number"
                min="0"
                step="1"
                required
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="input-protein"
                className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider"
              >
                Protein (g)
              </label>
              <input
                id="input-protein"
                type="number"
                min="0"
                step="0.5"
                required
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="input-carbs"
                className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider"
              >
                Carbohydrates (g)
              </label>
              <input
                id="input-carbs"
                type="number"
                min="0"
                step="0.5"
                required
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="input-fat"
                className="text-[11px] font-bold text-purple-400 uppercase tracking-wider"
              >
                Fats (g)
              </label>
              <input
                id="input-fat"
                type="number"
                min="0"
                step="0.5"
                required
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Submit Button with Scale */}
          <button
            type="submit"
            className="w-full mt-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Save to {selectedSlot.toUpperCase()}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
