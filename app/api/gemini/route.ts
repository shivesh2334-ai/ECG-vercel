import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // The Gemini API key lives server-side only, in the GEMINI_API_KEY
    // environment variable (set it in Vercel: Project Settings -> Environment
    // Variables). It is never sent to or read from the browser.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        text: "Error: GEMINI_API_KEY is not configured on the server. Add it in your Vercel project's Environment Variables.",
      });
    }

    const { prompt, fileBase64, mimeType } = await req.json();

    if (!fileBase64 || !prompt) {
      return NextResponse.json({ text: "Error: Missing ECG file or prompt." });
    }

    const client = new GoogleGenAI({ apiKey });

    // Gemini accepts both images (image/png, image/jpeg) and PDF documents
    // (application/pdf) as inline data on the same "generateContent" call —
    // same model, same call shape as before.
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType || "image/png",
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
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ text: `Error: ${message}` });
  }
}
