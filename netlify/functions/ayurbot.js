// netlify/functions/ayurbot.js
// ✅ AYUR-BOT — Google Gemini REST API version (for Maps/AI Studio keys)

import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message" }),
      };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing GEMINI_API_KEY" }),
      };
    }

    const prompt = `
You are AYUR-BOT 🌿, an Ayurvedic wellness assistant from India.
Offer safe, traditional, and practical suggestions related to:
- daily fitness, yoga, and diet
- Ayurvedic remedies for mild conditions (cold, acidity, stress, etc.)
- names of known Ayurvedic hospitals or centers if asked
Never prescribe medicine. Always end with:
"This is informational only — not medical advice."

User question: ${message}
`;

    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateText?key=${GEMINI_API_KEY}`;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: {
          text: prompt,
        },
        temperature: 0.7,
        maxOutputTokens: 256,
      }),
    });

    const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data, null, 2));

    const reply =
      data?.candidates?.[0]?.output || // REST structure
      data?.candidates?.[0]?.content?.parts?.[0]?.text || // fallback
      "⚠️ No reply generated — check API quota or project permissions.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("AYUR-BOT error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
