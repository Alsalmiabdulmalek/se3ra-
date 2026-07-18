// app.js — state, rendering and interaction for Se3ra.
import { MACROS, MICROS, MICRO_IDS, emptyMicros, validateNutrition, scaleNutrition,
         addNutrition, zeroNutrition, autoTargets, fmtVal } from './nutrients.js';
import { setLang, getLang, t, plural, fmtNum } from './i18n.js';
import { INGREDIENTS, CATEGORIES, searchIngredients, getIngredient, normalize } from './ingredients.js';
import { analyzePhoto, readLabel, PROVIDERS, DEFAULT_MODELS } from './ai.js';
import { initCloud, cloudConfigured, syncUp, signIn, signUp, signOutCloud, currentUser } from './cloud.js';

// ---------------- state ----------------
const KEY = 'se3ra_state';
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2));
const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const emoji = { grains:'🍚', bread:'🍞', protein:'🍗', dairy:'🥚', legumes:'🫘', veg:'🥗', fruit:'🍎', nuts:'🥜', dishes:'🍲', sweets:'🍰', drinks:'🥤', meal:'🍽️' };

function defaultState() {
  const micros = {}; const microVisible = {};
  for (const m of MICROS) { micros[m.id] = m.def; microVisible[m.id] = m.core; }
  return {
    version: 1,
    settings: {
      lang: 'ar',
      goals: { calories: 2000, protein: 120, carbs: 220, fat: 67 },
      microGoals: micros,
      microVisible,
      profile: { age: 30, sex: 'male', heightCm: 175, weightKg: 75, activity: 'moderate', goal: 'maintain' },
      ai: { provider: 'claude', keys: {}, models: { ...DEFAULT_MODELS } },
      _updated: Date.now(),
    },
    days: {},
    weights: [],
    favorites: [],
    customIngredients: [],
  };
}

function migrate(s) {
  if (!s || typeof s !== 'object') return defaultState();
  const def = defaultState();
  s.version = 1;
  s.settings = Object.assign({}, def.settings, s.settings);
  s.settings.goals = Object.assign({}, def.settings.goals, s.settings.goals);
  s.settings.microGoals = Object.assign({}, def.settings.microGoals, s.settings.microGoals);
  s.settings.microVisible = Object.assign({}, def.settings.microVisible, s.settings.microVisible);
  s.settings.profile = Object.assign({}, def.settings.profile, s.settings.profile);
  s.settings.ai = Object.assign({}, def.settings.ai, s.settings.ai);
  s.settings.ai.keys = s.settings.ai.keys || {};
  s.settings.ai.models = Object.assign({}, def.settings.ai.models, s.settings.ai.models);
  s.days = s.days || {};
  s.weights = s.weights || [];
  s.favorites = s.favorites || [];
  s.customIngredients = s.customIngredients || [];
  return s;
}

let state = load();
function load() {
  try { const raw = localStorage.getItem(KEY); return raw ? migrate(JSON.parse(raw)) : defaultState(); }
  catch { return defaultState(); }
}
function persist({ sync = true } = {}) {
  state.settings._updated = Date.now();
  localStorage.setItem(KEY, JSON.stringify(state));
  if (sync) syncUp(state);
}

// view state (not persisted)
let view = 'today';
let viewDate = todayKey();
let addScreen = 'hub';           // hub | photo | db | custom | manual
let builder = [];                // ingredient-builder running list
let aiResult = null;             // last AI photo result
let customDraft = null;          // custom-ingredient label-scan draft

setLang(state.settings.lang);
document.documentElement.lang = getLang();
document.documentElement.dir = getLang() === 'ar' ? 'rtl' : 'ltr';

// ---------------- helpers ----------------
const el = (sel, root = document) => root.querySelector(sel);
const app = () => el('#app');
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
function nm(item) { return getLang() === 'ar' ? item.ar : item.en; }
function nutName(id) { return t('n_' + id); }
function dayMeals(k = viewDate) { return state.days[k]?.meals || []; }

function dayTotals(k = viewDate) {
  let tot = zeroNutrition();
  for (const meal of dayMeals(k)) tot = addNutrition(tot, { calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, micros: meal.micros || {} });
  return tot;
}

let toastTimer = null;
function toast(msg) {
  const box = el('#toast');
  box.innerHTML = `<div class="t">${esc(msg)}</div>`;
  const t0 = el('.t', box);
  requestAnimationFrame(() => t0.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t0.classList.remove('show'), 1900);
}

// modal
function openModal(html) {
  closeModal();
  const bg = document.createElement('div');
  bg.className = 'modal-bg'; bg.id = 'modal-bg';
  bg.innerHTML = `<div class="modal"><div class="handle"></div>${html}</div>`;
  bg.addEventListener('click', e => { if (e.target === bg) closeModal(); });
  document.body.appendChild(bg);
}
function closeModal() { const m = el('#modal-bg'); if (m) m.remove(); }

// image downscale → base64 (bare, no data prefix)
function fileToScaledB64(file, max = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const rd = new FileReader();
    rd.onload = () => { img.src = rd.result; };
    rd.onerror = reject;
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, max / Math.max(width, height));
      width = Math.round(width * scale); height = Math.round(height * scale);
      const c = document.createElement('canvas'); c.width = width; c.height = height;
      c.getContext('2d').drawImage(img, 0, 0, width, height);
      const dataUrl = c.toDataURL('image/jpeg', 0.85);
      resolve({ b64: dataUrl.split(',')[1], mime: 'image/jpeg' });
    };
    img.onerror = reject;
    rd.readAsDataURL(file);
  });
}

// ---------------- render root ----------------
function render() {
  const root = app();
  root.innerHTML =
    renderAppbar() +
    (view === 'today'    ? renderToday()
     : view === 'add'    ? renderAdd()
     : view === 'weight' ? renderWeight()
     : renderSettings()) +
    renderTabbar();
  // focus preservation for search box
  if (view === 'add' && addScreen === 'db') { const s = el('#dbsearch'); if (s && dbSearchFocus) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } }
}

function renderAppbar() {
  const other = getLang() === 'ar' ? 'EN' : 'ع';
  return `<div class="appbar">
    <div class="brand">${t('appName')}<span class="en">${getLang()==='ar'?'Se3ra':''}</span></div>
    <button class="lang-btn" data-act="toggleLang">${other}</button>
  </div>`;
}

function renderTabbar() {
  const tabs = [['today','tabToday','📊'],['add','tabAdd','➕'],['weight','tabWeight','⚖️'],['settings','tabSettings','⚙️']];
  return `<nav class="tabbar">${tabs.map(([id,key,ic]) =>
    `<button class="tab ${view===id?'on':''}" data-act="tab" data-tab="${id}"><span class="i">${ic}</span>${t(key)}</button>`
  ).join('')}</nav>`;
}

// ---------------- TODAY ----------------
function renderToday() {
  const goals = state.settings.goals;
  const tot = dayTotals();
  const eaten = Math.round(tot.calories);
  const goal = goals.calories || 1;
  const remaining = goal - eaten;
  const pct = Math.max(0, Math.min(1, eaten / goal));
  const R = 86, C = 2 * Math.PI * R;
  const dash = C * pct;
  const over = remaining < 0;
  const ringColor = over ? 'var(--red)' : 'var(--green)';

  const macroBars = MACROS.filter(m => m.id !== 'calories').map(m => {
    const val = tot[m.id]; const g = goals[m.id] || 1;
    const p = Math.max(0, Math.min(100, (val/g)*100));
    return `<div class="macro"><div class="top"><span class="name">${nutName(m.id)}</span>
      <span class="val">${fmtNum(Math.round(val))} / ${fmtNum(g)} ${m.unit}</span></div>
      <div class="track"><div class="fill ${m.id}" style="width:${p}%"></div></div></div>`;
  }).join('');

  const micros = MICROS.filter(m => state.settings.microVisible[m.id]).map(m => {
    const val = tot.micros[m.id] || 0; const g = state.settings.microGoals[m.id] || 1;
    const p = Math.max(0, Math.min(100, (val/g)*100));
    const exceeded = m.type === 'limit' && val > g;
    const tag = m.type === 'limit' ? `<span class="tag limit">${t('limitType')}</span>` : '';
    return `<div class="micro"><div class="top"><span class="name">${nutName(m.id)}${tag}</span>
      <span class="val">${fmtVal(val,m.dp)} / ${fmtNum(g)} ${m.unit}</span></div>
      <div class="track"><div class="fill ${m.type} ${exceeded?'exceeded':''}" style="width:${p}%"></div></div></div>`;
  }).join('');

  const meals = dayMeals();
  const mealList = meals.length ? meals.map(meal => `
    <div class="meal">
      <span class="emoji">${meal.emoji || emoji.meal}</span>
      <div class="info"><div class="nm">${esc(meal.name)}</div>
        <div class="mac">${nutName('protein')} ${fmtNum(Math.round(meal.protein))} · ${nutName('carbs')} ${fmtNum(Math.round(meal.carbs))} · ${nutName('fat')} ${fmtNum(Math.round(meal.fat))}</div></div>
      <span class="kcal">${fmtNum(Math.round(meal.calories))}</span>
      <button class="del" data-act="favMeal" data-id="${meal.id}" title="${t('saveAsFav')}">☆</button>
      <button class="del" data-act="delMeal" data-id="${meal.id}">✕</button>
    </div>`).join('') : `<div class="empty">${t('noMeals')}</div>`;

  const isToday = viewDate === todayKey();
  const label = viewDate === todayKey() ? t('today')
    : viewDate === todayKey(new Date(Date.now()-864e5)) ? t('yesterday')
    : viewDate;

  return `
  <div class="daynav">
    <button data-act="dayPrev">${getLang()==='ar'?'›':'‹'}</button>
    <span class="date">${esc(label)}</span>
    <button data-act="dayNext" ${isToday?'disabled':''}>${getLang()==='ar'?'‹':'›'}</button>
  </div>
  <div class="card">
    <div class="ring-wrap">
      <div class="ring">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="${R}" fill="none" stroke="var(--lav)" stroke-width="16"/>
          <circle cx="100" cy="100" r="${R}" fill="none" stroke="${ringColor}" stroke-width="16"
            stroke-linecap="round" stroke-dasharray="${dash} ${C}" />
        </svg>
        <div class="center">
          <div class="eaten">${fmtNum(eaten)}</div>
          <div class="goal">${t('ofGoal')} ${fmtNum(goal)} ${t('kcal')}</div>
        </div>
      </div>
      <div class="pill ${over?'over':'under'}">${over ? `${fmtNum(Math.abs(remaining))} ${t('over')}` : `${fmtNum(remaining)} ${t('remaining')}`}</div>
    </div>
  </div>
  <div class="card"><h2>${t('macros')}</h2>${macroBars}</div>
  <div class="card"><h2>${t('micros')}</h2>${micros}</div>
  <div class="card"><h2>${t('todaysMeals')}</h2>${mealList}</div>`;
}

// ---------------- ADD hub ----------------
function renderAdd() {
  if (addScreen === 'photo')  return renderPhoto();
  if (addScreen === 'db')     return renderDB();
  if (addScreen === 'custom') return renderCustom();
  if (addScreen === 'manual') return renderManual();

  const favs = state.favorites.slice(0, 12);
  const favRow = favs.length ? `<div class="card"><h2>${t('favorites')}</h2>
    <div class="fav-row">${favs.map(f => `<button class="chip" data-act="logFav" data-id="${f.id}">${esc(f.name)} <span class="k">${fmtNum(Math.round(f.calories))}</span></button>`).join('')}</div></div>` : '';

  const method = (screen, ic, tk, sk) => `<button class="method" data-act="addScreen" data-screen="${screen}">
    <span class="ic">${ic}</span><span class="tx"><span class="t">${t(tk)}</span><span class="s">${t(sk)}</span></span>
    <span class="chev">${getLang()==='ar'?'‹':'›'}</span></button>`;

  return `${favRow}
    ${method('photo','📷','methodPhoto','methodPhotoSub')}
    ${method('db','🔍','methodDB','methodDBSub')}
    ${method('custom','🏷️','methodCustom','methodCustomSub')}
    ${method('manual','✏️','methodManual','methodManualSub')}`;
}

function backBar(titleKey) {
  return `<div class="daynav" style="justify-content:flex-start;gap:10px">
    <button data-act="addScreen" data-screen="hub">${getLang()==='ar'?'›':'‹'}</button>
    <span class="date">${t(titleKey)}</span></div>`;
}

// ---------------- PHOTO scan ----------------
let dbSearchFocus = false;
function renderPhoto() {
  let body;
  if (aiResult && aiResult.items.length) {
    const c = aiResult.confidence;
    body = `<div class="card">
      <div class="section-row" style="margin-bottom:10px">
        <span class="badge ${c}">${t('confidence')}: ${t('conf'+c.charAt(0).toUpperCase()+c.slice(1))}</span>
        <button class="btn ghost sm" data-act="photoPick">${t('takePhoto')}</button>
      </div>
      <p style="font-size:.82rem;color:var(--ink-faint);margin:0 0 12px">${t('aiEditHint')}</p>
      ${aiResult.items.map((it,i) => `
        <div class="ai-item">
          <div class="hd"><span class="nm">${esc(nmAi(it))}</span>
            <button class="switch ${it._include!==false?'on':''}" data-act="aiToggle" data-i="${i}"><span class="knob"></span></button></div>
          <div class="grid3">
            <div class="field" style="margin:0"><label>${nutName('calories')}</label>
              <input class="input" dir="ltr" inputmode="numeric" data-act="aiEdit" data-i="${i}" data-f="calories" value="${Math.round(it.calories)}"></div>
            <div class="field" style="margin:0"><label>${nutName('protein')}</label>
              <input class="input" dir="ltr" inputmode="decimal" data-act="aiEdit" data-i="${i}" data-f="protein" value="${round1(it.protein)}"></div>
            <div class="field" style="margin:0"><label>${t('grams')}</label>
              <input class="input" dir="ltr" inputmode="numeric" value="${Math.round(it.grams)}" disabled></div>
          </div>
          <div class="macln" style="margin-top:8px">${nutName('carbs')} ${fmtNum(round1(it.carbs))} · ${nutName('fat')} ${fmtNum(round1(it.fat))} ${it.micros.sodium?`· ${nutName('sodium')} ${fmtNum(Math.round(it.micros.sodium))}mg`:''}</div>
        </div>`).join('')}
      <button class="btn primary" data-act="aiAddMeal">${t('addToDay')}</button>
    </div>`;
  } else {
    body = `<div class="card" style="text-align:center;padding:30px 16px">
      <div style="font-size:2.6rem;margin-bottom:12px">📷</div>
      <button class="btn primary" data-act="photoPick">${t('takePhoto')}</button>
      <p style="font-size:.82rem;color:var(--ink-faint);margin-top:12px">${t('methodPhotoSub')}</p>
    </div>`;
  }
  return backBar('photoTitle') + body +
    `<input id="photoInput" type="file" accept="image/*" capture="environment" class="hidden">`;
}
function nmAi(it) { return getLang() === 'ar' ? (it.name_ar || it.name) : (it.name || it.name_ar); }
function round1(n) { return Math.round(n * 10) / 10; }

// ---------------- DB / ingredient builder ----------------
let dbQuery = '', dbCat = 'all';
function renderDB() {
  const extra = state.customIngredients;
  const results = searchIngredients(dbQuery, dbCat, extra);
  const cats = ['all', ...CATEGORIES];
  const catRow = `<div class="fav-row" style="margin-bottom:10px">${cats.map(c =>
    `<button class="chip ${dbCat===c?'':''}" style="${dbCat===c?'background:var(--green);color:#fff':''}" data-act="dbCat" data-cat="${c}">${c==='all'?t('all'):t('c_'+c)}</button>`).join('')}</div>`;

  const list = results.length ? results.map(i => {
    const per = i.unit ? t('perPiece') : t('per100');
    const custom = i.custom ? `<span class="tag-custom">${t('custom')}</span>` : '';
    return `<button class="result" data-act="pickIng" data-id="${esc(i.id)}">
      <span class="emoji">${emoji[i.cat]||'🍽️'}</span>
      <span class="info"><span class="nm">${esc(nm(i))}${custom}</span>
        <span class="meta">${fmtNum(i.calories)} ${t('kcal')} · ${per}</span></span>
      <span class="plus">+</span></button>`;
  }).join('') : `<div class="empty">${t('noResults')}</div>`;

  let builderCard = '';
  if (builder.length) {
    let tot = zeroNutrition();
    for (const b of builder) tot = addNutrition(tot, b.nutr);
    builderCard = `<div class="card"><h2>${t('mealItems')}</h2>
      ${builder.map((b,i) => `<div class="builder-item"><span style="flex:1">${esc(b.label)} <span class="g">${b.display}</span></span>
        <span>${fmtNum(Math.round(b.nutr.calories))}</span>
        <button class="x" data-act="builderDel" data-i="${i}">✕</button></div>`).join('')}
      <div class="totals">
        <div class="b"><div class="v">${fmtNum(Math.round(tot.calories))}</div><div class="l">${t('kcal')}</div></div>
        <div class="b"><div class="v">${fmtNum(Math.round(tot.protein))}</div><div class="l">${nutName('protein')}</div></div>
        <div class="b"><div class="v">${fmtNum(Math.round(tot.carbs))}</div><div class="l">${nutName('carbs')}</div></div>
        <div class="b"><div class="v">${fmtNum(Math.round(tot.fat))}</div><div class="l">${nutName('fat')}</div></div>
      </div>
      <div class="field"><input class="input" id="builderName" placeholder="${t('mealName')}" value=""></div>
      <button class="btn primary" data-act="saveBuilder">${t('saveMeal')}</button></div>`;
  }

  return backBar('dbTitle') + builderCard +
    `<div class="card">
      <div class="field"><input class="input" id="dbsearch" data-act="dbSearch" placeholder="${t('searchPh')}" value="${esc(dbQuery)}"></div>
      ${catRow}
      ${list}
    </div>`;
}

// ---------------- CUSTOM ingredient ----------------
function renderCustom() {
  const d = customDraft || {};
  const basis = d.basis || '100';
  const microFields = MICROS.map(m => `<div class="field" style="margin-bottom:8px">
    <label>${nutName(m.id)} (${m.unit})</label>
    <input class="input" dir="ltr" inputmode="decimal" data-cf="micro:${m.id}" value="${d.micros?.[m.id] ?? ''}"></div>`).join('');

  return backBar('customTitle') + `
    <div class="card">
      <button class="method" data-act="labelPick" style="margin-bottom:6px">
        <span class="ic">🏷️</span><span class="tx"><span class="t">${t('scanLabel')}</span><span class="s">${t('scanLabelSub')}</span></span></button>
      ${d._scanned ? `<p style="font-size:.82rem;color:var(--green);margin:6px 2px">${t('labelDone')}</p>` : ''}
    </div>
    <div class="card">
      <h2>${t('orManual')}</h2>
      <div class="grid2">
        <div class="field"><label>${t('nameAr')}</label><input class="input" data-cf="ar" value="${esc(d.ar||'')}"></div>
        <div class="field"><label>${t('nameEn')}</label><input class="input" dir="ltr" data-cf="en" value="${esc(d.en||'')}"></div>
      </div>
      <div class="field"><label>${t('category')}</label>
        <select class="input" data-cf="cat">${CATEGORIES.map(c=>`<option value="${c}" ${d.cat===c?'selected':''}>${t('c_'+c)}</option>`).join('')}</select></div>
      <div class="field"><label>${t('basis')}</label>
        <div class="seg"><button class="${basis==='100'?'on':''}" data-act="cfBasis" data-b="100">${t('basis100')}</button>
          <button class="${basis==='serving'?'on':''}" data-act="cfBasis" data-b="serving">${t('basisServing')}</button></div></div>
      ${basis==='serving' ? `<div class="grid2">
        <div class="field"><label>${t('servingName')}</label><input class="input" data-cf="servingName" value="${esc(d.servingName||'')}"></div>
        <div class="field"><label>${t('servingGrams')}</label><input class="input" dir="ltr" inputmode="numeric" data-cf="servingGrams" value="${d.servingGrams||''}"></div>
      </div>` : ''}
      <div class="grid2">
        <div class="field"><label>${nutName('calories')}</label><input class="input" dir="ltr" inputmode="numeric" data-cf="calories" value="${d.calories ?? ''}"></div>
        <div class="field"><label>${nutName('protein')} (g)</label><input class="input" dir="ltr" inputmode="decimal" data-cf="protein" value="${d.protein ?? ''}"></div>
        <div class="field"><label>${nutName('carbs')} (g)</label><input class="input" dir="ltr" inputmode="decimal" data-cf="carbs" value="${d.carbs ?? ''}"></div>
        <div class="field"><label>${nutName('fat')} (g)</label><input class="input" dir="ltr" inputmode="decimal" data-cf="fat" value="${d.fat ?? ''}"></div>
      </div>
      <details style="margin-bottom:12px"><summary style="font-size:.88rem;color:var(--ink-soft);font-weight:600;padding:6px 0">${t('microsOptional')}</summary>${microFields}</details>
      <button class="btn primary" data-act="saveCustom">${t('saveIngredient')}</button>
    </div>
    <input id="labelInput" type="file" accept="image/*" capture="environment" class="hidden">`;
}

// ---------------- MANUAL ----------------
function renderManual() {
  const microFields = MICROS.map(m => `<div class="field" style="margin-bottom:8px">
    <label>${nutName(m.id)} (${m.unit})</label>
    <input class="input" dir="ltr" inputmode="decimal" data-mf="micro:${m.id}"></div>`).join('');
  return backBar('manualTitle') + `
    <div class="card">
      <div class="field"><label>${t('foodName')}</label><input class="input" data-mf="name"></div>
      <div class="grid2">
        <div class="field"><label>${nutName('calories')}</label><input class="input" dir="ltr" inputmode="numeric" data-mf="calories"></div>
        <div class="field"><label>${nutName('protein')} (g)</label><input class="input" dir="ltr" inputmode="decimal" data-mf="protein"></div>
        <div class="field"><label>${nutName('carbs')} (g)</label><input class="input" dir="ltr" inputmode="decimal" data-mf="carbs"></div>
        <div class="field"><label>${nutName('fat')} (g)</label><input class="input" dir="ltr" inputmode="decimal" data-mf="fat"></div>
      </div>
      <details style="margin-bottom:12px"><summary style="font-size:.88rem;color:var(--ink-soft);font-weight:600;padding:6px 0">${t('microsOptional')}</summary>${microFields}</details>
      <label style="display:flex;align-items:center;gap:8px;font-size:.9rem;margin-bottom:12px">
        <input type="checkbox" id="manualFav"> ${t('saveAsFav')}</label>
      <button class="btn primary" data-act="saveManual">${t('add')}</button>
    </div>`;
}

// ---------------- WEIGHT ----------------
function renderWeight() {
  const w = [...state.weights].sort((a,b) => a.t - b.t);
  const current = w.length ? w[w.length-1].kg : null;
  const start = w.length ? w[0].kg : null;
  const monthAgo = Date.now() - 30*864e5;
  const past = w.filter(x => x.t <= monthAgo);
  const ref = past.length ? past[past.length-1].kg : (w.length ? w[0].kg : null);
  const change = current != null && ref != null ? current - ref : null;

  const stats = `<div class="stat3">
    <div class="s"><div class="v">${current!=null?fmtNum(current):'—'}</div><div class="l">${t('current')} (${t('kg')})</div></div>
    <div class="s"><div class="v ${change>0?'up':change<0?'down':''}">${change!=null?(change>0?'+':'')+fmtNum(round1(change)):'—'}</div><div class="l">${t('change30')}</div></div>
    <div class="s"><div class="v">${start!=null?fmtNum(start):'—'}</div><div class="l">${t('starting')}</div></div>
  </div>`;

  const chart = w.length >= 2 ? weightChartSvg(w) : `<div class="empty">${t('noWeights')}</div>`;

  const hist = w.length ? [...w].reverse().map(x => {
    const d = new Date(x.t);
    return `<div class="meal"><span class="emoji">⚖️</span>
      <div class="info"><div class="nm">${fmtNum(x.kg)} ${t('kg')}</div>
      <div class="mac">${d.toLocaleDateString(getLang()==='ar'?'ar-SA-u-nu-latn':'en-US')}</div></div>
      <button class="del" data-act="delWeight" data-id="${x.id}">✕</button></div>`;
  }).join('') : `<div class="empty">${t('noWeights')}</div>`;

  return `
    <div class="card">${stats}<div style="margin-top:14px">${chart}</div></div>
    <div class="card">
      <div class="field"><label>${t('logWeight')} (${t('kg')})</label>
        <input class="input" id="weightInput" dir="ltr" inputmode="decimal" placeholder="${current??75}"></div>
      <button class="btn primary" data-act="logWeight">${t('logWeight')}</button>
    </div>
    <div class="card"><h2>${t('history')}</h2>${hist}</div>`;
}

function weightChartSvg(w) {
  const pts = w.slice(-60);
  const W = 320, H = 150, pad = 24;
  const xs = pts.map(p => p.t), ys = pts.map(p => p.kg);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1, spanY = (maxY - minY) || 1;
  const px = t0 => pad + ((t0 - minX)/spanX) * (W - 2*pad);
  const py = v => H - pad - ((v - minY)/spanY) * (H - 2*pad);
  const line = pts.map((p,i) => `${i?'L':'M'}${px(p.t).toFixed(1)},${py(p.kg).toFixed(1)}`).join(' ');
  const dots = pts.map(p => `<circle cx="${px(p.t).toFixed(1)}" cy="${py(p.kg).toFixed(1)}" r="3" fill="var(--green)"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <line x1="${pad}" y1="${H-pad}" x2="${W-pad}" y2="${H-pad}" stroke="var(--line)"/>
    <path d="${line}" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    <text x="${pad}" y="14" font-size="11" fill="var(--ink-faint)">${fmtNum(maxY)}</text>
    <text x="${pad}" y="${H-6}" font-size="11" fill="var(--ink-faint)">${fmtNum(minY)}</text>
  </svg>`;
}

// ---------------- SETTINGS ----------------
function renderSettings() {
  const g = state.settings.goals;
  const p = state.settings.profile;
  const ai = state.settings.ai;

  const goalFields = MACROS.map(m => `<div class="set-row"><span class="nm">${nutName(m.id)} <span class="s">${m.unit}</span></span>
    <input class="mini" dir="ltr" inputmode="numeric" data-goal="${m.id}" value="${g[m.id]}"></div>`).join('');

  const sexSeg = ['male','female'].map(v => `<button class="${p.sex===v?'on':''}" data-act="profSex" data-v="${v}">${t(v)}</button>`).join('');
  const actOpts = ['sedentary','light','moderate','active','veryActive'].map(v =>
    `<option value="${v}" ${p.activity===v?'selected':''}>${t('act'+v.charAt(0).toUpperCase()+v.slice(1))}</option>`).join('');
  const goalOpts = ['lose','maintain','gain'].map(v =>
    `<option value="${v}" ${p.goal===v?'selected':''}>${t('goal'+v.charAt(0).toUpperCase()+v.slice(1))}</option>`).join('');

  const microRows = MICROS.map(m => {
    const on = state.settings.microVisible[m.id];
    return `<div class="set-row">
      <span class="nm">${nutName(m.id)} <span class="s">${m.type==='limit'?t('limitType'):t('goalType')} · ${m.unit}</span></span>
      <div style="display:flex;align-items:center;gap:10px">
        <input class="mini" dir="ltr" inputmode="numeric" data-microgoal="${m.id}" value="${state.settings.microGoals[m.id]}">
        <button class="switch ${on?'on':''}" data-act="microVis" data-id="${m.id}"><span class="knob"></span></button>
      </div></div>`;
  }).join('');

  const provOpts = PROVIDERS.map(pr => `<option value="${pr}" ${ai.provider===pr?'selected':''}>${pr.charAt(0).toUpperCase()+pr.slice(1)}</option>`).join('');

  const u = currentUser();
  let cloudBody;
  if (!cloudConfigured()) {
    cloudBody = `<p style="font-size:.85rem;color:var(--ink-faint);margin:0">${t('cloudOff')}</p>`;
  } else if (u) {
    cloudBody = `<div class="set-row"><span class="nm">${t('signedInAs')}<span class="s">${esc(u.email||'')}</span></span>
      <button class="btn ghost sm" data-act="signOut">${t('signOut')}</button></div>`;
  } else {
    cloudBody = `<div class="field"><input class="input" id="cloudEmail" dir="ltr" placeholder="${t('email')}"></div>
      <div class="field"><input class="input" id="cloudPass" dir="ltr" type="password" placeholder="${t('password')}"></div>
      <div class="grid2"><button class="btn blue" data-act="cloudSignIn">${t('signIn')}</button>
        <button class="btn ghost" data-act="cloudSignUp">${t('signUp')}</button></div>`;
  }

  return `
    <div class="card"><h2>${t('stGoals')}</h2>${goalFields}</div>
    <div class="card"><h2>${t('stAuto')}<span class="sub">${t('stAutoSub')}</span></h2>
      <div class="grid2">
        <div class="field"><label>${t('age')}</label><input class="input" dir="ltr" inputmode="numeric" data-prof="age" value="${p.age}"></div>
        <div class="field"><label>${t('sex')}</label><div class="seg">${sexSeg}</div></div>
        <div class="field"><label>${t('height')}</label><input class="input" dir="ltr" inputmode="numeric" data-prof="heightCm" value="${p.heightCm}"></div>
        <div class="field"><label>${t('weightKg')}</label><input class="input" dir="ltr" inputmode="decimal" data-prof="weightKg" value="${p.weightKg}"></div>
        <div class="field"><label>${t('activity')}</label><select class="input" data-prof="activity">${actOpts}</select></div>
        <div class="field"><label>${t('goal')}</label><select class="input" data-prof="goal">${goalOpts}</select></div>
      </div>
      <button class="btn primary" data-act="applyAuto">${t('applyTargets')}</button></div>
    <div class="card"><h2>${t('stMicros')}<span class="sub">${t('stMicrosSub')}</span></h2>${microRows}</div>
    <div class="card"><h2>${t('stAI')}</h2>
      <div class="field"><label>${t('provider')}</label><select class="input" data-act="aiProvider">${provOpts}</select></div>
      <div class="field"><label>${t('apiKey')} — ${ai.provider}</label>
        <input class="input" dir="ltr" type="password" data-act="aiKey" value="${esc(ai.keys[ai.provider]||'')}" placeholder="sk-…"></div>
      <div class="field"><label>${t('model')}</label>
        <input class="input" dir="ltr" data-act="aiModel" value="${esc(ai.models[ai.provider]||DEFAULT_MODELS[ai.provider])}"></div>
      <p style="font-size:.78rem;color:var(--ink-faint);margin:0">${t('keyHint')}</p></div>
    <div class="card"><h2>${t('stCloud')}</h2>${cloudBody}</div>
    <div class="card"><h2>${t('stData')}</h2>
      <button class="btn ghost" style="margin-bottom:10px" data-act="exportJson">${t('exportJson')}</button>
      <button class="btn ghost" data-act="importJson">${t('importJson')}</button>
      <input id="importInput" type="file" accept="application/json,.json" class="hidden"></div>
    <div class="card"><h2>${t('stLang')}</h2>
      <div class="seg"><button class="${getLang()==='ar'?'on':''}" data-act="setLang" data-l="ar">العربية</button>
        <button class="${getLang()==='en'?'on':''}" data-act="setLang" data-l="en">English</button></div></div>`;
}

// ---------------- amount modal (grams vs count) ----------------
function openAmountModal(ing) {
  const isUnit = !!ing.unit;
  const unitLabel = isUnit ? t('count') : t('weightG');
  const def = isUnit ? '1' : '100';
  openModal(`<h3>${esc(nm(ing))}</h3>
    <div class="field"><label>${unitLabel}</label>
      <input class="input" id="amtInput" dir="ltr" inputmode="decimal" value="${def}" autofocus></div>
    <div id="amtPreview" class="totals"></div>
    <div class="grid2"><button class="btn ghost" data-act="closeModal">${t('cancel')}</button>
      <button class="btn primary" data-act="confirmAmount" data-id="${esc(ing.id)}">${t('addToMeal')}</button></div>`);
  const input = el('#amtInput');
  const upd = () => { el('#amtPreview').innerHTML = amountPreview(ing, parseFloat(input.value)||0); };
  input.addEventListener('input', upd); upd(); input.focus(); input.select();
}
function computeAmount(ing, amount) {
  // stored values are per-100g; unit items: amount = count, grams = count*unit.g
  const grams = ing.unit ? amount * ing.unit.g : amount;
  const factor = grams / 100;
  const base = { calories: ing.calories, protein: ing.protein, carbs: ing.carbs, fat: ing.fat, micros: ing.micros };
  return { nutr: validateNutrition(scaleNutrition(base, factor)), grams };
}
function amountPreview(ing, amount) {
  const { nutr } = computeAmount(ing, amount);
  return `<div class="b"><div class="v">${fmtNum(Math.round(nutr.calories))}</div><div class="l">${t('kcal')}</div></div>
    <div class="b"><div class="v">${fmtNum(round1(nutr.protein))}</div><div class="l">${nutName('protein')}</div></div>
    <div class="b"><div class="v">${fmtNum(round1(nutr.carbs))}</div><div class="l">${nutName('carbs')}</div></div>
    <div class="b"><div class="v">${fmtNum(round1(nutr.fat))}</div><div class="l">${nutName('fat')}</div></div>`;
}

// ---------------- actions ----------------
const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

function logMeal(meal, dateKey = todayKey()) {
  meal.id = meal.id || uid();
  meal.t = Date.now();
  if (!state.days[dateKey]) state.days[dateKey] = { meals: [] };
  state.days[dateKey].meals.push(meal);
  persist();
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act;
  const A = {
    toggleLang() { const l = getLang()==='ar'?'en':'ar'; applyLang(l); },
    setLang() { applyLang(b.dataset.l); },
    tab() { view = b.dataset.tab; if (view==='add') addScreen='hub'; render(); },
    dayPrev() { viewDate = shiftDate(viewDate, -1); render(); },
    dayNext() { const nx = shiftDate(viewDate, 1); if (nx <= todayKey()) { viewDate = nx; render(); } },
    addScreen() { addScreen = b.dataset.screen; if (addScreen==='hub'){ aiResult=null; builder=[]; customDraft=null; } render(); },
    closeModal() { closeModal(); },

    // today meal actions
    delMeal() { if (confirm(t('deleteMeal'))) { const k=viewDate; state.days[k].meals = state.days[k].meals.filter(m=>m.id!==b.dataset.id); persist(); render(); } },
    favMeal() { const m = dayMeals().find(x=>x.id===b.dataset.id); if (m){ addFavorite(m); toast(t('addFavorite')); } },
    logFav() { const f = state.favorites.find(x=>x.id===b.dataset.id); if (f){ logMeal(favToMeal(f)); toast(t('added')); if(view!=='today'){view='today';} render(); } },

    // photo
    photoPick() { el('#photoInput').click(); },
    aiToggle() { const i=+b.dataset.i; aiResult.items[i]._include = !(aiResult.items[i]._include!==false); render(); },
    aiAddMeal() { addAiMeal(); },

    // db
    dbCat() { dbCat = b.dataset.cat; dbSearchFocus=false; render(); },
    pickIng() { const ing = getIngredient(b.dataset.id, state.customIngredients); if (ing) openAmountModal(ing); },
    confirmAmount() {
      const ing = getIngredient(b.dataset.id, state.customIngredients);
      const amount = num(el('#amtInput').value);
      if (!ing || amount<=0) { closeModal(); return; }
      const { nutr, grams } = computeAmount(ing, amount);
      const display = ing.unit ? plural('piece', amount) : `${fmtNum(grams)}${t('grams')}`;
      builder.push({ id: uid(), label: nm(ing), display, nutr });
      closeModal(); dbSearchFocus=false; render();
    },
    builderDel() { builder.splice(+b.dataset.i,1); render(); },
    saveBuilder() { saveBuilderMeal(); },

    // custom
    labelPick() { el('#labelInput').click(); },
    cfBasis() { customDraft = customDraft||{}; customDraft.basis = b.dataset.b; render(); },
    saveCustom() { saveCustomIngredient(); },

    // manual
    saveManual() { saveManualMeal(); },

    // weight
    logWeight() { const kg = num(el('#weightInput').value); if (kg>0){ state.weights.push({id:uid(),kg,t:Date.now()}); persist(); render(); toast(t('added')); } },
    delWeight() { if (confirm(t('deleteEntry'))) { state.weights = state.weights.filter(w=>w.id!==b.dataset.id); persist(); render(); } },

    // settings
    profSex() { state.settings.profile.sex = b.dataset.v; render(); },
    applyAuto() { applyAutoTargets(); },
    microVis() { const id=b.dataset.id; state.settings.microVisible[id]=!state.settings.microVisible[id]; persist(); render(); },
    signOut() { signOutCloud().then(()=>{ toast(t('signOut')); render(); }); },
    cloudSignIn() { doCloudAuth(false); },
    cloudSignUp() { doCloudAuth(true); },
    exportJson() { exportData(); },
    importJson() { el('#importInput').click(); },
  };
  if (A[act]) { e.preventDefault(); A[act](); }
});

// input changes
document.addEventListener('input', (e) => {
  const t0 = e.target;
  if (t0.id === 'dbsearch') { dbQuery = t0.value; dbSearchFocus = true; render(); return; }
  if (t0.dataset.act === 'aiEdit') { aiEditItem(+t0.dataset.i, t0.dataset.f, t0.value); return; }
  if (t0.dataset.goal) { state.settings.goals[t0.dataset.goal] = num(t0.value); persist({sync:false}); scheduleSync(); return; }
  if (t0.dataset.microgoal) { state.settings.microGoals[t0.dataset.microgoal] = num(t0.value); persist({sync:false}); scheduleSync(); return; }
  if (t0.dataset.prof) { state.settings.profile[t0.dataset.prof] = t0.dataset.prof==='activity'||t0.dataset.prof==='goal' ? t0.value : num(t0.value); return; }
  if (t0.dataset.cf) { updateCustomDraft(t0.dataset.cf, t0.value); return; }
});
document.addEventListener('change', (e) => {
  const t0 = e.target;
  if (t0.dataset.act === 'aiProvider') { state.settings.ai.provider = t0.value; persist(); render(); }
  if (t0.dataset.act === 'aiKey') { state.settings.ai.keys[state.settings.ai.provider] = t0.value.trim(); persist(); }
  if (t0.dataset.act === 'aiModel') { state.settings.ai.models[state.settings.ai.provider] = t0.value.trim(); persist(); }
  if (t0.dataset.prof === 'activity') { state.settings.profile.activity = t0.value; }
  if (t0.dataset.prof === 'goal') { state.settings.profile.goal = t0.value; }
  if (t0.id === 'photoInput') handlePhotoFile(t0.files[0]);
  if (t0.id === 'labelInput') handleLabelFile(t0.files[0]);
  if (t0.id === 'importInput') handleImportFile(t0.files[0]);
});

let syncTimer = null;
function scheduleSync() { clearTimeout(syncTimer); syncTimer = setTimeout(() => syncUp(state), 600); }

// ---------------- action implementations ----------------
function applyLang(l) { setLang(l); state.settings.lang = l; document.documentElement.lang=l; document.documentElement.dir = l==='ar'?'rtl':'ltr'; persist(); render(); }
function shiftDate(key, days) { const [y,m,d]=key.split('-').map(Number); const dt=new Date(y,m-1,d); dt.setDate(dt.getDate()+days); return todayKey(dt); }

function addFavorite(meal) {
  state.favorites.unshift({ id: uid(), name: meal.name, emoji: meal.emoji||emoji.meal,
    calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, micros: meal.micros||emptyMicros() });
  state.favorites = state.favorites.slice(0, 30);
  persist();
}
function favToMeal(f) { return { id: uid(), name: f.name, emoji: f.emoji, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, micros: f.micros||emptyMicros() }; }

function saveBuilderMeal() {
  if (!builder.length) return;
  let tot = zeroNutrition();
  for (const bi of builder) tot = addNutrition(tot, bi.nutr);
  const nameInput = el('#builderName');
  const name = (nameInput && nameInput.value.trim()) || builder.map(b=>b.label).slice(0,3).join('، ');
  logMeal({ name, emoji: emoji.meal, calories: tot.calories, protein: tot.protein, carbs: tot.carbs, fat: tot.fat, micros: tot.micros });
  builder = []; addScreen='hub'; view='today'; render(); toast(t('added'));
}

function saveManualMeal() {
  const get = f => el(`[data-mf="${f}"]`);
  const name = get('name').value.trim();
  if (!name) { toast(t('foodName')); return; }
  const micros = emptyMicros();
  for (const m of MICROS) { const inp = el(`[data-mf="micro:${m.id}"]`); if (inp) micros[m.id] = num(inp.value); }
  const meal = validateNutrition({ calories:num(get('calories').value), protein:num(get('protein').value), carbs:num(get('carbs').value), fat:num(get('fat').value), micros });
  const full = { name, emoji: emoji.meal, ...meal };
  if (el('#manualFav')?.checked) addFavorite(full);
  logMeal(full); addScreen='hub'; view='today'; render(); toast(t('added'));
}

function updateCustomDraft(field, value) {
  customDraft = customDraft || { basis:'100', micros:{} };
  if (field.startsWith('micro:')) { customDraft.micros = customDraft.micros||{}; customDraft.micros[field.slice(6)] = value; }
  else customDraft[field] = value;
}

function saveCustomIngredient() {
  const d = customDraft || {};
  const en = (d.en||'').trim(), ar = (d.ar||'').trim();
  if (!en && !ar) { toast(t('nameEn')); return; }
  let cal=num(d.calories), pr=num(d.protein), cb=num(d.carbs), ft=num(d.fat);
  const micros = emptyMicros();
  for (const m of MICROS) micros[m.id] = num(d.micros?.[m.id]);
  let unit = null;
  // convert per-serving → per-100g basis, but keep the serving as a countable unit
  if (d.basis === 'serving') {
    const sg = num(d.servingGrams);
    if (sg > 0) {
      const f = 100 / sg;
      cal*=f; pr*=f; cb*=f; ft*=f;
      for (const m of MICROS) micros[m.id]*=f;
      unit = { g: sg, name: (d.servingName||'').trim() || null };
    }
  }
  const v = validateNutrition({ calories:cal, protein:pr, carbs:cb, fat:ft, micros });
  const ing = { id: 'cust-'+uid(), en: en||ar, ar: ar||en, cat: d.cat||'dishes', custom:true, unit,
    calories:v.calories, protein:v.protein, carbs:v.carbs, fat:v.fat, micros:v.micros };
  state.customIngredients.unshift(ing);
  persist();
  customDraft=null; addScreen='db'; dbQuery=en||ar; render(); toast(t('savedIngredient'));
}

function applyAutoTargets() {
  const p = state.settings.profile;
  const r = autoTargets(p);
  state.settings.goals = { calories:r.calories, protein:r.protein, carbs:r.carbs, fat:r.fat };
  for (const m of MICROS) if (r.micro[m.id]!=null) state.settings.microGoals[m.id] = r.micro[m.id];
  persist(); render(); toast(t('targetsApplied'));
}

// ---------------- AI photo / label ----------------
async function handlePhotoFile(file) {
  if (!file) return;
  const ai = state.settings.ai;
  if (!ai.keys[ai.provider]) { toast(t('noKey')); return; }
  toast(t('analyzing'));
  try {
    const { b64, mime } = await fileToScaledB64(file);
    const res = await analyzePhoto(ai, b64, mime);
    if (!res.items.length) { toast(t('aiFailed')); return; }
    res.items.forEach(it => it._include = true);
    aiResult = res; render();
  } catch (err) { toast(err.code==='NO_KEY' ? t('noKey') : `${t('aiFailed')}: ${String(err.message||err).slice(0,80)}`); }
}

function aiEditItem(i, field, value) {
  const it = aiResult.items[i]; if (!it) return;
  if (field === 'calories') {
    const newCal = num(value);
    const old = it.calories || 1;
    if (newCal > 0 && old > 0) {
      const factor = newCal / old;
      const scaled = scaleNutrition({ calories:it.calories, protein:it.protein, carbs:it.carbs, fat:it.fat, micros:it.micros }, factor);
      Object.assign(it, scaled);
    } else { it.calories = newCal; }
  } else { it[field] = num(value); }
}

function addAiMeal() {
  const inc = aiResult.items.filter(it => it._include !== false);
  if (!inc.length) return;
  let tot = zeroNutrition();
  for (const it of inc) tot = addNutrition(tot, { calories:it.calories, protein:it.protein, carbs:it.carbs, fat:it.fat, micros:it.micros });
  const name = inc.map(it => nmAi(it)).slice(0,3).join('، ');
  logMeal({ name, emoji: '📷', calories:tot.calories, protein:tot.protein, carbs:tot.carbs, fat:tot.fat, micros:tot.micros });
  aiResult=null; addScreen='hub'; view='today'; render(); toast(t('added'));
}

async function handleLabelFile(file) {
  if (!file) return;
  const ai = state.settings.ai;
  if (!ai.keys[ai.provider]) { toast(t('noKey')); return; }
  toast(t('readingLabel'));
  try {
    const { b64, mime } = await fileToScaledB64(file);
    const res = await readLabel(ai, b64, mime);
    const it = res.items[0];
    if (!it) { toast(t('aiFailed')); return; }
    customDraft = customDraft || {};
    customDraft.en = customDraft.en || it.name;
    customDraft.ar = customDraft.ar || it.name_ar;
    customDraft.calories = Math.round(it.calories);
    customDraft.protein = round1(it.protein); customDraft.carbs = round1(it.carbs); customDraft.fat = round1(it.fat);
    customDraft.micros = {}; for (const m of MICROS) customDraft.micros[m.id] = round1(it.micros[m.id]);
    if (it.grams > 0) { customDraft.basis = 'serving'; customDraft.servingGrams = Math.round(it.grams); customDraft.servingName = it.name; }
    customDraft._scanned = true;
    render(); toast(t('labelDone'));
  } catch (err) { toast(`${t('aiFailed')}: ${String(err.message||err).slice(0,80)}`); }
}

// ---------------- data export/import ----------------
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `se3ra-backup-${todayKey()}.json`; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
function handleImportFile(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const parsed = JSON.parse(rd.result);
      if (!parsed || typeof parsed !== 'object' || !parsed.settings) throw new Error('bad');
      if (!confirm(t('importConfirm'))) return;
      state = migrate(parsed);
      setLang(state.settings.lang); document.documentElement.dir = getLang()==='ar'?'rtl':'ltr';
      persist(); render(); toast(t('imported'));
    } catch { toast(t('badFile')); }
  };
  rd.readAsText(file);
}

// ---------------- cloud wiring ----------------
async function doCloudAuth(isSignUp) {
  const email = el('#cloudEmail')?.value.trim();
  const pass = el('#cloudPass')?.value;
  if (!email || !pass) return;
  try { await (isSignUp ? signUp(email, pass) : signIn(email, pass)); toast(t('syncing')); }
  catch (err) { toast(`${t('error')}: ${String(err.code||err.message||err).replace('auth/','')}`); }
}

initCloud({
  getLocalState: () => state,
  onState: (incoming, source) => {
    state = migrate(incoming);
    setLang(state.settings.lang); document.documentElement.dir = getLang()==='ar'?'rtl':'ltr';
    localStorage.setItem(KEY, JSON.stringify(state));
    render();
    if (source === 'merged') toast(t('mergeDone'));
  },
  onStatus: (s) => { if (s==='synced') { /* quiet */ } render(); },
}).catch(()=>{});

// ---------------- go ----------------
render();
