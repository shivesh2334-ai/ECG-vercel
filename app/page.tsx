"use client";

import { useMemo, useState } from "react";
import {
  calculateHeartRate,
  calculateQtc,
  determineAxis,
  smallSquaresToMs,
  buildDiagnosisPrompt,
  type RhythmType,
  type LeadPolarity,
} from "@/lib/ecg-utils";

const P_WAVE_OPTIONS = [
  "Sinus (Upright I, II, aVF)",
  "Absent",
  "Inverted",
  "Sawtooth Pattern",
  "P > QRS Count",
];

const ST_CHANGE_OPTIONS = [
  "None",
  "ST Elevation",
  "ST Depression",
  "T Wave Inversion",
  "Peaked T Waves",
];

function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(",");
      const mimeType = header.match(/data:(.*);base64/)?.[1] || file.type || "image/png";
      resolve({ data, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  // --- Sidebar / configuration state ---
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [clinicalContext, setClinicalContext] = useState("");

  // --- Step 0: Calibration ---
  const [calibration, setCalibration] = useState(true);

  // --- Step 1 & 2: Rate & Rhythm ---
  const [rhythmType, setRhythmType] = useState<RhythmType>("Regular");
  const [rrSmallSquares, setRrSmallSquares] = useState(20.0);
  const [qrsCount30, setQrsCount30] = useState(7);

  // --- Step 3: P Waves ---
  const [pWaveMorphology, setPWaveMorphology] = useState(P_WAVE_OPTIONS[0]);

  // --- Step 4: PR Interval ---
  const [prSmallSquares, setPrSmallSquares] = useState(4.0);

  // --- Step 5: QRS Duration ---
  const [qrsSmallSquares, setQrsSmallSquares] = useState(2.0);

  // --- Step 6: Axis ---
  const [leadI, setLeadI] = useState<LeadPolarity>("Positive");
  const [leadAVF, setLeadAVF] = useState<LeadPolarity>("Positive");

  // --- Step 7: ST/T Changes ---
  const [stChanges, setStChanges] = useState<string[]>([]);

  // --- Step 8: QT/QTc ---
  const [qtSmallSquares, setQtSmallSquares] = useState(9.0);

  // --- Step 9: AI consultation ---
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const heartRate = useMemo(
    () => calculateHeartRate(rhythmType, rrSmallSquares, qrsCount30),
    [rhythmType, rrSmallSquares, qrsCount30]
  );
  const prMs = useMemo(() => smallSquaresToMs(prSmallSquares), [prSmallSquares]);
  const qrsMs = useMemo(() => smallSquaresToMs(qrsSmallSquares), [qrsSmallSquares]);
  const qtMs = useMemo(() => smallSquaresToMs(qtSmallSquares), [qtSmallSquares]);
  const axisResult = useMemo(() => determineAxis(leadI, leadAVF), [leadI, leadAVF]);
  const qtc = useMemo(() => calculateQtc(qtMs, heartRate), [qtMs, heartRate]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setAiResponse(null);
    const { data } = await fileToBase64(file);
    setImagePreview(`data:${file.type};base64,${data}`);
  }

  function toggleStChange(option: string) {
    setStChanges((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  }

  async function handleGenerateDiagnosis() {
    if (!imageFile) return;
    setLoading(true);
    setAiResponse(null);
    try {
      const { data, mimeType } = await fileToBase64(imageFile);
      const prompt = buildDiagnosisPrompt({
        clinicalContext,
        calibration: calibration ? "Standard" : "Non-Standard",
        rhythm: rhythmType,
        heartRate: `${Math.trunc(heartRate)} bpm`,
        pWaves: pWaveMorphology,
        prInterval: `${Math.trunc(prMs)} ms`,
        qrsDuration: `${Math.trunc(qrsMs)} ms`,
        axis: axisResult,
        stChanges: stChanges.length ? stChanges.join(", ") : "None/Normal",
        qtc: `${Math.trunc(qtc)} ms`,
      });

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, imageBase64: data, mimeType }),
      });
      const json = await res.json();
      setAiResponse(json.text);
    } catch (err) {
      setAiResponse(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="text-center text-3xl font-bold text-clinical-red">
            🫀 Systematic ECG Interpretation + AI
          </h1>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_1fr]">
        {/* --- Sidebar --- */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              1. Upload ECG
            </h2>
            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={handleUpload}
              className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-clinical-blue file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
            />
            <label className="mb-1 mt-4 block text-sm font-medium text-slate-700">
              Patient Clinical Context
            </label>
            <textarea
              value={clinicalContext}
              onChange={(e) => setClinicalContext(e.target.value)}
              placeholder="e.g., 55M, Chest pain, History of HTN"
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-clinical-blue focus:outline-none focus:ring-1 focus:ring-clinical-blue"
            />
          </section>
        </aside>

        {/* --- Main content --- */}
        <main>
          {!imagePreview ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              Please upload an ECG image to begin the analysis.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_1.5fr]">
              {/* Image column */}
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Uploaded ECG"
                  className="w-full rounded-lg border border-slate-200"
                />
                <div className="mt-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                  Image Loaded Successfully
                </div>
              </div>

              {/* Findings column */}
              <div>
                <h3 className="mb-3 text-lg font-semibold">📝 Manual Findings Checklist</h3>

                <div className="space-y-5">
                  {/* Step 0 */}
                  <div>
                    <p className="mb-1 font-semibold">Step 0: Calibration</p>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={calibration}
                        onChange={(e) => setCalibration(e.target.checked)}
                      />
                      Standard Calibration (25mm/s, 10mm/mV)
                    </label>
                  </div>

                  {/* Step 1 & 2 */}
                  <div>
                    <p className="mb-1 font-semibold">Step 1 &amp; 2: Rate &amp; Rhythm</p>
                    <div className="mb-2 flex gap-4 text-sm">
                      {(["Regular", "Irregular"] as RhythmType[]).map((opt) => (
                        <label key={opt} className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="rhythm"
                            checked={rhythmType === opt}
                            onChange={() => setRhythmType(opt)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                    {rhythmType === "Regular" ? (
                      <label className="block text-sm">
                        Small squares between R-R:
                        <input
                          type="number"
                          step={0.5}
                          value={rrSmallSquares}
                          onChange={(e) => setRrSmallSquares(Number(e.target.value))}
                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                        />
                      </label>
                    ) : (
                      <label className="block text-sm">
                        QRS count in 30 large squares:
                        <input
                          type="number"
                          step={1}
                          value={qrsCount30}
                          onChange={(e) => setQrsCount30(Number(e.target.value))}
                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                        />
                      </label>
                    )}
                    <p className="mt-1 text-sm">
                      Calculated HR: <strong>{Math.trunc(heartRate)} bpm</strong>
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div>
                    <p className="mb-1 font-semibold">Step 3: P Waves</p>
                    <select
                      value={pWaveMorphology}
                      onChange={(e) => setPWaveMorphology(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                    >
                      {P_WAVE_OPTIONS.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Step 4 */}
                  <div>
                    <p className="mb-1 font-semibold">Step 4: PR Interval</p>
                    <label className="block text-sm">
                      PR small squares:
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={prSmallSquares}
                        onChange={(e) => setPrSmallSquares(Number(e.target.value))}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </label>
                    <p className="mt-1 text-sm">PR Interval: {Math.trunc(prMs)} ms</p>
                  </div>

                  {/* Step 5 */}
                  <div>
                    <p className="mb-1 font-semibold">Step 5: QRS Duration</p>
                    <label className="block text-sm">
                      QRS small squares:
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={qrsSmallSquares}
                        onChange={(e) => setQrsSmallSquares(Number(e.target.value))}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </label>
                    <p className="mt-1 text-sm">QRS Duration: {Math.trunc(qrsMs)} ms</p>
                  </div>

                  {/* Step 6 */}
                  <div>
                    <p className="mb-1 font-semibold">Step 6: Axis</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="mb-1 text-slate-600">Lead I:</p>
                        {(["Positive", "Negative"] as LeadPolarity[]).map((opt) => (
                          <label key={opt} className="mr-3 inline-flex items-center gap-1">
                            <input
                              type="radio"
                              name="leadI"
                              checked={leadI === opt}
                              onChange={() => setLeadI(opt)}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                      <div>
                        <p className="mb-1 text-slate-600">Lead aVF:</p>
                        {(["Positive", "Negative"] as LeadPolarity[]).map((opt) => (
                          <label key={opt} className="mr-3 inline-flex items-center gap-1">
                            <input
                              type="radio"
                              name="leadAVF"
                              checked={leadAVF === opt}
                              onChange={() => setLeadAVF(opt)}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-sm">
                      Axis: <strong>{axisResult}</strong>
                    </p>
                  </div>

                  {/* Step 7 */}
                  <div>
                    <p className="mb-1 font-semibold">Step 7: ST &amp; T Waves</p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      {ST_CHANGE_OPTIONS.map((opt) => (
                        <label key={opt} className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={stChanges.includes(opt)}
                            onChange={() => toggleStChange(opt)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Step 8 */}
                  <div>
                    <p className="mb-1 font-semibold">Step 8: QT Interval</p>
                    <label className="block text-sm">
                      QT small squares:
                      <input
                        type="number"
                        min={1}
                        step={0.5}
                        value={qtSmallSquares}
                        onChange={(e) => setQtSmallSquares(Number(e.target.value))}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </label>
                    <p className="mt-1 text-sm">
                      Calculated QTc: <strong>{Math.trunc(qtc)} ms</strong>
                    </p>
                  </div>
                </div>

                <hr className="my-6 border-slate-200" />

                {/* Step 9 */}
                <h3 className="mb-2 text-lg font-bold text-clinical-blue">
                  Step 9: AI Cardiologist Consultation
                </h3>
                <div className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  The AI will analyze the image and cross-reference it with your manual findings above.
                </div>

                <button
                  onClick={handleGenerateDiagnosis}
                  disabled={!imageFile || loading}
                  className="rounded-md bg-clinical-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? "Analyzing ECG Image + User Data..." : "Generate Diagnosis with Gemini 🤖"}
                </button>

                {aiResponse && (
                  <div className="mt-4 rounded-lg border border-clinical-purple bg-clinical-purplebg p-4">
                    <h4 className="mb-2 font-semibold">🤖 Gemini AI Report</h4>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiResponse}</div>
                  </div>
                )}

                <div className="mt-6 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  DISCLAIMER: AI models can hallucinate. This tool is for educational purposes only.
                  Always verify with a human cardiologist.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
