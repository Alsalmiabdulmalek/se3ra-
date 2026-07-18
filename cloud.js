// cloud.js — optional Firebase auth + Firestore sync, loaded from CDN as ES modules
// (no build step). If firebase-config.js is empty the whole module stays dormant and
// the app is device-only.
//
// Sync model:
//   - The entire app state is stored as ONE JSON blob per user at users/{uid}.
//   - FIRST sign-in on a given device MERGES local + cloud (union of collections by id,
//     newest-wins settings) so turning on sync never destroys local data.
//   - AFTER that first merge the cloud copy is authoritative, so deletes propagate.
//   - API keys are STRIPPED before upload (device-local) and preserved locally on adopt.
import { firebaseConfig } from './firebase-config.js';

const CDN = 'https://www.gstatic.com/firebasejs/10.12.2';
const isConfigured = () => firebaseConfig && Object.keys(firebaseConfig).length > 0 && firebaseConfig.apiKey;

let fb = null;              // { app, auth, db, fns... }
let handlers = {};          // { onState, onStatus, getLocalState }
let user = null;
let unsub = null;           // firestore snapshot unsubscribe
let lastPushedJson = null;  // echo-loop guard
let pushTimer = null;
let pendingDirty = false;   // a local push is queued/in-flight → ignore incoming snapshots

export function cloudConfigured() { return !!isConfigured(); }
export function currentUser() { return user; }

export async function initCloud({ onState, onStatus, getLocalState }) {
  handlers = { onState, onStatus, getLocalState };
  if (!isConfigured()) return { enabled: false };

  const [{ initializeApp }, authMod, fsMod] = await Promise.all([
    import(`${CDN}/firebase-app.js`),
    import(`${CDN}/firebase-auth.js`),
    import(`${CDN}/firebase-firestore.js`),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = authMod.getAuth(app);
  const db = fsMod.getFirestore(app);
  fb = { app, auth, db, authMod, fsMod };

  authMod.onAuthStateChanged(auth, async (u) => {
    user = u;
    if (u) { await onSignedIn(u); }
    else { if (unsub) { unsub(); unsub = null; } status('signedOut'); }
    handlers.onStatus?.(u ? 'signedIn' : 'signedOut', u);
  });
  return { enabled: true };
}

function status(s, extra) { handlers.onStatus?.(s, extra ?? user); }

async function onSignedIn(u) {
  const { fsMod, db } = fb;
  const ref = fsMod.doc(db, 'users', u.uid);
  const mergedKey = `se3ra_merged_${u.uid}`;
  status('syncing');

  const snap = await fsMod.getDoc(ref);
  const cloud = snap.exists() ? safeParse(snap.data().blob) : null;
  const local = handlers.getLocalState?.();

  if (!localStorage.getItem(mergedKey)) {
    // first sign-in on this device: union local + cloud so nothing is lost
    const merged = cloud ? mergeStates(local, cloud) : local;
    localStorage.setItem(mergedKey, '1');
    handlers.onState?.(merged, 'merged');
    await push(merged);   // write the merged result back up
  } else if (cloud) {
    // already merged before → cloud is authoritative
    handlers.onState?.(adoptKeys(cloud, local), 'cloud');
  } else if (local) {
    await push(local);
  }

  // live updates from other devices
  if (unsub) unsub();
  unsub = fsMod.onSnapshot(ref, (docSnap) => {
    if (!docSnap.exists()) return;
    if (pendingDirty) return;                 // our own queued write, ignore
    const incomingRaw = docSnap.data().blob;
    if (incomingRaw === lastPushedJson) return; // echo of our own push
    const incoming = safeParse(incomingRaw);
    if (incoming) handlers.onState?.(adoptKeys(incoming, handlers.getLocalState?.()), 'cloud');
  });
  status('synced');
}

// strip device-only API keys before upload
function stripKeys(state) {
  const s = structuredClone(state);
  if (s?.settings?.ai) s.settings.ai.keys = {};
  return s;
}
// restore this device's local API keys onto an incoming cloud state
function adoptKeys(incoming, local) {
  const s = structuredClone(incoming);
  if (s?.settings?.ai) s.settings.ai.keys = local?.settings?.ai?.keys || {};
  return s;
}

async function push(state) {
  if (!fb || !user) return;
  const { fsMod, db } = fb;
  const clean = stripKeys(state);
  const blob = JSON.stringify(clean);
  lastPushedJson = blob;
  try {
    await fsMod.setDoc(fsMod.doc(db, 'users', user.uid), { blob, updatedAt: Date.now() });
    status('synced');
  } catch (e) {
    status('error', e);
  } finally {
    pendingDirty = false;
  }
}

// debounced push called by the app whenever local state changes
export function syncUp(state) {
  if (!fb || !user) return;
  pendingDirty = true;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => push(state), 800);
}

export async function signIn(email, password) {
  const { authMod, auth } = fb;
  return authMod.signInWithEmailAndPassword(auth, email, password);
}
export async function signUp(email, password) {
  const { authMod, auth } = fb;
  return authMod.createUserWithEmailAndPassword(auth, email, password);
}
export async function signOutCloud() {
  const { authMod, auth } = fb;
  if (unsub) { unsub(); unsub = null; }
  return authMod.signOut(auth);
}

function safeParse(s) { try { return typeof s === 'string' ? JSON.parse(s) : s; } catch { return null; } }

// ---- merge (union by id; settings newest-wins) ----------------------------
export function mergeStates(a, b) {
  if (!a) return b; if (!b) return a;
  const out = structuredClone(a);

  // days: merge meal lists per date, union meals by id
  out.days = out.days || {};
  const bDays = b.days || {};
  for (const date of Object.keys(bDays)) {
    const am = out.days[date]?.meals || [];
    const bm = bDays[date]?.meals || [];
    out.days[date] = { meals: unionById(am, bm) };
  }

  out.weights           = unionById(a.weights || [], b.weights || []);
  out.favorites         = unionById(a.favorites || [], b.favorites || []);
  out.customIngredients = unionById(a.customIngredients || [], b.customIngredients || []);

  // settings: whichever side was updated more recently wins wholesale
  const at = a.settings?._updated || 0;
  const bt = b.settings?._updated || 0;
  out.settings = bt > at ? structuredClone(b.settings) : structuredClone(a.settings);
  // keep local API keys regardless of which settings won
  if (out.settings?.ai) out.settings.ai.keys = a.settings?.ai?.keys || b.settings?.ai?.keys || {};
  return out;
}

function unionById(a, b) {
  const map = new Map();
  for (const x of a) if (x && x.id != null) map.set(x.id, x);
  for (const x of b) if (x && x.id != null && !map.has(x.id)) map.set(x.id, x);
  return [...map.values()];
}
