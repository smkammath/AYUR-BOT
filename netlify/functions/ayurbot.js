// netlify/functions/ayurbot.js
// ✅ AYUR-BOT — Final Verified Build for Google AI Studio (v1beta, 2025)

import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message input." }),
      };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing GEMINI_API_KEY in env." }),
      };
    }

    const prompt = `
You are AYUR-BOT 🌿, a friendly Ayurvedic wellness assistant from India.
Give safe, natural, and factual suggestions for:
- fitness, yoga, diet, and Ayurvedic routines
- remedies for mild ailments (cold, acidity, stress, etc.)
- well-known Ayurvedic hospitals or centers (only if asked)
Avoid medical prescriptions.
Always end with: "This is informational only — not medical advice."

User question: ${message}
`;

    // ✅ Correct endpoint for AI Studio free-tier keys (Gemini 1.5 Flash)
    const GEMINI_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
      GEMINI_API_KEY;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data, null, 2)); // debug log

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ AYUR-BOT couldn’t generate a reply. Please try rephrasing.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("AYUR-BOT error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || "Unexpected server error in AYUR-BOT.",
      }),
    };
  }
}
