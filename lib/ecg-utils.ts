// Direct port of the original Streamlit app's calculation functions.
// Logic is preserved exactly — only the language changed (Python -> TypeScript).

/** Calculates QTc using Bazett's Formula. Mirrors calculate_qtc() in app.py */
export function calculateQtc(qtIntervalMs: number, heartRate: number): number {
  if (heartRate <= 0) return 0;
  const rrIntervalSec = 60 / heartRate;
  // qtIntervalMs is already in ms in this port; Bazett's formula needs QT in the
  // same convention as the original (QT / sqrt(RR)), RR in seconds.
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

export interface EcgFindings {
  clinicalContext: string;
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

/** Mirrors the structured prompt built in app.py's main() before calling Gemini */
export function buildDiagnosisPrompt(findings: EcgFindings): string {
  return `You are an expert Consultant Cardiologist.

I have performed a manual analysis of the attached ECG image and recorded the following findings.

Patient Clinical Context: ${findings.clinicalContext}

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
1. VISUAL VERIFICATION: Look at the image. Do my manual findings (Rate, Axis, ST changes) look accurate? Correct me if I am wrong.
2. DIAGNOSIS: Based on the image and the confirmed metrics, provide a formal ECG diagnosis.
3. CLINICAL RELEVANCE: Explain the significance of these findings given the clinical context.
4. NEXT STEPS: Suggest immediate management or further tests.`;
}
