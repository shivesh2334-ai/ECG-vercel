# 🫀 Systematic ECG Interpretation Tool

A guided, step-by-step ECG analysis application built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**, deployable on **Vercel**.

This tool digitizes the "Final Checklist for ECG Interpretation" workflow, letting clinicians and students upload an ECG image, work through standard clinical calculations (Rate, Axis, QTc), and then cross-check their manual findings against a **Gemini AI** consultation.

> This is a Next.js port of the original Streamlit app. All calculation logic (QTc via Bazett's Formula, heart-rate derivation, axis determination) and the Gemini LLM call (same model, same structured prompt) are preserved unchanged — see `lib/ecg-utils.ts` and `app/api/gemini/route.ts`.

## 🚀 Features

- **Image Upload:** JPG/PNG ECG images.
- **Smart Rate Calculation:** Regular rhythm (300/large-squares method) or irregular rhythm (6-second strip method).
- **Axis Determination:** Automated logic based on Leads I and aVF (Normal / RAD / Extreme deviation / possible LAD).
- **Interval Converter:** Small-square (mm) inputs auto-convert to milliseconds at 25 mm/s paper speed.
- **QTc Calculator:** Bazett's Formula, $QTc = QT / \sqrt{RR}$.
- **AI Cardiologist Consultation:** Sends the image + your structured findings to Gemini for visual verification, diagnosis, clinical relevance, and next steps.

## 🛠️ Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000 after setting the Gemini API key via environment variable.

Create a `.env.local` file and set:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

## ☁️ Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New Project** → import `GEMINI-ECG--ANALYSIS`.
3. Framework preset: **Next.js** (auto-detected). Add `GEMINI_API_KEY` in Vercel Project Settings → Environment Variables.
4. Deploy. `vercel.json` pins the deployment region to Mumbai (`bom1`).

## 📁 Project structure

```
app/
  page.tsx           # Full UI: upload, manual checklist (Steps 0-8), AI consultation (Step 9)
  api/gemini/route.ts # Server route — the LLM layer (Gemini call), logic unchanged from app.py
  layout.tsx
  globals.css
lib/
  ecg-utils.ts        # calculateQtc, calculateHeartRate, determineAxis, prompt builder
```

## ⚠️ Disclaimer

AI models can hallucinate. This tool is for educational purposes only. Always verify with a human cardiologist.
