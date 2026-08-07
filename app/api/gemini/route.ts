import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

// This route is a direct port of get_gemini_response() from the original
// Streamlit app.py. Same model, same request shape (text + inline image),
// same error-handling contract: callers always get a text string back,
// never a thrown exception.
export async function POST(req: NextRequest) {
  try {
    const { apiKey, prompt, imageBase64, mimeType } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ text: "Error: Missing Gemini API key." });
    }
    if (!imageBase64 || !prompt) {
      return NextResponse.json({ text: "Error: Missing image or prompt." });
    }

    const client = new GoogleGenAI({ apiKey });

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType || "image/png",
                data: imageBase64,
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
