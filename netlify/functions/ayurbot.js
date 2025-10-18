// netlify/functions/ayurbot.js
// ✅ FINAL FIXED VERSION — AYURFIT-BOT with OpenRouter

import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message)
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing user input" }),
      };

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing OpenRouter API key" }),
      };

    const prompt = `
You are AYURFIT-BOT 🌿 — an Ayurvedic wellness assistant.
Respond with accurate, empathetic, and calm advice about:
- Daily fitness, yoga, and meditation.
- Ayurvedic remedies for mild ailments like acidity, cough, cold, fatigue, etc.
- List popular Ayurvedic treatment centers in India *only if asked*.
End with: "This is informational only — not medical advice."

User asked: ${message}
`;

    // ✅ Use a universally available model (fast + stable)
    const model = "gpt-3.5-turbo"; // change to "mistralai/mistral-7b" or "google/gemini-1.5-flash" if you prefer

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // These two headers are *required* by OpenRouter:
        "HTTP-Referer": "https://ayurfit-bot.netlify.app",
        "X-Title": "AYURFIT-BOT",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a knowledgeable Ayurvedic assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();
    console.log("OpenRouter response:", JSON.stringify(data, null, 2));

    // ✅ Extract a safe reply
    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.error?.message ||
      "⚠️ No reply generated. Check model name or API key.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("AYURFIT-BOT ERROR:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
