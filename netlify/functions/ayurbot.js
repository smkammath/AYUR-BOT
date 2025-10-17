// netlify/functions/ayurbot.js
// AYUR-BOT (Google Gemini — final working version for Netlify Functions)
// Uses the public Gemini API (AI Studio key, not Vertex)

// ✅ Node 18+ and CommonJS compatible

async function handler(event) {
  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message input." })
      };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "GEMINI_API_KEY missing in environment variables." })
      };
    }

    // 🌿 AyurBot’s instruction set
    const prompt = `
You are AYUR-BOT 🌿, an intelligent Ayurvedic wellness assistant.
Provide fact-based, culturally relevant suggestions for:
- Ayurvedic treatments, diet, yoga, lifestyle
- Remedies for common issues (like acidity, stress, sleep)
- Herbal approaches and Indian therapy names
- Mention hospitals or centers only if they’re reputable.
Never give strict prescriptions or medical advice.
Always end replies with: "This is informational only — not medical advice."

User question: ${message}
`;

    // ✅ Correct public Gemini endpoint (for MakerSuite / AI Studio keys)
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "No reply generated.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    console.error("AYUR-BOT error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Unexpected error in AYUR-BOT" })
    };
  }
}

module.exports = { handler };
