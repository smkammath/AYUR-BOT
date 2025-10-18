// AYUR VIDHYA — Intelligent Ayurvedic Wellness Assistant 🌿
// 3-Tier System: Local Remedies → GPT-3.5 → Mistral 7B (fallback)
// Built for Netlify Functions + OpenRouter

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

exports.handler = async function (event) {
  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing user message" }),
      };
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing OpenRouter API key in environment" }),
      };
    }

    const userQuery = message.toLowerCase();

    // 🌿 Tier 1: Local Ayurvedic Data
    const localData = {
      stress: {
        herbs: ["Ashwagandha", "Brahmi", "Jatamansi"],
        yoga: ["Shavasana", "Nadi Shodhana", "Viparita Karani"],
        diet: "Avoid caffeine and spicy food. Drink warm milk with nutmeg. Include fruits like banana and dates.",
      },
      acidity: {
        herbs: ["Amla", "Licorice (Yashtimadhu)", "Triphala"],
        yoga: ["Vajrasana", "Pavanamuktasana"],
        diet: "Avoid fried or spicy food. Eat small light meals. Drink warm water with honey.",
      },
      cold: {
        herbs: ["Tulsi", "Ginger", "Turmeric", "Black Pepper"],
        yoga: ["Anulom Vilom", "Kapalbhati"],
        diet: "Avoid cold drinks. Drink herbal tea with ginger and tulsi.",
      },
      "joint pain": {
        herbs: ["Guggul", "Turmeric", "Ashwagandha"],
        yoga: ["Vrikshasana", "Trikonasana", "Ardha Matsyendrasana"],
        diet: "Include warm milk with turmeric. Avoid sour and cold foods.",
      },
    };

    const match = Object.keys(localData).find(k => userQuery.includes(k));
    if (match) {
      const info = localData[match];
      const reply = `
🪷 **Ayurvedic Tips for ${match.toUpperCase()}**  
🌿 **Herbs:** ${info.herbs.join(", ")}  
🧘 **Yoga:** ${info.yoga.join(", ")}  
🥗 **Diet:** ${info.diet}  

✨ Stay balanced and peaceful. (Informational only — not medical advice.)
`;
      return {
        statusCode: 200,
        body: JSON.stringify({ reply }),
      };
    }

    // 🌐 Helper: Call OpenRouter API
    async function callOpenRouter(model, userMessage) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
              content: `You are AYUR VIDHYA 🌿 — a calm, well-informed Ayurvedic wellness assistant.
Answer with Ayurveda-based insights, herbal remedies, diet tips, and yoga suggestions.
Respond compassionately and concisely. Always add: 
"This is informational only — not medical advice."`,
            },
            { role: "user", content: userMessage },
          ],
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data?.choices?.[0]?.message?.content || null;
    }

    // 🌿 Tier 2: Try GPT-3.5-Turbo (Free/Low-cost model)
    try {
      const gptReply = await callOpenRouter("gpt-3.5-turbo", message);
      if (gptReply) {
        return {
          statusCode: 200,
          body: JSON.stringify({ reply: gptReply }),
        };
      }
    } catch (e) {
      console.warn("⚠️ GPT-3.5 fallback failed:", e.message);
    }

    // 🔥 Tier 3: Use Mistral 7B if GPT fails
    try {
      const mistralReply = await callOpenRouter("mistralai/mistral-7b-instruct", message);
      if (mistralReply) {
        return {
          statusCode: 200,
          body: JSON.stringify({ reply: mistralReply }),
        };
      }
    } catch (e) {
      console.warn("⚠️ Mistral fallback failed:", e.message);
    }

    // ❌ If everything fails
    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: "⚠️ I’m unable to reach the Ayurvedic servers right now. Please try again later.",
      }),
    };
  } catch (err) {
    console.error("❌ AYUR VIDHYA Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
