// netlify/functions/ayurbot.js
// AYUR-BOT (Final Gemini AI Studio Version)
// ✅ Tested for keys created in Google AI Studio (https://aistudio.google.com)

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
        body: JSON.stringify({
          error: "GEMINI_API_KEY missing in environment variables."
        })
      };
    }

    // 🌿 AyurBot system prompt
    const prompt = `
You are AYUR-BOT 🌿, an intelligent Ayurvedic wellness assistant from India.
Your role:
- Suggest safe Ayurvedic and natural remedies for daily health issues.
- Share yoga, diet, and lifestyle guidance.
- Mention Indian Ayurvedic hospitals or treatment centers (if asked).
- Never provide prescriptions or medical treatment plans.
Always end with: "This is informational only — not medical advice."

User question: ${message}
`;

    // ✅ Correct endpoint for AI Studio keys (v1beta)
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    // ❌ Handle API errors gracefully
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);

      if (response.status === 429) {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reply:
              "⚠️ Too many requests to the Gemini server right now. Please wait a bit and try again. Meanwhile, try sipping warm cumin water to calm your system."
          })
        };
      }

      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No reply generated.";

    // ✅ Return AI reply
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    console.error("AYUR-BOT error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Unexpected error in AYUR-BOT"
      })
    };
  }
}

module.exports = { handler };
