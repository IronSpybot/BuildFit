import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBMR,
  calculateTDEE,
  calculateMacroTargets,
  calculateStepCalories,
  calculateNetCalories,
  type UserMetrics,
} from './nutrition';

test('Mifflin-St Jeor formula calculates male BMR accurately', () => {
  // Male: 80kg, 180cm, 30 years old
  // Formula: 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
  const bmr = calculateBMR(80, 180, 30, 'male');
  assert.equal(bmr, 1780);
});

test('Mifflin-St Jeor formula calculates female BMR accurately', () => {
  // Female: 65kg, 168cm, 28 years old
  // Formula: 10*65 + 6.25*168 - 5*28 - 161 = 650 + 1050 - 140 - 161 = 1399
  const bmr = calculateBMR(65, 168, 28, 'female');
  assert.equal(bmr, 1399);
});

test('TDEE properly applies activity multipliers', () => {
  const bmr = 1780;
  // Sedentary (1.2): 1780 * 1.2 = 2136
  assert.equal(calculateTDEE(bmr, 'sedentary'), 2136);
  // Moderate (1.55): 1780 * 1.55 = 2759
  assert.equal(calculateTDEE(bmr, 'moderate'), 2759);
  // Very Active (1.725): 1780 * 1.725 = 3071
  assert.equal(calculateTDEE(bmr, 'veryActive'), 3071);
});

test('Macro targets provide balanced calorie distribution and deficit for fat loss', () => {
  const metrics: UserMetrics = {
    weightKg: 80,
    heightCm: 180,
    ageYears: 30,
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'fatLoss',
  };

  const macros = calculateMacroTargets(metrics);
  // TDEE is 2759. Fat loss deficit is -500 => target calories = 2259
  assert.equal(macros.calories, 2259);
  // Protein 80kg * 2.0 = 160g
  assert.equal(macros.proteinGrams, 160);
  assert.ok(macros.carbsGrams > 0);
  assert.ok(macros.fatGrams > 0);
  // Total macro calories roughly equal caloric budget
  const reconstructedCalories = macros.proteinGrams * 4 + macros.fatGrams * 9 + macros.carbsGrams * 4;
  assert.ok(Math.abs(reconstructedCalories - macros.calories) <= 10);
});

test('Step calories burn scales with user body weight', () => {
  // 10,000 steps for 70kg person = 10000 * 0.04 * (70/70) = 400 kcal
  assert.equal(calculateStepCalories(10000, 70), 400);
  // 10,000 steps for 84kg person = 10000 * 0.04 * (84/70) = 480 kcal
  assert.equal(calculateStepCalories(10000, 84), 480);
});

test('Net calorie calculation accurately subtracts step burn', () => {
  const consumed = 2100;
  const burned = 450;
  assert.equal(calculateNetCalories(consumed, burned), 1650);
});
