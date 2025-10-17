// netlify/functions/ayurbot.js
// AYUR-BOT — Gemini API (corrected endpoint, Node.js CommonJS)

async function handler(event) {
  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message" })
      };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Missing GEMINI_API_KEY in environment variables."
        })
      };
    }

    // 🧘 AYUR-BOT instruction
    const prompt = `
You are AYUR-BOT 🌿, an Indian Ayurvedic wellness assistant.
Give safe, factual, and culturally relevant advice about:
- fitness, yoga, and diet
- herbal & Ayurvedic treatments (like Panchakarma, Shirodhara)
- traditional Indian wellness routines
Never give medical prescriptions.
Always end with: "This is informational only — not medical advice."

User: ${message}
`;

    // ✅ CORRECT GEMINI ENDPOINT
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    // ❌ Handle API errors
    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);

      if (response.status === 429) {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reply:
              "⚠️ Too many requests right now. Please try again shortly. Meanwhile, sip warm water with honey and lemon to stay balanced."
          })
        };
      }

      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No reply generated.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.error("AYUR-BOT error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || "Something went wrong with AYUR-BOT."
      })
    };
  }
}

module.exports = { handler };
