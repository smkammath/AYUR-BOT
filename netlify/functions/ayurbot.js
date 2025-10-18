// netlify/functions/ayurbot.js
// ✅ AYUR-BOT 🌿 powered by OpenRouter (instant & free-tier friendly)

import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message)
      return { statusCode: 400, body: JSON.stringify({ error: "Missing message" }) };

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY)
      return { statusCode: 500, body: JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }) };

    const prompt = `
You are AYUR-BOT 🌿 — a friendly Ayurvedic wellness guide.
Provide factual, safe, and respectful information about:
• Yoga, diet, and daily fitness
• Common Ayurvedic remedies for mild issues (cold, acidity, stress)
• Names of well-known Ayurvedic hospitals or centers (India)
Never prescribe drugs. End every answer with:
"This is informational only — not medical advice."

User question: ${message}
`;

    // 💡 Choose any OpenRouter model you prefer
    const model = "google/gemini-1.5-flash"; // or "openai/gpt-3.5-turbo", "anthropic/claude-3-haiku"

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ayurvidhya.netlify.app", // optional but recommended
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a helpful Ayurvedic wellness assistant." },
          { role: "user", content: prompt }
        ],
      }),
    });

    const data = await res.json();
    console.log("OpenRouter response:", JSON.stringify(data, null, 2));

    const reply =
      data?.choices?.[0]?.message?.content ||
      "⚠️ No reply generated — please try again.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("AYUR-BOT error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
