// ingredients.js — built-in database (~130 items). ALL values are per 100 g (drinks per 100 ml).
// An item with a `unit` (e.g. egg: { g: 50 }) is logged by COUNT — one unit weighs unit.g grams —
// but its stored values stay on the per-100g basis, same as everything else.
// Micros array order: [fiber, sugar, satfat, sodium, chol, potassium, calcium, iron,
//                      magnesium, zinc, vitA, vitC, vitD, vitB12]
// Units: g g g mg mg mg mg mg mg mg µgRAE mg µg µg
// Macro values are sourced from standard food-composition data; micro values for
// composite dishes are estimates — treat them as directional.
import { MICRO_IDS } from './nutrients.js';

export const CATEGORIES = ['grains', 'bread', 'protein', 'dairy', 'legumes', 'veg', 'fruit', 'nuts', 'dishes', 'sweets', 'drinks'];

function r(id, en, ar, cat, kcal, p, c, f, m, unit) {
  const micros = {};
  MICRO_IDS.forEach((k, i) => { micros[k] = m[i] || 0; });
  return { id, en, ar, cat, calories: kcal, protein: p, carbs: c, fat: f, micros, unit: unit || null };
}

export const INGREDIENTS = [
  // ---- grains & rice (raw vs cooked listed separately — cooking changes weight) ----
  r('rice_w_raw',   'White rice (raw)',        'أرز أبيض نيء',        'grains', 365, 7.1, 80, 0.7, [1.3, 0.1, 0.2, 5, 0, 115, 28, 4.3, 25, 1.1, 0, 0, 0, 0]),
  r('rice_w_ckd',   'White rice (cooked)',     'أرز أبيض مطبوخ',      'grains', 130, 2.7, 28, 0.3, [0.4, 0.1, 0.1, 1, 0, 35, 10, 1.2, 12, 0.5, 0, 0, 0, 0]),
  r('rice_bas_ckd', 'Basmati rice (cooked)',   'أرز بسمتي مطبوخ',     'grains', 121, 3.0, 25, 0.4, [0.6, 0.1, 0.1, 2, 0, 40, 10, 1.1, 13, 0.5, 0, 0, 0, 0]),
  r('rice_br_ckd',  'Brown rice (cooked)',     'أرز بني مطبوخ',       'grains', 123, 2.7, 26, 1.0, [1.8, 0.2, 0.3, 4, 0, 86, 3, 0.6, 43, 0.7, 0, 0, 0, 0]),
  r('pasta_raw',    'Pasta (raw)',             'معكرونة نيئة',        'grains', 371, 13, 75, 1.5, [3.2, 2.7, 0.3, 6, 0, 223, 21, 3.3, 53, 1.4, 0, 0, 0, 0]),
  r('pasta_ckd',    'Pasta (cooked)',          'معكرونة مطبوخة',      'grains', 158, 5.8, 31, 0.9, [1.8, 0.6, 0.2, 1, 0, 44, 7, 1.3, 18, 0.5, 0, 0, 0, 0]),
  r('vermicelli',   'Vermicelli (cooked)',     'شعيرية مطبوخة',       'grains', 160, 5.5, 32, 0.8, [1.6, 0.5, 0.2, 3, 0, 40, 8, 1.2, 16, 0.5, 0, 0, 0, 0]),
  r('oats',         'Oats (dry)',              'شوفان',               'grains', 389, 16.9, 66, 6.9, [10.6, 1.0, 1.2, 2, 0, 429, 54, 4.7, 177, 4.0, 0, 0, 0, 0]),
  r('bulgur_ckd',   'Bulgur (cooked)',         'برغل مطبوخ',          'grains', 83, 3.1, 18.6, 0.2, [4.5, 0.1, 0.1, 5, 0, 68, 10, 1.0, 32, 0.6, 0, 0, 0, 0]),
  r('couscous_ckd', 'Couscous (cooked)',       'كسكس مطبوخ',          'grains', 112, 3.8, 23, 0.2, [1.4, 0.1, 0.1, 5, 0, 58, 8, 0.4, 8, 0.3, 0, 0, 0, 0]),
  r('quinoa_ckd',   'Quinoa (cooked)',         'كينوا مطبوخة',        'grains', 120, 4.4, 21, 1.9, [2.8, 0.9, 0.2, 7, 0, 172, 17, 1.5, 64, 1.1, 0, 0, 0, 0]),

  // ---- bread ----
  r('pita_w',       'Arabic bread (white)',    'خبز عربي أبيض',       'bread', 275, 9, 55, 1.2, [2.2, 1.0, 0.2, 536, 0, 120, 86, 2.6, 26, 0.8, 0, 0, 0, 0]),
  r('pita_ww',      'Arabic bread (whole wheat)', 'خبز عربي أسمر',    'bread', 262, 9.8, 51, 2.6, [6.0, 0.8, 0.4, 421, 0, 170, 15, 3.0, 69, 1.5, 0, 0, 0, 0]),
  r('tamees',       'Tamees bread',            'تميس',                'bread', 290, 9, 54, 4.0, [2.0, 2.0, 1.0, 450, 0, 120, 30, 2.5, 25, 0.8, 0, 0, 0, 0]),
  r('toast_w',      'Toast bread (white)',     'خبز توست أبيض',       'bread', 265, 9, 49, 3.2, [2.7, 5.0, 0.8, 490, 0, 126, 144, 3.6, 23, 0.7, 0, 0, 0, 0]),
  r('samoli',       'Samoli roll',             'صامولي',              'bread', 280, 8.5, 52, 3.5, [2.3, 4.0, 0.8, 480, 0, 115, 70, 3.0, 22, 0.7, 0, 0, 0, 0]),
  r('chapati',      'Chapati / roti',          'روتي / جباتي',        'bread', 300, 8, 50, 7.0, [4.9, 2.7, 1.5, 300, 0, 200, 30, 3.0, 62, 1.6, 0, 0, 0, 0]),
  r('croissant',    'Croissant',               'كرواسون',             'bread', 406, 8, 45, 21, [2.6, 11, 12, 424, 67, 118, 37, 2.0, 16, 0.7, 116, 0, 0.5, 0.2]),

  // ---- meat & fish (raw and cooked separately) ----
  r('ck_breast_raw','Chicken breast (raw)',    'صدر دجاج نيء',        'protein', 120, 22.5, 0, 2.6, [0, 0, 0.6, 45, 64, 334, 5, 0.4, 28, 0.7, 9, 0, 0.1, 0.2]),
  r('ck_breast_ckd','Chicken breast (cooked)', 'صدر دجاج مطبوخ',      'protein', 165, 31, 0, 3.6, [0, 0, 1.0, 74, 85, 256, 15, 1.0, 29, 1.0, 9, 0, 0.1, 0.3]),
  r('ck_thigh_raw', 'Chicken thigh (raw)',     'فخذ دجاج نيء',        'protein', 144, 17, 0, 8.0, [0, 0, 2.2, 86, 94, 222, 8, 0.8, 20, 1.7, 20, 0, 0.1, 0.5]),
  r('ck_thigh_ckd', 'Chicken thigh (cooked)',  'فخذ دجاج مطبوخ',      'protein', 209, 26, 0, 10.9, [0, 0, 3.0, 84, 105, 230, 11, 1.3, 23, 2.4, 18, 0, 0.1, 0.6]),
  r('ck_roast',     'Roasted chicken (with skin)', 'دجاج مشوي بالجلد','protein', 239, 27, 0, 14, [0, 0, 3.9, 82, 88, 223, 15, 1.3, 23, 1.9, 47, 0, 0.2, 0.3]),
  r('beef_raw',     'Beef, lean (raw)',        'لحم بقري نيء',        'protein', 150, 21, 0, 7.0, [0, 0, 2.8, 61, 62, 330, 12, 1.9, 21, 4.5, 2, 0, 0.1, 2.0]),
  r('beef_ckd',     'Beef, lean (cooked)',     'لحم بقري مطبوخ',      'protein', 217, 26, 0, 12, [0, 0, 4.5, 66, 90, 318, 14, 2.6, 21, 6.3, 3, 0, 0.1, 2.6]),
  r('lamb_raw',     'Lamb (raw)',              'لحم غنم نيء',         'protein', 210, 17, 0, 16, [0, 0, 7.0, 59, 65, 280, 10, 1.6, 21, 3.3, 7, 0, 0.1, 2.3]),
  r('lamb_ckd',     'Lamb (cooked)',           'لحم غنم مطبوخ',       'protein', 258, 25, 0, 17, [0, 0, 7.2, 72, 97, 310, 14, 1.9, 22, 4.4, 8, 0, 0.1, 2.5]),
  r('gbeef_raw',    'Ground beef 15% (raw)',   'لحم مفروم نيء',       'protein', 215, 18.5, 0, 15, [0, 0, 5.9, 67, 68, 289, 15, 2.0, 19, 4.4, 4, 0, 0.1, 2.1]),
  r('gbeef_ckd',    'Ground beef 15% (cooked)','لحم مفروم مطبوخ',     'protein', 250, 26, 0, 15.4, [0, 0, 6.0, 72, 88, 302, 20, 2.4, 20, 5.5, 4, 0, 0.1, 2.4]),
  r('camel_ckd',    'Camel meat (cooked)',     'لحم حاشي مطبوخ',      'protein', 160, 29, 0, 4.5, [0, 0, 1.8, 70, 60, 300, 10, 3.0, 22, 4.0, 3, 0, 0, 2.5]),
  r('hamour_raw',   'Hamour / grouper (raw)',  'هامور نيء',           'protein', 92, 19.4, 0, 1.0, [0, 0, 0.2, 53, 37, 483, 27, 0.9, 31, 0.5, 43, 0, 0, 0.6]),
  r('hamour_ckd',   'Hamour / grouper (cooked)','هامور مطبوخ',        'protein', 118, 24.8, 0, 1.3, [0, 0, 0.3, 53, 47, 475, 21, 1.1, 37, 0.5, 50, 0, 0, 0.7]),
  r('salmon_raw',   'Salmon (raw)',            'سلمون نيء',           'protein', 208, 20, 0, 13, [0, 0, 3.1, 59, 55, 363, 9, 0.3, 27, 0.4, 58, 4, 11, 3.2]),
  r('salmon_ckd',   'Salmon (cooked)',         'سلمون مطبوخ',         'protein', 206, 22, 0, 12, [0, 0, 2.5, 61, 63, 384, 15, 0.3, 30, 0.4, 58, 4, 13, 2.8]),
  r('tuna_can',     'Tuna, canned in water',   'تونة معلبة بالماء',   'protein', 116, 26, 0, 0.8, [0, 0, 0.2, 338, 30, 237, 14, 1.5, 27, 0.8, 17, 0, 1.7, 2.5]),
  r('shrimp_ckd',   'Shrimp (cooked)',         'روبيان مطبوخ',        'protein', 99, 24, 0.2, 0.3, [0, 0, 0.1, 350, 189, 170, 70, 0.5, 35, 1.6, 54, 0, 0.1, 1.4]),
  r('tilapia_ckd',  'White fish / tilapia (cooked)', 'سمك أبيض مطبوخ','protein', 128, 26, 0, 2.7, [0, 0, 0.9, 52, 57, 380, 14, 0.7, 34, 0.4, 0, 0, 3.7, 1.9]),
  r('liver_ck',     'Chicken liver (cooked)',  'كبدة دجاج مطبوخة',    'protein', 167, 24.5, 0.9, 6.5, [0, 0, 2.0, 76, 563, 263, 11, 11.6, 25, 4.0, 3984, 27.9, 0.2, 16.9]),
  r('hotdog',       'Sausage / hot dog',       'نقانق',               'protein', 290, 11, 3, 26, [0, 1.5, 9.5, 1100, 60, 200, 25, 1.2, 12, 2.0, 0, 0, 0.4, 1.0]),

  // ---- eggs & dairy ----
  r('egg',          'Egg (whole)',             'بيضة',                'dairy', 143, 12.6, 0.7, 9.5, [0, 0.4, 3.1, 142, 372, 138, 56, 1.8, 12, 1.3, 160, 0, 2.0, 1.1], { g: 50 }),
  r('egg_white',    'Egg white',               'بياض بيضة',           'dairy', 52, 10.9, 0.7, 0.2, [0, 0.7, 0, 166, 0, 163, 7, 0.1, 11, 0, 0, 0, 0, 0.1], { g: 33 }),
  r('milk_full',    'Whole milk',              'حليب كامل الدسم',     'dairy', 61, 3.2, 4.8, 3.3, [0, 4.8, 1.9, 43, 10, 132, 113, 0, 10, 0.4, 46, 0, 1.3, 0.5]),
  r('milk_low',     'Low-fat milk',            'حليب قليل الدسم',     'dairy', 42, 3.4, 5.0, 1.0, [0, 5.0, 0.6, 44, 5, 150, 125, 0, 11, 0.4, 58, 0, 1.2, 0.5]),
  r('laban',        'Laban (drinking yogurt)', 'لبن',                 'dairy', 40, 3.3, 4.5, 1.0, [0, 4.4, 0.6, 55, 4, 150, 110, 0, 10, 0.4, 12, 0, 0, 0.4]),
  r('labneh',       'Labneh',                  'لبنة',                'dairy', 170, 8, 4, 13, [0, 3.5, 8.5, 380, 35, 140, 120, 0.1, 11, 0.5, 120, 0, 0.1, 0.4]),
  r('yog_greek',    'Greek yogurt (low-fat)',  'زبادي يوناني',        'dairy', 59, 10, 3.6, 0.4, [0, 3.2, 0.3, 36, 5, 141, 110, 0.1, 11, 0.5, 1, 0, 0, 0.8]),
  r('yog_full',     'Yogurt (full fat)',       'زبادي كامل الدسم',    'dairy', 61, 3.5, 4.7, 3.3, [0, 4.7, 2.1, 46, 13, 155, 121, 0.1, 12, 0.6, 27, 0.5, 0.1, 0.4]),
  r('cheddar',      'Cheddar cheese',          'جبن شيدر',            'dairy', 403, 25, 1.3, 33, [0, 0.5, 21, 621, 105, 98, 710, 0.7, 28, 3.1, 263, 0, 0.6, 0.8]),
  r('halloumi',     'Halloumi',                'جبن حلوم',            'dairy', 321, 22, 2.2, 25, [0, 2.0, 16, 1300, 70, 110, 700, 0.2, 25, 2.8, 200, 0, 0.3, 0.6]),
  r('feta',         'Feta cheese',             'جبنة فيتا',           'dairy', 264, 14, 4.1, 21, [0, 4.1, 15, 917, 89, 62, 493, 0.7, 19, 2.9, 125, 0, 0.4, 1.7]),
  r('cream_cheese', 'Cream cheese',            'جبنة كريمية',         'dairy', 342, 6, 4.1, 34, [0, 3.2, 20, 314, 101, 132, 97, 0.1, 9, 0.5, 308, 0, 0.4, 0.3]),
  r('cheese_spread','Processed cheese spread', 'جبن مطبوخ قابل للدهن','dairy', 300, 12, 5, 26, [0, 5.0, 15, 1200, 70, 150, 450, 0.2, 20, 2.0, 200, 0, 0.3, 0.6]),

  // ---- legumes ----
  r('foul',         'Foul mudammas (cooked fava)', 'فول مدمس',        'legumes', 110, 7.6, 19, 0.4, [5.4, 1.8, 0.1, 250, 0, 268, 36, 1.5, 43, 1.0, 2, 0.3, 0, 0]),
  r('hummus_dip',   'Hummus (dip)',            'حمص بطحينة',          'legumes', 166, 7.9, 14.3, 9.6, [6.0, 0.3, 1.4, 379, 0, 228, 38, 2.4, 40, 1.8, 3, 0, 0, 0]),
  r('chickpeas_ckd','Chickpeas (boiled)',      'حمص حب مسلوق',        'legumes', 164, 8.9, 27, 2.6, [7.6, 4.8, 0.3, 7, 0, 291, 49, 2.9, 48, 1.5, 1, 1.3, 0, 0]),
  r('lentils_ckd',  'Lentils (cooked)',        'عدس مطبوخ',           'legumes', 116, 9, 20, 0.4, [7.9, 1.8, 0.1, 2, 0, 369, 19, 3.3, 36, 1.3, 0, 1.5, 0, 0]),
  r('falafel',      'Falafel',                 'فلافل',               'legumes', 333, 13.3, 31.8, 17.8, [4.9, 1.0, 2.4, 294, 0, 585, 54, 3.4, 82, 1.5, 1, 1.6, 0, 0]),
  r('wbeans_ckd',   'White beans (cooked)',    'فاصولياء بيضاء مطبوخة','legumes', 139, 9.7, 25, 0.4, [6.3, 0.3, 0.1, 6, 0, 561, 90, 3.7, 63, 1.4, 0, 0, 0, 0]),

  // ---- vegetables ----
  r('tomato',       'Tomato',                  'طماطم',               'veg', 18, 0.9, 3.9, 0.2, [1.2, 2.6, 0, 5, 0, 237, 10, 0.3, 11, 0.2, 42, 14, 0, 0]),
  r('cucumber',     'Cucumber',                'خيار',                'veg', 15, 0.7, 3.6, 0.1, [0.5, 1.7, 0, 2, 0, 147, 16, 0.3, 13, 0.2, 5, 2.8, 0, 0]),
  r('lettuce',      'Lettuce',                 'خس',                  'veg', 15, 1.4, 2.9, 0.2, [1.3, 1.2, 0, 8, 0, 194, 33, 0.9, 14, 0.2, 130, 4, 0, 0]),
  r('onion',        'Onion',                   'بصل',                 'veg', 40, 1.1, 9.3, 0.1, [1.7, 4.2, 0, 4, 0, 146, 23, 0.2, 10, 0.2, 0, 7.4, 0, 0]),
  r('garlic',       'Garlic',                  'ثوم',                 'veg', 149, 6.4, 33, 0.5, [2.1, 1.0, 0.1, 17, 0, 401, 181, 1.7, 25, 1.2, 0, 31, 0, 0]),
  r('potato_boil',  'Potato (boiled)',         'بطاطس مسلوقة',        'veg', 87, 1.9, 20, 0.1, [1.8, 0.9, 0, 4, 0, 379, 5, 0.3, 20, 0.3, 0, 7, 0, 0]),
  r('fries',        'French fries',            'بطاطس مقلية',         'veg', 312, 3.4, 41, 15, [3.8, 0.3, 2.5, 210, 0, 579, 12, 0.7, 27, 0.4, 0, 4, 0, 0]),
  r('sweet_potato', 'Sweet potato (baked)',    'بطاطا حلوة',          'veg', 90, 2.0, 21, 0.2, [3.3, 6.5, 0.1, 36, 0, 475, 38, 0.7, 27, 0.3, 961, 20, 0, 0]),
  r('carrot',       'Carrot',                  'جزر',                 'veg', 41, 0.9, 9.6, 0.2, [2.8, 4.7, 0, 69, 0, 320, 33, 0.3, 12, 0.2, 835, 5.9, 0, 0]),
  r('bell_pepper',  'Bell pepper (red)',       'فلفل رومي أحمر',      'veg', 31, 1.0, 6.0, 0.3, [2.1, 4.2, 0.1, 4, 0, 211, 7, 0.4, 12, 0.3, 157, 128, 0, 0]),
  r('zucchini',     'Zucchini',                'كوسة',                'veg', 17, 1.2, 3.1, 0.3, [1.0, 2.5, 0.1, 8, 0, 261, 16, 0.4, 18, 0.3, 10, 17.9, 0, 0]),
  r('eggplant',     'Eggplant',                'باذنجان',             'veg', 25, 1.0, 6.0, 0.2, [3.0, 3.5, 0, 2, 0, 229, 9, 0.2, 14, 0.2, 1, 2.2, 0, 0]),
  r('okra',         'Okra',                    'بامية',               'veg', 33, 1.9, 7.5, 0.2, [3.2, 1.5, 0, 7, 0, 299, 82, 0.6, 57, 0.6, 36, 23, 0, 0]),
  r('spinach',      'Spinach',                 'سبانخ',               'veg', 23, 2.9, 3.6, 0.4, [2.2, 0.4, 0.1, 79, 0, 558, 99, 2.7, 79, 0.5, 469, 28, 0, 0]),
  r('broccoli',     'Broccoli',                'بروكلي',              'veg', 34, 2.8, 6.6, 0.4, [2.6, 1.7, 0, 33, 0, 316, 47, 0.7, 21, 0.4, 31, 89, 0, 0]),
  r('cauliflower',  'Cauliflower',             'قرنبيط',              'veg', 25, 1.9, 5.0, 0.3, [2.0, 1.9, 0.1, 30, 0, 299, 22, 0.4, 15, 0.3, 0, 48, 0, 0]),
  r('mushroom',     'Mushrooms',               'فطر',                 'veg', 22, 3.1, 3.3, 0.3, [1.0, 2.0, 0, 5, 0, 318, 3, 0.5, 9, 0.5, 0, 2, 0.2, 0]),
  r('molokhia',     'Molokhia (cooked)',       'ملوخية مطبوخة',       'veg', 60, 3.5, 6.0, 2.5, [2.0, 0.8, 0.4, 250, 0, 300, 120, 2.5, 40, 0.5, 150, 15, 0, 0]),

  // ---- fruits ----
  r('dates',        'Dates (dried)',           'تمر',                 'fruit', 282, 2.5, 75, 0.4, [8.0, 63, 0, 2, 0, 656, 39, 1.0, 43, 0.3, 7, 0.4, 0, 0]),
  r('rutab',        'Rutab (fresh dates)',     'رطب',                 'fruit', 157, 1.2, 37, 0.1, [5.0, 34, 0, 1, 0, 480, 32, 0.6, 30, 0.2, 6, 1, 0, 0]),
  r('banana',       'Banana',                  'موز',                 'fruit', 89, 1.1, 23, 0.3, [2.6, 12, 0.1, 1, 0, 358, 5, 0.3, 27, 0.2, 3, 8.7, 0, 0]),
  r('apple',        'Apple',                   'تفاح',                'fruit', 52, 0.3, 14, 0.2, [2.4, 10.4, 0, 1, 0, 107, 6, 0.1, 5, 0, 3, 4.6, 0, 0]),
  r('orange',       'Orange',                  'برتقال',              'fruit', 47, 0.9, 12, 0.1, [2.4, 9.4, 0, 0, 0, 181, 40, 0.1, 10, 0.1, 11, 53, 0, 0]),
  r('mango',        'Mango',                   'مانجو',               'fruit', 60, 0.8, 15, 0.4, [1.6, 13.7, 0.1, 1, 0, 168, 11, 0.2, 10, 0.1, 54, 36, 0, 0]),
  r('grapes',       'Grapes',                  'عنب',                 'fruit', 69, 0.7, 18, 0.2, [0.9, 15.5, 0.1, 2, 0, 191, 10, 0.4, 7, 0.1, 3, 3.2, 0, 0]),
  r('watermelon',   'Watermelon',              'بطيخ',                'fruit', 30, 0.6, 8.0, 0.2, [0.4, 6.2, 0, 1, 0, 112, 7, 0.2, 10, 0.1, 28, 8.1, 0, 0]),
  r('pomegranate',  'Pomegranate',             'رمان',                'fruit', 83, 1.7, 19, 1.2, [4.0, 13.7, 0.1, 3, 0, 236, 10, 0.3, 12, 0.4, 0, 10.2, 0, 0]),
  r('strawberry',   'Strawberries',            'فراولة',              'fruit', 32, 0.7, 7.7, 0.3, [2.0, 4.9, 0, 1, 0, 153, 16, 0.4, 13, 0.1, 1, 59, 0, 0]),
  r('avocado',      'Avocado',                 'أفوكادو',             'fruit', 160, 2.0, 9.0, 15, [6.7, 0.7, 2.1, 7, 0, 485, 12, 0.6, 29, 0.6, 7, 10, 0, 0]),

  // ---- nuts, seeds & fats ----
  r('almonds',      'Almonds',                 'لوز',                 'nuts', 579, 21, 22, 50, [12.5, 4.4, 3.8, 1, 0, 733, 269, 3.7, 270, 3.1, 0, 0, 0, 0]),
  r('cashews',      'Cashews',                 'كاجو',                'nuts', 553, 18, 30, 44, [3.3, 5.9, 7.8, 12, 0, 660, 37, 6.7, 292, 5.8, 0, 0.5, 0, 0]),
  r('peanuts',      'Peanuts',                 'فول سوداني',          'nuts', 567, 26, 16, 49, [8.5, 4.7, 6.3, 18, 0, 705, 92, 4.6, 168, 3.3, 0, 0, 0, 0]),
  r('pb',           'Peanut butter',           'زبدة فول سوداني',     'nuts', 588, 25, 20, 50, [6.0, 9.0, 10, 426, 0, 649, 49, 1.9, 168, 2.5, 0, 0, 0, 0]),
  r('walnuts',      'Walnuts',                 'جوز',                 'nuts', 654, 15, 14, 65, [6.7, 2.6, 6.1, 2, 0, 441, 98, 2.9, 158, 3.1, 1, 1.3, 0, 0]),
  r('pistachios',   'Pistachios',              'فستق حلبي',           'nuts', 560, 20, 28, 45, [10.6, 7.7, 5.9, 1, 0, 1025, 105, 3.9, 121, 2.2, 26, 5.6, 0, 0]),
  r('chia',         'Chia seeds',              'بذور الشيا',          'nuts', 486, 17, 42, 31, [34, 0, 3.3, 16, 0, 407, 631, 7.7, 335, 4.6, 3, 1.6, 0, 0]),
  r('tahini',       'Tahini',                  'طحينة',               'nuts', 595, 17, 21, 54, [9.3, 0.5, 7.5, 115, 0, 414, 130, 4.4, 95, 4.6, 3, 0, 0, 0]),
  r('olive_oil',    'Olive oil',               'زيت زيتون',           'nuts', 884, 0, 0, 100, [0, 0, 14, 2, 0, 1, 1, 0.6, 0, 0, 0, 0, 0, 0]),
  r('butter',       'Butter (salted)',         'زبدة',                'nuts', 717, 0.9, 0.1, 81, [0, 0.1, 51, 576, 215, 24, 24, 0, 2, 0.1, 684, 0, 1.5, 0.2]),
  r('ghee',         'Ghee',                    'سمن',                 'nuts', 900, 0, 0, 100, [0, 0, 62, 0, 256, 0, 0, 0, 0, 0, 600, 0, 0, 0]),
  r('olives',       'Olives (green, pickled)', 'زيتون أخضر',          'nuts', 145, 1.0, 3.8, 15, [3.3, 0.5, 2.0, 1560, 0, 42, 52, 0.5, 11, 0, 20, 0, 0, 0]),

  // ---- Gulf & Levant dishes (per 100 g of the prepared dish — micro values are estimates) ----
  r('kabsa_ck',     'Kabsa with chicken',      'كبسة دجاج',           'dishes', 180, 9, 22, 6, [0.8, 1.0, 1.5, 350, 25, 200, 20, 1.0, 20, 1.0, 30, 3, 0, 0.2]),
  r('kabsa_lamb',   'Kabsa with lamb',         'كبسة لحم',            'dishes', 195, 9, 21, 8, [0.8, 1.0, 3.0, 360, 30, 210, 20, 1.2, 20, 1.6, 25, 3, 0, 0.5]),
  r('mandi_ck',     'Mandi with chicken',      'مندي دجاج',           'dishes', 175, 10, 21, 6, [0.7, 0.8, 1.8, 330, 30, 190, 18, 0.9, 18, 1.0, 25, 2, 0, 0.2]),
  r('saleeg',       'Saleeg',                  'سليق',                'dishes', 130, 6, 16, 4.5, [0.3, 2.0, 1.5, 300, 20, 120, 60, 0.4, 12, 0.6, 25, 0, 0.2, 0.2]),
  r('harees',       'Harees',                  'هريس',                'dishes', 120, 7, 15, 3.5, [2.5, 0.5, 1.2, 350, 20, 150, 20, 1.5, 25, 1.5, 5, 0, 0, 0.4]),
  r('jareesh',      'Jareesh',                 'جريش',                'dishes', 95, 3.5, 15, 2.5, [2.8, 1.5, 1.0, 300, 10, 140, 60, 1.0, 25, 0.8, 15, 0, 0.1, 0.1]),
  r('margoog',      'Margoog',                 'مرقوق',               'dishes', 95, 5, 13, 2.5, [1.8, 1.5, 0.8, 320, 15, 220, 25, 1.0, 18, 0.8, 120, 6, 0, 0.2]),
  r('shawarma_ck',  'Chicken shawarma (meat only)', 'شاورما دجاج (لحم فقط)', 'dishes', 190, 20, 4, 10.5, [0.2, 1.0, 2.5, 500, 60, 250, 15, 1.0, 22, 1.5, 15, 2, 0.1, 0.3]),
  r('shawarma_sw',  'Chicken shawarma sandwich', 'ساندويتش شاورما دجاج', 'dishes', 215, 11, 24, 8.5, [1.5, 2.0, 2.5, 550, 35, 220, 40, 1.3, 20, 1.0, 15, 3, 0, 0.2]),
  r('kofta',        'Grilled kofta / kebab',   'كفتة مشوية',          'dishes', 230, 18, 4, 16, [0.5, 1.0, 6.5, 350, 70, 300, 25, 2.2, 20, 4.5, 10, 3, 0.1, 2.0]),
  r('shakshuka',    'Shakshuka',               'شكشوكة',              'dishes', 118, 6.5, 5, 8, [1.2, 3.0, 2.0, 350, 180, 300, 45, 1.5, 15, 0.8, 100, 12, 0.9, 0.4]),
  r('mutabbaq',     'Mutabbaq (meat)',         'مطبق لحم',            'dishes', 230, 9, 26, 10, [1.5, 2.0, 3.0, 450, 60, 180, 30, 2.0, 18, 1.5, 40, 2, 0.3, 0.5]),
  r('samboosa',     'Samboosa (fried, meat)',  'سمبوسة لحم مقلية',    'dishes', 290, 9, 28, 16, [2.0, 1.5, 3.0, 400, 25, 200, 25, 1.5, 18, 1.2, 20, 2, 0, 0.3]),
  r('baba_gh',      'Baba ghanoush',           'متبل باذنجان',        'dishes', 105, 1.8, 8.5, 7.5, [3.0, 3.0, 1.1, 300, 0, 250, 25, 0.6, 20, 0.5, 5, 4, 0, 0]),
  r('tabbouleh',    'Tabbouleh',               'تبولة',               'dishes', 90, 2.5, 10, 4.5, [2.5, 1.5, 0.6, 250, 0, 250, 40, 1.5, 20, 0.4, 100, 20, 0, 0]),
  r('fattoush',     'Fattoush',                'فتوش',                'dishes', 80, 1.8, 9, 4, [1.8, 2.5, 0.6, 220, 0, 200, 30, 0.8, 14, 0.3, 60, 15, 0, 0]),
  r('waraq_enab',   'Stuffed vine leaves',     'ورق عنب',             'dishes', 160, 3.5, 20, 7.5, [2.0, 2.0, 1.0, 400, 0, 200, 45, 1.2, 20, 0.5, 60, 6, 0, 0]),

  // ---- sweets & snacks ----
  r('kunafa',       'Kunafa',                  'كنافة',               'sweets', 350, 6, 45, 17, [1.0, 30, 8.0, 200, 40, 120, 100, 0.8, 15, 0.6, 120, 0, 0.2, 0.2]),
  r('basbousa',     'Basbousa',                'بسبوسة',              'sweets', 367, 4.5, 55, 15, [1.2, 38, 6.0, 150, 25, 90, 60, 0.8, 12, 0.4, 60, 0, 0.1, 0.1]),
  r('luqaimat',     'Luqaimat',                'لقيمات',              'sweets', 330, 4, 45, 15, [1.0, 25, 2.5, 200, 10, 80, 30, 1.0, 10, 0.3, 10, 0, 0, 0]),
  r('maamoul',      'Maamoul',                 'معمول',               'sweets', 430, 6, 60, 18, [2.5, 30, 8.0, 180, 30, 250, 40, 1.5, 25, 0.6, 80, 0, 0.1, 0.1]),
  r('baklava',      'Baklava',                 'بقلاوة',              'sweets', 428, 6, 50, 24, [2.0, 30, 9.0, 230, 25, 180, 40, 1.6, 30, 0.7, 90, 0, 0.1, 0.1]),
  r('choc_milk',    'Milk chocolate',          'شوكولاتة بالحليب',    'sweets', 535, 7.7, 59, 30, [3.4, 52, 18, 79, 23, 372, 189, 2.4, 63, 2.3, 60, 0, 0, 0.4]),
  r('choc_dark',    'Dark chocolate 70%',      'شوكولاتة داكنة ٧٠٪',  'sweets', 598, 7.8, 46, 43, [11, 24, 24, 20, 3, 715, 73, 12, 228, 3.3, 2, 0, 0, 0.3]),
  r('chips',        'Potato chips',            'شيبس بطاطس',          'sweets', 536, 7, 53, 34, [4.4, 0.3, 4.0, 525, 0, 1196, 24, 1.6, 67, 1.1, 0, 19, 0, 0]),
  r('ice_cream',    'Ice cream (vanilla)',     'آيس كريم فانيلا',     'sweets', 207, 3.5, 24, 11, [0.7, 21, 6.8, 80, 44, 199, 128, 0.1, 14, 0.7, 118, 0.6, 0.2, 0.4]),
  r('honey',        'Honey',                   'عسل',                 'sweets', 304, 0.3, 82, 0, [0.2, 82, 0, 4, 0, 52, 6, 0.4, 2, 0.2, 0, 0.5, 0, 0]),
  r('sugar',        'Sugar (white)',           'سكر أبيض',            'sweets', 387, 0, 100, 0, [0, 100, 0, 1, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0]),

  // ---- drinks (per 100 ml) ----
  r('coffee_ar',    'Arabic coffee (unsweetened)', 'قهوة عربية',      'drinks', 2, 0.1, 0.4, 0, [0, 0, 0, 2, 0, 50, 2, 0, 3, 0, 0, 0, 0, 0]),
  r('karak',        'Karak tea',               'شاي كرك',             'drinks', 60, 1.8, 9, 2, [0, 8, 1.2, 20, 6, 70, 45, 0.1, 5, 0.2, 20, 0, 0.2, 0.2]),
  r('oj',           'Orange juice',            'عصير برتقال',         'drinks', 45, 0.7, 10.4, 0.2, [0.2, 8.4, 0, 1, 0, 200, 11, 0.2, 11, 0, 10, 50, 0, 0]),
  r('cola',         'Soft drink (cola)',       'مشروب غازي',          'drinks', 42, 0, 10.6, 0, [0, 10.6, 0, 4, 0, 2, 2, 0.1, 0, 0, 0, 0, 0, 0]),
];

// ---------------- search ----------------
// Normalise Arabic (strip diacritics/tatweel, unify alef/hamza forms, ta marbuta, alef maqsura)
// and lowercase Latin so search works loosely in both languages.
export function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .trim();
}

// Ranked search: exact name > exact word > word-start > mid-word substring.
// This is what keeps بيض (egg) above سمك أبيض (white fish, which contains بيض mid-word).
export function searchIngredients(query, category, extra) {
  const pool = extra && extra.length ? [...INGREDIENTS, ...extra] : INGREDIENTS;
  const cat = category && category !== 'all' ? category : null;
  const q = normalize(query);
  const filtered = cat ? pool.filter(i => i.cat === cat) : pool;
  if (!q) return filtered.slice(0, 60);

  const scored = [];
  for (const ing of filtered) {
    const names = [normalize(ing.en), normalize(ing.ar)];
    let best = 0;
    for (const name of names) {
      if (!name) continue;
      if (name === q) { best = Math.max(best, 100); continue; }
      const tokens = name.split(/[\s(),/\-]+/).filter(Boolean);
      if (tokens.some(tk => tk === q)) { best = Math.max(best, 90); continue; }
      if (tokens.some(tk => tk.startsWith(q))) { best = Math.max(best, 75); continue; }
      if (tokens.some(tk => tk.includes(q))) { best = Math.max(best, 40); continue; }
      if (name.includes(q)) best = Math.max(best, 35);
    }
    if (best > 0) scored.push([best, ing]);
  }
  scored.sort((a, b) => b[0] - a[0] || (a[1].ar.length - b[1].ar.length));
  return scored.map(x => x[1]).slice(0, 60);
}

export function getIngredient(id, extra) {
  return INGREDIENTS.find(i => i.id === id) || (extra || []).find(i => i.id === id) || null;
}
