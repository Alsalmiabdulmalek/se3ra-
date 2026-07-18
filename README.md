# سعرة · Se3ra

A bilingual (Arabic/English) calorie & nutrition tracker that installs on your iPhone as a PWA. Plain HTML + CSS + vanilla JavaScript — no build step, no dependencies, no server required to run it.

## What's in here

| File | Purpose |
|---|---|
| `index.html` | App shell + iOS PWA meta tags |
| `styles.css` | Notion-style light theme, RTL-first |
| `app.js` | State, screens, all interaction |
| `nutrients.js` | Nutrient definitions, validation, auto-targets |
| `i18n.js` | Arabic/English strings + Arabic pluralization |
| `ingredients.js` | ~130-item ingredient database |
| `ai.js` | Claude / Gemini / OpenAI adapter |
| `cloud.js` | Optional Firebase sync |
| `firebase-config.js` | **Empty by default** — paste config here to enable sync |
| `firestore.rules` | Security rules to publish in Firebase |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA plumbing |
| `test.mjs` | Logic test suite (`node test.mjs`) |

The app runs **device-only** out of the box. AI features need an API key; cloud sync needs Firebase. Both are optional and configured from the Settings tab (AI) or `firebase-config.js` (sync).

---

## 1. Test it locally first (recommended)

ES modules won't load from `file://`, so you need a tiny local server. On **Windows** (no install needed), open PowerShell in this folder and run:

```powershell
$L=[System.Net.HttpListener]::new();$L.Prefixes.Add('http://localhost:8080/');$L.Start()
Write-Host 'Open http://localhost:8080/  (Ctrl+C to stop)'
$mime=@{'.html'='text/html';'.js'='text/javascript';'.css'='text/css';'.json'='application/json';'.webmanifest'='application/manifest+json';'.png'='image/png'}
while($L.IsListening){$c=$L.GetContext();$p=($c.Request.Url.LocalPath).TrimStart('/');if($p -eq ''){$p='index.html'};$f=Join-Path $PWD $p;if(Test-Path $f -PathType Leaf){$b=[IO.File]::ReadAllBytes($f);$e=[IO.Path]::GetExtension($f);if($mime[$e]){$c.Response.ContentType=$mime[$e]};$c.Response.OutputStream.Write($b,0,$b.Length)}else{$c.Response.StatusCode=404};$c.Response.Close()}
```

Then open `http://localhost:8080/` in a browser, shrink the window to phone width (~375px, or use the browser's device toolbar) and click through Today / Add / Weight / Settings.

> Note: the service worker and "Add to Home Screen" only work over `https://` (or a real localhost). That's what deploying to GitHub Pages is for.

---

## 2. Put it online with GitHub Pages (free)

1. Create a **public** repo on GitHub, e.g. `se3ra`.
2. Upload all these files to the repo root (drag-and-drop in the GitHub web UI works).
3. Repo → **Settings** → **Pages** → under "Build and deployment", set **Source: Deploy from a branch**, branch **main**, folder **/ (root)**, Save.
4. Wait ~1 minute. Your app is live at `https://<your-username>.github.io/se3ra/`.
5. Every push to `main` redeploys automatically.

Nothing secret goes in the repo — the app asks for your API key at runtime and stores it only on your device.

---

## 3. Install on your iPhone

1. Open the GitHub Pages URL in **Safari** (must be Safari for install to work).
2. Tap the **Share** button → **Add to Home Screen** → **Add**.
3. Launch it from the home-screen icon. It opens full-screen, works offline, and looks like a native app.

---

## 4. Get an AI API key (for photo scan & label reading)

You chose **Claude** as the default. To get a key:

1. Go to `https://console.anthropic.com` and sign in / sign up.
2. Add a payment method (image analysis is cheap — fractions of a cent per photo, but a card is required).
3. Open **API Keys** → **Create Key**, copy it (starts with `sk-ant-…`).
4. In the app: **Settings → AI provider →** paste the key. Leave the model as `claude-sonnet-4-6` or change it.

The key is stored in your browser's local storage on that device only and is **never** uploaded to cloud sync. Gemini (`https://aistudio.google.com/apikey`) and OpenAI (`https://platform.openai.com/api-keys`) work the same way if you switch providers.

---

## 5. Enable cloud sync with Firebase (optional)

You asked to set this up now. Steps:

1. Go to `https://console.firebase.google.com` → **Add project** (any name), skip Analytics.
2. In the project, click the **Web** icon (`</>`) to add a web app. Register it (no hosting needed). Copy the `firebaseConfig` object it shows you.
3. Open `firebase-config.js` in this project and paste your values:
   ```js
   export const firebaseConfig = {
     apiKey: 'AIza…', authDomain: '….firebaseapp.com', projectId: '…',
     storageBucket: '…', messagingSenderId: '…', appId: '…',
   };
   ```
4. In the Firebase console → **Build → Authentication → Get started → Sign-in method →** enable **Email/Password**.
5. **Build → Firestore Database → Create database** (Production mode, pick a region).
6. Firestore → **Rules** tab → paste the contents of `firestore.rules` → **Publish**.
7. Commit `firebase-config.js` and push. On the live app, **Settings → Cloud sync** now shows sign-in.

The Firebase web config is public by design; your data is protected by the rules (each user can read/write only their own document). The **first** sign-in on a device merges local + cloud data so nothing is lost; after that, the cloud copy is authoritative so deletions sync.

---

## What was tested, and what wasn't

- ✅ All JS passes `node --check`; a 33-case logic suite (`node test.mjs`) covers validation clamps, proportional scaling, search ranking, Arabic plurals, auto-targets math, and the sync merge.
- ✅ Every screen renders without errors under a stubbed DOM.
- ⚠️ Not visually rendered in a real browser here, and the live AI/Firebase network calls weren't exercised against real endpoints. **Test at phone width locally (step 1) before relying on it.**
