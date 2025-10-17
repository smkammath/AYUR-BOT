// netlify/functions/ayurbot.js
// AYUR-BOT — Google Gemini AI Studio (Final, verified 2025 build)

import fetch from "node-fetch"; // Force server-side fetch import

export async function handler(event) {
  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message." }),
      };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing GEMINI_API_KEY in env." }),
      };
    }

    // 🌿 Prompt template
    const prompt = `
You are AYUR-BOT 🌿, an Indian Ayurvedic wellness guide.
Respond with practical, factual suggestions about:
• Daily fitness, diet, yoga and Ayurvedic lifestyle
• Home remedies for mild issues (like acidity, cold, sleep)
• Mention respected Indian Ayurvedic centers if asked
Never prescribe medicine. Always end with:
"This is informational only — not medical advice."

User question: ${message}
`;

    // ✅ Tested endpoint for AI Studio keys
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    // 🧩 Handle all errors cleanly
    if (!response.ok) {
      const text = await response.text();
      console.error("Gemini error:", response.status, text);
      let msg =
        response.status === 404
          ? "Gemini endpoint not found. Verify you're using AI Studio (makersuite) key and v1beta URL."
          : response.status === 429
          ? "Gemini rate limit hit. Please try again soon."
          : `Gemini API failed (${response.status}).`;
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: `⚠️ ${msg}` }),
      };
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "No reply generated.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("AYUR-BOT runtime error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Unknown error" }),
    };
  }
}
