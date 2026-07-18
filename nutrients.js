// nutrients.js — single source of truth for every nutrient the app knows about.
// The AI schema, form fields, progress bars and settings toggles are all generated from these arrays.

export const MACROS = [
  { id: 'calories', unit: 'kcal', dp: 0 },
  { id: 'protein',  unit: 'g',    dp: 1 },
  { id: 'carbs',    unit: 'g',    dp: 1 },
  { id: 'fat',      unit: 'g',    dp: 1 },
];

// type: 'goal'  = reach it, exceeding is fine (fills green)
// type: 'limit' = stay under it, exceeding is bad (turns red once over)
// core: shown by default; non-core are toggleable in Settings
export const MICROS = [
  { id: 'fiber',       unit: 'g',  dp: 1, type: 'goal',  def: 30,   core: true },
  { id: 'sugar',       unit: 'g',  dp: 1, type: 'limit', def: 50,   core: true },
  { id: 'satfat',      unit: 'g',  dp: 1, type: 'limit', def: 22,   core: true },
  { id: 'sodium',      unit: 'mg', dp: 0, type: 'limit', def: 2300, core: true },
  { id: 'chol',        unit: 'mg', dp: 0, type: 'limit', def: 300,  core: true },
  { id: 'potassium',   unit: 'mg', dp: 0, type: 'goal',  def: 3400, core: true },
  { id: 'calcium',     unit: 'mg', dp: 0, type: 'goal',  def: 1000, core: true },
  { id: 'iron',        unit: 'mg', dp: 1, type: 'goal',  def: 8,    core: true },
  { id: 'magnesium',   unit: 'mg', dp: 0, type: 'goal',  def: 400,  core: false },
  { id: 'zinc',        unit: 'mg', dp: 1, type: 'goal',  def: 11,   core: false },
  { id: 'vitA',        unit: 'µg', dp: 0, type: 'goal',  def: 900,  core: false },
  { id: 'vitC',        unit: 'mg', dp: 0, type: 'goal',  def: 90,   core: false },
  { id: 'vitD',        unit: 'µg', dp: 1, type: 'goal',  def: 15,   core: false },
  { id: 'vitB12',      unit: 'µg', dp: 1, type: 'goal',  def: 2.4,  core: false },
];

export const MICRO_IDS = MICROS.map(m => m.id);

export function emptyMicros() {
  const o = {};
  for (const m of MICROS) o[m.id] = 0;
  return o;
}

const num = v => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
};

// Clamp impossible values the AI (or a typo) can produce so daily totals never corrupt.
export function validateNutrition(x) {
  const out = {
    calories: Math.max(0, num(x.calories)),
    protein:  Math.max(0, num(x.protein)),
    carbs:    Math.max(0, num(x.carbs)),
    fat:      Math.max(0, num(x.fat)),
    micros:   emptyMicros(),
  };
  const src = x.micros || {};
  for (const m of MICROS) out.micros[m.id] = Math.max(0, num(src[m.id]));
  // physical consistency: components can't exceed their parent
  out.micros.satfat = Math.min(out.micros.satfat, out.fat);
  out.micros.sugar  = Math.min(out.micros.sugar,  out.carbs);
  out.micros.fiber  = Math.min(out.micros.fiber,  out.carbs);
  return out;
}

// Multiply every nutrient (macros + micros) by the same factor — used when the user
// edits an AI item's calories, and when converting grams/servings.
export function scaleNutrition(x, factor) {
  const f = Number.isFinite(factor) && factor > 0 ? factor : 0;
  const out = {
    calories: x.calories * f,
    protein:  x.protein  * f,
    carbs:    x.carbs    * f,
    fat:      x.fat      * f,
    micros:   {},
  };
  for (const m of MICROS) out.micros[m.id] = (x.micros?.[m.id] || 0) * f;
  return out;
}

export function addNutrition(a, b) {
  const out = {
    calories: (a.calories || 0) + (b.calories || 0),
    protein:  (a.protein  || 0) + (b.protein  || 0),
    carbs:    (a.carbs    || 0) + (b.carbs    || 0),
    fat:      (a.fat      || 0) + (b.fat      || 0),
    micros:   {},
  };
  for (const m of MICROS) out.micros[m.id] = (a.micros?.[m.id] || 0) + (b.micros?.[m.id] || 0);
  return out;
}

export function zeroNutrition() {
  return { calories: 0, protein: 0, carbs: 0, fat: 0, micros: emptyMicros() };
}

// ---- Auto targets (Mifflin-St Jeor + RDA tables) --------------------------
// Calories, macros AND micronutrient targets are set together:
//   fiber / sugar / saturated fat scale with the calorie goal
//   iron / calcium / vitamins scale with sex and age
//   sodium / cholesterol / B12 stay fixed
const ACTIVITY = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9 };

export function autoTargets({ age, sex, heightCm, weightKg, activity, goal }) {
  age = num(age); heightCm = num(heightCm); weightKg = num(weightKg);
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
  let cal = bmr * (ACTIVITY[activity] || 1.375);
  if (goal === 'lose') cal -= 500;
  if (goal === 'gain') cal += 300;
  cal = Math.max(1200, Math.round(cal / 10) * 10);

  let protein = Math.round(1.6 * weightKg);
  let fat = Math.round((cal * 0.30) / 9);
  let carbs = Math.round((cal - protein * 4 - fat * 9) / 4);
  if (carbs < 50) { carbs = 50; fat = Math.max(30, Math.round((cal - protein * 4 - carbs * 4) / 9)); }

  const F = sex === 'female';
  const micro = {
    fiber:      Math.round(14 * cal / 1000),
    sugar:      Math.round(cal * 0.10 / 4),
    satfat:     Math.round(cal * 0.10 / 9),
    sodium:     2300,
    chol:       300,
    vitB12:     2.4,
    potassium:  F ? 2600 : 3400,
    calcium:    (F && age >= 51) || age >= 70 ? 1200 : 1000,
    iron:       F ? (age >= 51 ? 8 : 18) : 8,
    magnesium:  F ? 320 : 420,
    zinc:       F ? 8 : 11,
    vitA:       F ? 700 : 900,
    vitC:       F ? 75 : 90,
    vitD:       age >= 70 ? 20 : 15,
  };
  return { calories: cal, protein, carbs, fat, micro };
}

export function fmtVal(v, dp) {
  const n = num(v);
  const r = dp === 0 ? Math.round(n) : Math.round(n * 10 ** dp) / 10 ** dp;
  return String(r);
}
