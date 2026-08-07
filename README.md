# 🫀 AI-Enhanced ECG Interpretation

A clean, patient-context-aware ECG analysis tool built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**, deployable on **Vercel**. Gemini does the heavy lifting; the Gemini API key is configured server-side via an environment variable, never entered by the user.

## 🚀 Features

- **Upload:** ECG as PDF, JPG, or JPEG.
- **Patient context:** age, sex, and clinical background captured up front and included in every AI prompt.
- **Two analysis modes:**
  - **Automated Parsing** — Gemini reads the ECG directly and works through the full systematic interpretation itself (rate, rhythm, axis, intervals, diagnosis).
  - **Manual Input** — the clinician works through the standard step-by-step checklist (calibration, rate/rhythm, P waves, PR, QRS, axis, ST/T, QTc); Gemini then cross-checks those findings against the image.
- **QTc Calculator:** Bazett's Formula, $QTc = QT / \sqrt{RR}$ (manual mode).
- **Axis Determination:** automated logic from Leads I/aVF (manual mode).

## 🔑 Configure the Gemini API key

The key is read from `GEMINI_API_KEY` on the server — it is never sent to or stored in the browser.

- **Vercel:** Project → Settings → Environment Variables → add `GEMINI_API_KEY` → redeploy.
- **Local dev:** copy `.env.example` to `.env.local` and fill in the value.

## 🛠️ Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## ☁️ Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New Project** → import `GEMINI-ECG--ANALYSIS`.
3. Framework preset: **Next.js** (auto-detected).
4. Add the `GEMINI_API_KEY` environment variable (see above).
5. Deploy. `vercel.json` pins the deployment region to Mumbai (`bom1`).

## 📁 Project structure

```
app/
  page.tsx            # Upload, patient info, mode toggle, checklist (manual mode), AI analysis
  api/gemini/route.ts # Server route — Gemini call, key read from process.env.GEMINI_API_KEY
  layout.tsx
  globals.css
lib/
  ecg-utils.ts         # calculateQtc, calculateHeartRate, determineAxis, prompt builders
```

## ⚠️ Disclaimer

AI models can hallucinate. This tool is for educational purposes only. Always verify with a human cardiologist.
