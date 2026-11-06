/**
 * Nutrition & Metabolic Calculation Engine
 * Implements clinically validated Mifflin-St Jeor BMR, Activity Multipliers for TDEE,
 * Step-based Caloric Expenditure, and Macro Distribution algorithms.
 */

export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'veryActive'
  | 'extraActive';

export type FitnessGoal = 'fatLoss' | 'maintenance' | 'muscleGain';

export interface UserMetrics {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
}

export interface MacroTarget {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterMl: number;
}

export interface MealItemLog {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,       // Little to no exercise
  light: 1.375,         // Light exercise 1-3 days/week
  moderate: 1.55,       // Moderate exercise 3-5 days/week
  veryActive: 1.725,    // Hard exercise 6-7 days/week
  extraActive: 1.9,     // Very intense athletic training
};

export const GOAL_CALORIE_ADJUSTMENTS: Record<FitnessGoal, number> = {
  fatLoss: -500,        // ~0.5kg/week deficit
  maintenance: 0,
  muscleGain: 350,      // Controlled lean surplus
};

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation.
 * Clinically demonstrated to be within 10% of measured resting energy expenditure.
 *
 * Men:   BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age_years) + 5
 * Women: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age_years) - 161
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: Gender
): number {
  if (weightKg <= 0 || heightCm <= 0 || ageYears <= 0) return 0;
  
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  
  if (gender === 'female') {
    return Math.round(base - 161);
  } else if (gender === 'male') {
    return Math.round(base + 5);
  } else {
    // Gender-neutral average midpoint
    return Math.round(base - 78);
  }
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 * TDEE = BMR × Activity Multiplier
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calculates optimal macro targets based on goal, body mass, and total target calories.
 * Optimal athletic split:
 * - Protein: 2.0g per kg of bodyweight (clamped between 25-35% of total calories)
 * - Fat: 0.8g to 1.0g per kg bodyweight (~25-30% of total calories)
 * - Carbs: Remaining caloric budget (4 kcal/g)
 */
export function calculateMacroTargets(metrics: UserMetrics): MacroTarget {
  const bmr = calculateBMR(
    metrics.weightKg,
    metrics.heightCm,
    metrics.ageYears,
    metrics.gender
  );
  const tdee = calculateTDEE(bmr, metrics.activityLevel);
  const targetCalories = Math.max(1200, tdee + GOAL_CALORIE_ADJUSTMENTS[metrics.goal]);

  // Protein: targeted 2.0g/kg bodyweight for active individuals
  let proteinGrams = Math.round(metrics.weightKg * 2.0);
  // Ensure protein doesn't exceed 40% of calories or drop below 20%
  const proteinMinGrams = Math.round((targetCalories * 0.20) / 4);
  const proteinMaxGrams = Math.round((targetCalories * 0.35) / 4);
  proteinGrams = Math.max(proteinMinGrams, Math.min(proteinMaxGrams, proteinGrams));

  // Fat: 0.9g/kg bodyweight or ~25-28% of calories
  let fatGrams = Math.round(metrics.weightKg * 0.9);
  const fatMinGrams = Math.round((targetCalories * 0.20) / 9);
  const fatMaxGrams = Math.round((targetCalories * 0.30) / 9);
  fatGrams = Math.max(fatMinGrams, Math.min(fatMaxGrams, fatGrams));

  // Carbs: Remaining calories
  const remainingCaloriesForCarbs = Math.max(0, targetCalories - (proteinGrams * 4 + fatGrams * 9));
  const carbsGrams = Math.round(remainingCaloriesForCarbs / 4);

  // Baseline recommended hydration (35ml per kg of body mass)
  const waterMl = Math.round(metrics.weightKg * 35);

  return {
    calories: targetCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    waterMl,
  };
}

/**
 * Calculates active caloric burn from steps using standard metabolic equivalents (METs)
 * and individual weight coefficient.
 * Average caloric expenditure per step is roughly: (0.04 kcal * (weightKg / 70kg)).
 */
export function calculateStepCalories(steps: number, weightKg: number): number {
  if (steps <= 0 || weightKg <= 0) return 0;
  const weightFactor = weightKg / 70; // normalized to 70kg average
  return Math.round(steps * 0.04 * weightFactor);
}

/**
 * Calculates net caloric balance:
 * Net = Total Consumed - Active Step Expenditure
 */
export function calculateNetCalories(consumedCalories: number, activeBurnCalories: number): number {
  return Math.max(0, consumedCalories - activeBurnCalories);
}
