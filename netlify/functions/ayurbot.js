// netlify/functions/ayurbot.js
// 🌿 AYURFIT-BOT — Integrated Local Ayurveda + OpenRouter AI

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

exports.handler = async function (event) {
  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing user input" }),
      };
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }),
      };
    }

    // 🌿 Local Ayurvedic dataset for Indian accuracy
    const localAyurvedaData = {
      acidity: {
        herbs: ["Triphala", "Amla", "Licorice (Yashtimadhu)"],
        diet: "Avoid spicy, fried foods. Eat warm, light meals with ghee, rice, and moong dal.",
        yoga: ["Vajrasana", "Pavanamuktasana", "Bhujangasana"],
      },
      cold: {
        herbs: ["Tulsi", "Ginger", "Black Pepper", "Turmeric"],
        diet: "Drink warm water, soups, and herbal tea with honey. Avoid cold or sour foods.",
        yoga: ["Anulom Vilom", "Kapalbhati Pranayama"],
      },
      "joint pain": {
        herbs: ["Ashwagandha", "Shallaki", "Turmeric", "Guggul"],
        diet: "Take warm milk with turmeric; avoid cold and sour items.",
        yoga: ["Trikonasana", "Ardha Matsyendrasana", "Vrikshasana"],
      },
    };

    const lowerMsg = message.toLowerCase();
    const match = Object.keys(localAyurvedaData).find(k => lowerMsg.includes(k));

    // ✅ If the question matches local data, return that instantly
    if (match) {
      const info = localAyurvedaData[match];
      const reply = `
🪷 Ayurvedic Suggestions for **${match.toUpperCase()}**:
🌿 **Herbs:** ${info.herbs.join(", ")}  
🥗 **Diet:** ${info.diet}  
🧘 **Yoga:** ${info.yoga.join(", ")}  

This is informational only — not medical advice.
`;
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply }),
      };
    }

    // 🧠 If no local match, fallback to OpenRouter AI
    const systemPrompt = `
You are AYURFIT-BOT 🌿 — an Ayurvedic wellness assistant. 
Provide calm, factual advice about Ayurveda, diet, yoga, and herbal remedies. 
Always end with: "This is informational only — not medical advice."
`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ayurfit-bot.netlify.app",
        "X-Title": "AYURFIT-BOT",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free", // ✅ stable free model
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
      "⚠️ No reply generated. Please check your API setup.";

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
