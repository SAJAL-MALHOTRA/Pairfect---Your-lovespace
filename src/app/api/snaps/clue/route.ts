import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST() {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const prompt = `Generate one short, playful scavenger hunt clue for a couple to find something 
in their home within 90 seconds. Keep it vague and fun, e.g. "something big 
but blue" or "something you'd hide under the bed" or "something older than you". 
Respond with just the clue text, nothing else. Do not wrap in quotes or markdown.`;

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const response = await model.generateContent(prompt);
    const textOutput = response.response.text().trim();

    return NextResponse.json({ success: true, clue: textOutput });
  } catch (err: any) {
    console.error("Clue Generation Error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate clue" }, { status: 500 });
  }
}
