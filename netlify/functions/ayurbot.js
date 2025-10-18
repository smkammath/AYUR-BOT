// netlify/functions/ayurbot.js
// ✅ AYUR VIDHYA — AI + Ayurveda Integrated Chatbot
// Built for Netlify Functions using OpenRouter + local data blend

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

    // 🌿 Local Ayurvedic data — quick access before AI
    const localData = {
      stress: {
        herbs: ["Brahmi", "Ashwagandha", "Jatamansi"],
        yoga: ["Shavasana", "Nadi Shodhana", "Viparita Karani"],
        diet: "Avoid caffeine and processed foods. Include warm milk with nutmeg, and fresh fruits like bananas.",
      },
      acidity: {
        herbs: ["Amla", "Licorice (Yashtimadhu)", "Triphala"],
        yoga: ["Vajrasana", "Pavanamuktasana"],
        diet: "Avoid spicy foods, eat small light meals, drink warm water with honey.",
      },
      cold: {
        herbs: ["Tulsi", "Ginger", "Turmeric", "Black Pepper"],
        yoga: ["Anulom Vilom", "Kapalbhati"],
        diet: "Avoid cold drinks and yogurt; drink herbal teas and soups.",
      },
      "joint pain": {
        herbs: ["Guggul", "Turmeric", "Ashwagandha"],
        yoga: ["Vrikshasana", "Trikonasana", "Ardha Matsyendrasana"],
        diet: "Take warm milk with turmeric; avoid sour foods.",
      },
    };

    const userQuery = message.toLowerCase();
    const match = Object.keys(localData).find(k => userQuery.includes(k));

    if (match) {
      const info = localData[match];
      const reply = `
🪷 **Ayurvedic Tips for ${match.toUpperCase()}**  
🌿 Herbs: ${info.herbs.join(", ")}  
🧘 Yoga: ${info.yoga.join(", ")}  
🥗 Diet: ${info.diet}  

✨ Stay balanced and peaceful. (Informational only — not medical advice.)
`;
      return {
        statusCode: 200,
        body: JSON.stringify({ reply }),
      };
    }

    // 🌐 Fallback — use OpenRouter AI
    const apiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://myayurveda.netlify.app",
        "X-Title": "AYUR VIDHYA",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct", // ✅ valid model name
        messages: [
          {
            role: "system",
            content: `
You are AYUR VIDHYA 🌿 — a calm Ayurvedic wellness assistant.
Provide clear, compassionate, and factual wellness advice based on Ayurveda.
Include lifestyle, yoga, diet, and herbal guidance.
Always end with: “This is informational only — not medical advice.”
`,
          },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await apiResponse.json();

    if (data.error) {
      console.error("OpenRouter API Error:", data.error);
      return {
        statusCode: 500,
        body: JSON.stringify({ reply: `⚠️ API Error: ${data.error.message}` }),
      };
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "⚠️ No reply generated. Please try again later.";

    return {
      statusCode: 200,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("Function Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
