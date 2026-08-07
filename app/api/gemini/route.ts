import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

// The Gemini API key lives server-side only, in the GEMINI_API_KEY
// environment variable (set it in Vercel: Project Settings -> Environment
// Variables). It is never sent to or read from the browser.
// .trim() guards against a stray trailing newline/space, which is a common
// artifact of copy-pasting a key into an env var UI and can cause opaque
// "invalid value" errors from the Gemini API.
const apiKey = process.env.GEMINI_API_KEY?.trim();

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({
        text: "Error: GEMINI_API_KEY is not configured on the server. Add it in your Vercel project's Environment Variables, then redeploy.",
      });
    }

    const { prompt, fileBase64, mimeType } = await req.json();

    if (!fileBase64 || !prompt) {
      return NextResponse.json({ text: "Error: Missing ECG file or prompt." });
    }
    if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json({
        text: `Error: Unsupported file type "${mimeType}". Please upload a PDF, JPG, or JPEG.`,
      });
    }

    const client = new GoogleGenAI({ apiKey });

    // Gemini accepts both images (image/jpeg, image/png) and PDF documents
    // (application/pdf) as inline data on the same "generateContent" call —
    // same model, same call shape as before.
    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: fileBase64,
              },
            },
          ],
        },
      ],
    });

    const text = response.text ?? "No response text returned.";
    return NextResponse.json({ text });
  } catch (err) {
    // Log the full error server-side (visible in Vercel's function logs)
    // while returning a clearer, still-safe message to the client.
    console.error("Gemini API route error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ text: `Error: ${message}` });
  }
}
