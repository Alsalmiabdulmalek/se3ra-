// ai.js — one interface over Claude / Gemini / OpenAI.
// Both entry points return the SAME normalized shape:
//   { confidence: 'high'|'medium'|'low', items: [ { name, name_ar, grams, calories, protein, carbs, fat, micros{} } ] }
// API keys live in localStorage on the device only and are never uploaded to sync.
import { MICROS, validateNutrition } from './nutrients.js';

export const PROVIDERS = ['claude', 'gemini', 'openai'];

export const DEFAULT_MODELS = {
  claude: 'claude-sonnet-4-6',
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-5-mini',
};

const microList = MICROS.map(m => `"${m.id}" (${m.unit})`).join(', ');

const SCHEMA_NOTE =
  `Return ONLY valid JSON, no markdown, no prose. Shape:
{"confidence":"high|medium|low","items":[{"name":"<English>","name_ar":"<Arabic>","grams":<number>,"calories":<number>,"protein":<number>,"carbs":<number>,"fat":<number>,"micros":{${MICROS.map(m => `"${m.id}":<number>`).join(',')}}}]}
Micros with units: ${microList}. All numbers are the amount in the portion shown (not per 100 g). Use 0 for anything you cannot determine. Never return null.`;

const PHOTO_PROMPT =
  `You are a nutrition estimator. Look at this meal photo and identify each distinct food item, estimate its portion in grams, and give calories, macros and micronutrients for that portion. Set "confidence" by how clearly you can identify foods and portions. ` + SCHEMA_NOTE;

const LABEL_PROMPT =
  `You are reading a nutrition-facts label. Transcribe ONLY what is printed — do not estimate or infer anything not on the label; use 0 for any nutrient not shown. Return a single item. Read the serving size: put its weight in grams into "grams", and if the label states a serving like "3 pretzels" put that text in "name". ` + SCHEMA_NOTE;

// ---- shared parsing --------------------------------------------------------
function parseModelJson(text) {
  if (!text) throw new Error('empty response');
  let s = text.trim();
  // strip ``` fences if the model added them despite instructions
  s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a === -1 || b === -1) throw new Error('no JSON found in response');
  const obj = JSON.parse(s.slice(a, b + 1));
  return normalizeResult(obj);
}

function normalizeResult(obj) {
  const conf = ['high', 'medium', 'low'].includes(obj.confidence) ? obj.confidence : 'medium';
  const rawItems = Array.isArray(obj.items) ? obj.items : [];
  const items = rawItems.map(it => {
    const v = validateNutrition(it);
    return {
      name: String(it.name || 'Item').slice(0, 80),
      name_ar: String(it.name_ar || it.name || 'عنصر').slice(0, 80),
      grams: Math.max(0, Number(it.grams) || 0),
      calories: v.calories, protein: v.protein, carbs: v.carbs, fat: v.fat,
      micros: v.micros,
    };
  }).filter(it => it.calories > 0 || it.grams > 0);
  return { confidence: conf, items };
}

// ---- provider calls --------------------------------------------------------
async function callClaude(key, model, prompt, b64, mime) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model, max_tokens: 3000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mime, data: b64 } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });
  if (!res.ok) throw new Error(await errText(res, 'Claude'));
  const data = await res.json();
  const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
  return parseModelJson(text);
}

async function callGemini(key, model, prompt, b64, mime) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }] }],
      generationConfig: { temperature: 0.2, response_mime_type: 'application/json' },
    }),
  });
  if (!res.ok) throw new Error(await errText(res, 'Gemini'));
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('\n');
  return parseModelJson(text);
}

async function callOpenAI(key, model, prompt, b64, mime) {
  // gpt-5 family rejects max_tokens and custom temperature — omit both.
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } },
        ],
      }],
    }),
  });
  if (!res.ok) throw new Error(await errText(res, 'OpenAI'));
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  return parseModelJson(text);
}

async function errText(res, who) {
  let detail = '';
  try { const j = await res.json(); detail = j.error?.message || JSON.stringify(j.error || j); }
  catch { detail = await res.text().catch(() => ''); }
  return `${who} ${res.status}: ${detail || res.statusText}`;
}

function dispatch(ai, prompt, b64, mime) {
  const provider = ai?.provider || 'claude';
  const key = ai?.keys?.[provider];
  if (!key) { const e = new Error('no-key'); e.code = 'NO_KEY'; throw e; }
  const model = ai?.models?.[provider] || DEFAULT_MODELS[provider];
  if (provider === 'claude') return callClaude(key, model, prompt, b64, mime);
  if (provider === 'gemini') return callGemini(key, model, prompt, b64, mime);
  if (provider === 'openai') return callOpenAI(key, model, prompt, b64, mime);
  throw new Error('unknown provider');
}

// b64 = bare base64 (no data: prefix); mime like 'image/jpeg'
export function analyzePhoto(ai, b64, mime) { return dispatch(ai, PHOTO_PROMPT, b64, mime); }
export function readLabel(ai, b64, mime)    { return dispatch(ai, LABEL_PROMPT, b64, mime); }
