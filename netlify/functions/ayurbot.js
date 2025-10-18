// netlify/functions/ayurbot.js
// ✅ Compatible with Netlify CommonJS runtime + OpenRouter

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

exports.handler = async function (event) {
  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message" }),
      };
    }

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }),
      };
    }

    const model = "mistralai/mistral-7b-instruct:free";
    const systemPrompt = `
You are AYURFIT-BOT 🌿 — an Ayurvedic wellness guide.
Provide calm, factual, and safe responses on:
- Ayurveda, yoga, diet, meditation
- Mild ailments like acidity, cough, stress
- Ayurvedic centers in India (only if asked)
Always end replies with: "This is informational only — not medical advice."
`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ayurfit-bot.netlify.app", // Required by OpenRouter
        "X-Title": "AYURFIT-BOT",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await res.json();
    console.log("OpenRouter API response:", JSON.stringify(data, null, 2));

    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.error?.message ||
      "⚠️ No reply generated. Check your API key or model.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("AYURFIT-BOT Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
