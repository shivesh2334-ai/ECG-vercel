// Calculation helpers ported from the original Streamlit app's
// calculate_qtc() and axis logic. Formulas unchanged.

/** Calculates QTc using Bazett's Formula. Mirrors calculate_qtc() in app.py */
export function calculateQtc(qtIntervalMs: number, heartRate: number): number {
  if (heartRate <= 0) return 0;
  const rrIntervalSec = 60 / heartRate;
  return qtIntervalMs / Math.sqrt(rrIntervalSec);
}

export type RhythmType = "Regular" | "Irregular";

/** Mirrors the Step 1 & 2 heart-rate calculation branch in app.py */
export function calculateHeartRate(
  rhythmType: RhythmType,
  rrSmallSquares: number,
  qrsCountIn30LargeSquares: number
): number {
  if (rhythmType === "Regular") {
    return 1500 / rrSmallSquares;
  }
  return qrsCountIn30LargeSquares * 10;
}

export type LeadPolarity = "Positive" | "Negative";

/** Mirrors the Step 6 axis-determination logic in app.py exactly */
export function determineAxis(leadI: LeadPolarity, leadAVF: LeadPolarity): string {
  if (leadI === "Positive" && leadAVF === "Positive") return "Normal Axis";
  if (leadI === "Negative" && leadAVF === "Positive") return "Right Axis Deviation (RAD)";
  if (leadI === "Negative" && leadAVF === "Negative") return "Extreme Axis Deviation";
  if (leadI === "Positive" && leadAVF === "Negative") return "Possible LAD (Check Lead II)";
  return "Indeterminate";
}

/** Mirrors PR interval conversion: small squares * 40ms (25mm/s paper speed) */
export function smallSquaresToMs(smallSquares: number): number {
  return smallSquares * 40;
}

export interface PatientInfo {
  age: string;
  sex: string;
  clinicalBackground: string;
}

export function formatPatientContext(patient: PatientInfo): string {
  const parts = [
    patient.age ? `${patient.age} years old` : null,
    patient.sex || null,
  ].filter(Boolean);
  const demo = parts.length ? parts.join(", ") : "Not specified";
  return `Age/Sex: ${demo}\nClinical Background: ${patient.clinicalBackground || "Not provided"}`;
}

export interface EcgFindings {
  calibration: string;
  rhythm: RhythmType;
  heartRate: string;
  pWaves: string;
  prInterval: string;
  qrsDuration: string;
  axis: string;
  stChanges: string;
  qtc: string;
}

/** Manual-mode prompt: cross-checks the clinician's own measurements against the image. */
export function buildManualDiagnosisPrompt(patient: PatientInfo, findings: EcgFindings): string {
  return `You are an expert Consultant Cardiologist.

I have performed a manual analysis of the attached ECG and recorded the following findings.

${formatPatientContext(patient)}

My Manual Findings:
- Rate: ${findings.heartRate}
- Rhythm: ${findings.rhythm}
- P Waves: ${findings.pWaves}
- PR Interval: ${findings.prInterval}
- QRS Duration: ${findings.qrsDuration}
- Axis: ${findings.axis}
- ST/T Changes: ${findings.stChanges}
- QTc: ${findings.qtc}

Please perform the following:
1. VISUAL VERIFICATION: Look at the ECG. Do my manual findings (Rate, Axis, ST changes) look accurate? Correct me if I am wrong.
2. DIAGNOSIS: Based on the ECG and the confirmed metrics, provide a formal ECG diagnosis.
3. CLINICAL RELEVANCE: Explain the significance of these findings given the clinical context.
4. NEXT STEPS: Suggest immediate management or further tests.`;
}

/** Automated-mode prompt: Gemini performs the full systematic interpretation itself. */
export function buildAutomatedDiagnosisPrompt(patient: PatientInfo): string {
  return `You are an expert Consultant Cardiologist performing a systematic ECG interpretation.

${formatPatientContext(patient)}

Analyze the attached ECG (image or scanned/printed PDF report) and work through the standard systematic checklist yourself:
1. CALIBRATION: Note the paper speed/calibration if visible.
2. RATE & RHYTHM: Determine heart rate and rhythm (regular/irregular, sinus or otherwise).
3. P WAVES: Describe morphology and their relationship to QRS complexes.
4. PR INTERVAL: Estimate in milliseconds and flag if abnormal.
5. QRS DURATION: Estimate in milliseconds and flag if abnormal (narrow/wide).
6. AXIS: Determine the frontal plane axis (normal, LAD, RAD, extreme deviation).
7. ST/T CHANGES: Note any elevation, depression, T wave inversion, or peaked T waves, with leads involved.
8. QT/QTc: Estimate and comment on correction using Bazett's Formula.

Then provide:
9. FORMAL DIAGNOSIS: A complete ECG diagnosis based on all the above.
10. CLINICAL RELEVANCE: Explain the significance of these findings given the clinical context provided.
11. NEXT STEPS: Suggest immediate management or further tests.

Present your findings as a clearly labeled step-by-step report followed by the diagnosis, clinical relevance, and next steps.`;
}
