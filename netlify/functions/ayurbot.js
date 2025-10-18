// netlify/functions/ayurbot.js
// ✅ 100% working OpenRouter + Netlify (Final Version)

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

    // ✅ Working free model
    const model = "mistralai/mistral-7b-instruct:free";

    const systemPrompt = `
You are AYURFIT-BOT 🌿 — a warm, friendly Ayurvedic wellness guide.
Provide clear, informative, and compassionate responses on:
- Ayurveda, yoga, diet, meditation
- Mild ailments like acidity, cough, cold, stress
- Ayurvedic centers in India (only if asked)
Always end with: "🌿 This is informational only — not medical advice."
Keep replies under 150 words.
`;

    const payload = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    };

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        // ✅ Corrected OpenRouter headers
        "HTTP-Referer": "https://ayurfit-bot.netlify.app",
        "X-Title": "AYURFIT-BOT",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("OpenRouter raw response:", JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          reply:
            "⚠️ Could not generate a reply. Please check if your OpenRouter API key is valid or the model is accessible.",
        }),
      };
    }

    const reply = data.choices[0].message.content;

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
