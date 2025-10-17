// netlify/functions/ayurbot.js
// AYUR-BOT (Gemini API version)
// Compatible with Netlify Functions (Node.js CommonJS runtime)

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

    // 🧘 AYUR-BOT system prompt
    const prompt = `
You are AYUR-BOT 🌿, an Ayurvedic wellness assistant from India.
Provide safe, factual, and culturally relevant responses about:
- fitness, yoga, diet, lifestyle
- Ayurvedic treatments (like Panchakarma, Shirodhara)
- natural remedies using Indian herbs and spices
- names of reputable Ayurvedic hospitals or therapy centers (if asked)
Always end with: "This is informational only — not medical advice."

User question: ${message}
`;

    // 🔮 Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
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
      }
    );

    // ❌ Handle Gemini errors gracefully
    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);

      if (response.status === 429) {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reply:
              "⚠️ AYUR-BOT is handling too many requests right now. Please wait a minute and try again. Meanwhile, simple Ayurvedic tip: sip warm turmeric water to soothe your body."
          })
        };
      }

      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No reply generated.";

    // ✅ Return AI reply to frontend
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
        error: err.message || "Something went wrong in AYUR-BOT."
      })
    };
  }
}

module.exports = { handler };
