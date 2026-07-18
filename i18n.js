// i18n.js — Arabic (RTL) + English strings, plus correct Arabic pluralisation.
// Arabic plural categories differ by count (1 singular, 2 dual, 3–10 plural, 11+ singular form);
// Intl.PluralRules('ar') gives us zero/one/two/few/many/other and we map word forms onto that.

let lang = 'ar';

const STR = {
  // app chrome
  appName:        { ar: 'سعرة', en: 'Se3ra' },
  tabToday:       { ar: 'اليوم', en: 'Today' },
  tabAdd:         { ar: 'إضافة', en: 'Add' },
  tabWeight:      { ar: 'الوزن', en: 'Weight' },
  tabSettings:    { ar: 'الإعدادات', en: 'Settings' },

  // today
  remaining:      { ar: 'متبقي', en: 'remaining' },
  over:           { ar: 'زيادة', en: 'over' },
  ofGoal:         { ar: 'من', en: 'of' },
  kcal:           { ar: 'سعرة', en: 'kcal' },
  macros:         { ar: 'العناصر الكبرى', en: 'Macros' },
  micros:         { ar: 'العناصر الدقيقة', en: 'Micronutrients' },
  todaysMeals:    { ar: 'وجبات اليوم', en: 'Meals' },
  noMeals:        { ar: 'لا توجد وجبات بعد — أضف أول وجبة من تبويب «إضافة»', en: 'Nothing logged yet — add your first meal from the Add tab' },
  deleteMeal:     { ar: 'حذف الوجبة؟', en: 'Delete this meal?' },
  addFavorite:    { ar: 'حُفظت في المفضلة', en: 'Saved to favorites' },
  today:          { ar: 'اليوم', en: 'Today' },
  yesterday:      { ar: 'أمس', en: 'Yesterday' },

  // add hub
  addTitle:       { ar: 'إضافة طعام', en: 'Add food' },
  favorites:      { ar: 'المفضلة', en: 'Favorites' },
  methodPhoto:    { ar: 'تحليل صورة بالذكاء الاصطناعي', en: 'AI photo scan' },
  methodPhotoSub: { ar: 'صوّر وجبتك وسيقدّر الذكاء الاصطناعي محتواها', en: 'Photograph a meal, AI estimates its nutrition' },
  methodDB:       { ar: 'من قاعدة المكونات', en: 'From ingredients' },
  methodDBSub:    { ar: 'ابحث، اختر الوزن بالجرام، وركّب وجبتك', en: 'Search, enter grams, build your meal' },
  methodCustom:   { ar: 'مكوّن خاص', en: 'Custom ingredient' },
  methodCustomSub:{ ar: 'أدخل القيم يدويًا أو صوّر ملصق القيم الغذائية', en: 'Type values or photograph a nutrition label' },
  methodManual:   { ar: 'إدخال يدوي', en: 'Manual entry' },
  methodManualSub:{ ar: 'اسم + سعرات + عناصر كبرى، بسرعة', en: 'Name + calories + macros, quick' },

  // photo scan
  photoTitle:     { ar: 'تحليل صورة', en: 'Photo scan' },
  takePhoto:      { ar: 'التقاط / اختيار صورة', en: 'Take / choose photo' },
  analyzing:      { ar: 'جارٍ التحليل…', en: 'Analyzing…' },
  confidence:     { ar: 'الثقة', en: 'Confidence' },
  confHigh:       { ar: 'عالية', en: 'High' },
  confMedium:     { ar: 'متوسطة', en: 'Medium' },
  confLow:        { ar: 'منخفضة', en: 'Low' },
  aiEditHint:     { ar: 'عدّل أي قيمة قبل الإضافة — تعديل السعرات يعيد حساب بقية العناصر تناسبيًا', en: 'Edit anything before adding — changing calories rescales the rest proportionally' },
  include:        { ar: 'إدراج', en: 'Include' },
  addToDay:       { ar: 'أضف إلى اليوم', en: 'Add to today' },
  noKey:          { ar: 'أضف مفتاح API لمزوّد الذكاء الاصطناعي من الإعدادات أولًا', en: 'Add your AI provider API key in Settings first' },
  aiFailed:       { ar: 'فشل التحليل', en: 'Analysis failed' },
  grams:          { ar: 'جرام', en: 'g' },

  // ingredient builder
  dbTitle:        { ar: 'قاعدة المكونات', en: 'Ingredient database' },
  searchPh:       { ar: 'ابحث بالعربية أو الإنجليزية…', en: 'Search in Arabic or English…' },
  all:            { ar: 'الكل', en: 'All' },
  weightG:        { ar: 'الوزن (جرام)', en: 'Weight (g)' },
  count:          { ar: 'العدد', en: 'Count' },
  servings:       { ar: 'الحصص', en: 'Servings' },
  per100:         { ar: 'لكل ١٠٠ جرام', en: 'per 100 g' },
  perPiece:       { ar: 'للحبة', en: 'per piece' },
  perServing:     { ar: 'للحصة', en: 'per serving' },
  addToMeal:      { ar: 'أضف إلى الوجبة', en: 'Add to meal' },
  mealItems:      { ar: 'مكونات الوجبة', en: 'Meal items' },
  mealName:       { ar: 'اسم الوجبة', en: 'Meal name' },
  saveMeal:       { ar: 'حفظ الوجبة', en: 'Save meal' },
  noResults:      { ar: 'لا نتائج', en: 'No results' },
  custom:         { ar: 'خاص', en: 'custom' },

  // custom ingredient
  customTitle:    { ar: 'مكوّن خاص', en: 'Custom ingredient' },
  scanLabel:      { ar: 'تصوير ملصق القيم الغذائية', en: 'Scan a nutrition label' },
  scanLabelSub:   { ar: 'يُقرأ الملصق كما هو — ما لم يُطبع عليه يُسجَّل صفرًا', en: 'Read as printed — anything not on the label comes back as 0' },
  orManual:       { ar: 'أو أدخل القيم يدويًا', en: 'or type the values' },
  nameAr:         { ar: 'الاسم (عربي)', en: 'Name (Arabic)' },
  nameEn:         { ar: 'الاسم (إنجليزي)', en: 'Name (English)' },
  category:       { ar: 'التصنيف', en: 'Category' },
  basis:          { ar: 'أساس القيم', en: 'Values basis' },
  basis100:       { ar: 'لكل ١٠٠ جرام', en: 'Per 100 g' },
  basisServing:   { ar: 'لكل حصة', en: 'Per serving' },
  servingName:    { ar: 'اسم الحصة (مثال: ٣ قطع)', en: 'Serving name (e.g. 3 pretzels)' },
  servingGrams:   { ar: 'وزن الحصة (جرام)', en: 'Serving weight (g)' },
  saveIngredient: { ar: 'حفظ المكوّن', en: 'Save ingredient' },
  savedIngredient:{ ar: 'حُفظ — سيظهر في البحث', en: 'Saved — it will appear in search' },
  readingLabel:   { ar: 'جارٍ قراءة الملصق…', en: 'Reading label…' },
  labelDone:      { ar: 'تمت القراءة — راجع القيم ثم احفظ', en: 'Label read — review the values, then save' },

  // manual
  manualTitle:    { ar: 'إدخال يدوي', en: 'Manual entry' },
  foodName:       { ar: 'اسم الطعام', en: 'Food name' },
  microsOptional: { ar: 'العناصر الدقيقة (اختياري)', en: 'Micronutrients (optional)' },
  saveAsFav:      { ar: 'حفظ كمفضلة', en: 'Save as favorite' },
  add:            { ar: 'إضافة', en: 'Add' },
  added:          { ar: 'أُضيفت ✓', en: 'Added ✓' },

  // weight
  weightTitle:    { ar: 'الوزن', en: 'Weight' },
  logWeight:      { ar: 'تسجيل الوزن', en: 'Log weight' },
  current:        { ar: 'الحالي', en: 'Current' },
  change30:       { ar: 'تغيّر ٣٠ يومًا', en: '30-day change' },
  starting:       { ar: 'البداية', en: 'Starting' },
  kg:             { ar: 'كجم', en: 'kg' },
  history:        { ar: 'السجل', en: 'History' },
  deleteEntry:    { ar: 'حذف هذا القيد؟', en: 'Delete this entry?' },
  noWeights:      { ar: 'سجّل وزنك الأول لبدء الرسم البياني', en: 'Log your first weight to start the chart' },

  // settings
  stGoals:        { ar: 'الأهداف اليومية', en: 'Daily goals' },
  stAuto:         { ar: 'حساب تلقائي', en: 'Auto-calculate' },
  stAutoSub:      { ar: 'معادلة Mifflin-St Jeor — تضبط السعرات والعناصر الكبرى والدقيقة معًا', en: 'Mifflin-St Jeor — sets calories, macros and micro targets together' },
  age:            { ar: 'العمر', en: 'Age' },
  sex:            { ar: 'الجنس', en: 'Sex' },
  male:           { ar: 'ذكر', en: 'Male' },
  female:         { ar: 'أنثى', en: 'Female' },
  height:         { ar: 'الطول (سم)', en: 'Height (cm)' },
  weightKg:       { ar: 'الوزن (كجم)', en: 'Weight (kg)' },
  activity:       { ar: 'النشاط', en: 'Activity' },
  actSedentary:   { ar: 'خامل', en: 'Sedentary' },
  actLight:       { ar: 'خفيف', en: 'Light' },
  actModerate:    { ar: 'متوسط', en: 'Moderate' },
  actActive:      { ar: 'نشيط', en: 'Active' },
  actVery:        { ar: 'نشيط جدًا', en: 'Very active' },
  goal:           { ar: 'الهدف', en: 'Goal' },
  goalLose:       { ar: 'خسارة وزن', en: 'Lose weight' },
  goalMaintain:   { ar: 'محافظة', en: 'Maintain' },
  goalGain:       { ar: 'زيادة وزن', en: 'Gain weight' },
  applyTargets:   { ar: 'تطبيق الأهداف', en: 'Apply targets' },
  targetsApplied: { ar: 'طُبّقت الأهداف الجديدة', en: 'New targets applied' },
  stMicros:       { ar: 'العناصر الدقيقة', en: 'Micronutrients' },
  stMicrosSub:    { ar: 'فعّل ما تريد تتبعه وعدّل الهدف اليومي', en: 'Toggle what to track and edit each daily target' },
  goalType:       { ar: 'هدف', en: 'goal' },
  limitType:      { ar: 'حد أقصى', en: 'limit' },
  stAI:           { ar: 'الذكاء الاصطناعي', en: 'AI provider' },
  provider:       { ar: 'المزوّد', en: 'Provider' },
  apiKey:         { ar: 'مفتاح API', en: 'API key' },
  model:          { ar: 'النموذج', en: 'Model' },
  keyHint:        { ar: 'يُحفظ المفتاح على جهازك فقط ولا يُرفع للمزامنة', en: 'Stored on this device only — never uploaded to sync' },
  stCloud:        { ar: 'المزامنة السحابية', en: 'Cloud sync' },
  cloudOff:       { ar: 'غير مفعّلة — أضف إعدادات Firebase في ملف firebase-config.js لتفعيلها', en: 'Not configured — add your Firebase config to firebase-config.js to enable it' },
  email:          { ar: 'البريد الإلكتروني', en: 'Email' },
  password:       { ar: 'كلمة المرور', en: 'Password' },
  signIn:         { ar: 'تسجيل الدخول', en: 'Sign in' },
  signUp:         { ar: 'إنشاء حساب', en: 'Create account' },
  signOut:        { ar: 'تسجيل الخروج', en: 'Sign out' },
  signedInAs:     { ar: 'مسجّل الدخول:', en: 'Signed in as' },
  synced:         { ar: 'مُزامَن ✓', en: 'Synced ✓' },
  syncing:        { ar: 'جارٍ المزامنة…', en: 'Syncing…' },
  mergeDone:      { ar: 'دُمجت بيانات الجهاز مع السحابة', en: 'Device data merged with cloud' },
  stData:         { ar: 'البيانات', en: 'Data' },
  exportJson:     { ar: 'تصدير نسخة احتياطية (JSON)', en: 'Export backup (JSON)' },
  importJson:     { ar: 'استيراد نسخة احتياطية', en: 'Import backup' },
  importConfirm:  { ar: 'سيستبدل الاستيراد كل البيانات الحالية على هذا الجهاز. متابعة؟', en: 'Importing replaces all current data on this device. Continue?' },
  imported:       { ar: 'تم الاستيراد', en: 'Imported' },
  badFile:        { ar: 'ملف غير صالح', en: 'Invalid file' },
  stLang:         { ar: 'اللغة', en: 'Language' },
  cancel:         { ar: 'إلغاء', en: 'Cancel' },
  save:           { ar: 'حفظ', en: 'Save' },
  delete:         { ar: 'حذف', en: 'Delete' },
  error:          { ar: 'خطأ', en: 'Error' },

  // nutrient names
  n_calories:     { ar: 'السعرات', en: 'Calories' },
  n_protein:      { ar: 'بروتين', en: 'Protein' },
  n_carbs:        { ar: 'كربوهيدرات', en: 'Carbs' },
  n_fat:          { ar: 'دهون', en: 'Fat' },
  n_fiber:        { ar: 'ألياف', en: 'Fiber' },
  n_sugar:        { ar: 'سكر', en: 'Sugar' },
  n_satfat:       { ar: 'دهون مشبعة', en: 'Saturated fat' },
  n_sodium:       { ar: 'صوديوم', en: 'Sodium' },
  n_chol:         { ar: 'كوليسترول', en: 'Cholesterol' },
  n_potassium:    { ar: 'بوتاسيوم', en: 'Potassium' },
  n_calcium:      { ar: 'كالسيوم', en: 'Calcium' },
  n_iron:         { ar: 'حديد', en: 'Iron' },
  n_magnesium:    { ar: 'مغنيسيوم', en: 'Magnesium' },
  n_zinc:         { ar: 'زنك', en: 'Zinc' },
  n_vitA:         { ar: 'فيتامين أ', en: 'Vitamin A' },
  n_vitC:         { ar: 'فيتامين ج', en: 'Vitamin C' },
  n_vitD:         { ar: 'فيتامين د', en: 'Vitamin D' },
  n_vitB12:       { ar: 'فيتامين ب١٢', en: 'Vitamin B12' },

  // ingredient categories
  c_grains:       { ar: 'حبوب وأرز', en: 'Grains & rice' },
  c_bread:        { ar: 'خبز', en: 'Bread' },
  c_protein:      { ar: 'لحوم وأسماك', en: 'Meat & fish' },
  c_dairy:        { ar: 'بيض وألبان', en: 'Eggs & dairy' },
  c_legumes:      { ar: 'بقوليات', en: 'Legumes' },
  c_veg:          { ar: 'خضار', en: 'Vegetables' },
  c_fruit:        { ar: 'فواكه', en: 'Fruits' },
  c_nuts:         { ar: 'مكسرات ودهون', en: 'Nuts & fats' },
  c_dishes:       { ar: 'أطباق', en: 'Dishes' },
  c_sweets:       { ar: 'حلويات ووجبات خفيفة', en: 'Sweets & snacks' },
  c_drinks:       { ar: 'مشروبات', en: 'Drinks' },
};

// item words with full Arabic plural forms
const PLURAL_WORDS = {
  meal: {
    ar: { zero: 'وجبات', one: 'وجبة', two: 'وجبتان', few: 'وجبات', many: 'وجبة', other: 'وجبة' },
    en: { one: 'meal', other: 'meals' },
  },
  item: {
    ar: { zero: 'عناصر', one: 'عنصر', two: 'عنصران', few: 'عناصر', many: 'عنصرًا', other: 'عنصر' },
    en: { one: 'item', other: 'items' },
  },
  piece: {
    ar: { zero: 'حبات', one: 'حبة', two: 'حبتان', few: 'حبات', many: 'حبة', other: 'حبة' },
    en: { one: 'piece', other: 'pieces' },
  },
  serving: {
    ar: { zero: 'حصص', one: 'حصة', two: 'حصتان', few: 'حصص', many: 'حصة', other: 'حصة' },
    en: { one: 'serving', other: 'servings' },
  },
  day: {
    ar: { zero: 'أيام', one: 'يوم', two: 'يومان', few: 'أيام', many: 'يومًا', other: 'يوم' },
    en: { one: 'day', other: 'days' },
  },
};

const rules = { ar: new Intl.PluralRules('ar'), en: new Intl.PluralRules('en') };

export function setLang(l) { lang = l === 'en' ? 'en' : 'ar'; }
export function getLang() { return lang; }

export function t(key) {
  const e = STR[key];
  if (!e) return key;
  return e[lang] ?? e.ar ?? key;
}

// plural('meal', 3) -> '3 وجبات' / '3 meals'
export function plural(word, n) {
  const w = PLURAL_WORDS[word];
  if (!w) return `${n} ${word}`;
  const forms = w[lang];
  const cat = rules[lang].select(n);
  const form = forms[cat] ?? forms.other ?? forms.one;
  return `${fmtNum(n)} ${form}`;
}

export function fmtNum(n) {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', { maximumFractionDigits: 1 }).format(n);
}

export const STR_KEYS = Object.keys(STR);
