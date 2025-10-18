// AYUR VIDHYA 🌿 Intelligent Ayurvedic Bot
// Fix: Stable local-first + API fallback + cleaner error messaging

const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

exports.handler = async function (event) {
  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing user message" }) };
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing API key" }) };
    }

    const text = message.toLowerCase();

    // 🌿 Local Ayurveda Data
    const remedies = {
      stress: { herbs: ["Ashwagandha", "Brahmi"], yoga: ["Shavasana"], diet: "Avoid caffeine. Include dates & milk." },
      acidity: { herbs: ["Amla", "Triphala"], yoga: ["Vajrasana"], diet: "Avoid spicy food. Eat small light meals." },
      cold: { herbs: ["Tulsi", "Ginger"], yoga: ["Kapalbhati"], diet: "Drink warm herbal tea with honey." },
      "joint pain": { herbs: ["Guggul", "Turmeric"], yoga: ["Trikonasana"], diet: "Include turmeric milk daily." },
      headache: { herbs: ["Peppermint oil", "Brahmi"], yoga: ["Balasana"], diet: "Stay hydrated. Avoid screen strain." },
    };

    const match = Object.keys(remedies).find(k => text.includes(k));
    if (match) {
      const info = remedies[match];
      return {
        statusCode: 200,
        body: JSON.stringify({
          reply: `🌿 **Ayurvedic Remedies for ${match.toUpperCase()}**  
🪷 Herbs: ${info.herbs.join(", ")}  
🧘 Yoga: ${info.yoga.join(", ")}  
🥗 Diet: ${info.diet}  
✨ Stay balanced and peaceful. (Informational only — not medical advice.)`,
        }),
      };
    }

    // 🧘 Call OpenRouter
    async function openRouterCall(model) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://myayurveda.netlify.app",
          "X-Title": "AYUR VIDHYA",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are AYUR VIDHYA, a calm Ayurvedic wellness guide. Offer balanced tips on herbs, diet, and yoga. Always add: 'This is informational only — not medical advice.'",
            },
            { role: "user", content: message },
          ],
        }),
      });

      if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
      const data = await res.json();
      return data?.choices?.[0]?.message?.content;
    }

    try {
      const gpt = await openRouterCall("gpt-3.5-turbo");
      if (gpt) return { statusCode: 200, body: JSON.stringify({ reply: gpt }) };
    } catch (e) {
      console.warn("GPT-3.5 failed:", e.message);
    }

    try {
      const mistral = await openRouterCall("mistralai/mistral-7b-instruct");
      if (mistral) return { statusCode: 200, body: JSON.stringify({ reply: mistral }) };
    } catch (e) {
      console.warn("Mistral fallback failed:", e.message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: "⚠️ I’m unable to reach the Ayurvedic servers right now. Please try again later." }),
    };
  } catch (err) {
    console.error("Function Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
