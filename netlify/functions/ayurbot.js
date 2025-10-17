// netlify/functions/ayurbot.js
// netlify/functions/ayurbot.js

export async function handler(event) {
  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return { statusCode: 400, body: "Missing message" };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const githubToken = process.env.GITHUB_TOKEN; // optional
    const repoOwner = "smkammath";
    const repoName = "AYUR-BOT";

    // 🧘 Wellness prompt
    const prompt = `
You are AYUR-BOT, a safe, reliable Indian wellness assistant.
Provide fitness tips, diet plans, and Ayurvedic insights.
If asked about treatments, mention traditional options (like Panchakarma) and famous Ayurvedic centers in India.
Always add: "This is informational only — not medical advice."
User question: ${message}`;

    // 🧠 Call OpenAI
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You provide wellness guidance with verified Indian Ayurvedic sources." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 600
      })
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API failed: ${openAIResponse.status} ${openAIResponse.statusText}`);
    }

    const data = await openAIResponse.json();
    const reply = data?.choices?.[0]?.message?.content || "No reply generated.";

    // Optional GitHub logging
    if (githubToken) {
      await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues`, {
        method: "POST",
        headers: {
          "Authorization": `token ${githubToken}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: "AYUR-BOT chat log",
          body: `**User:** ${message}\n\n**Bot:** ${reply}`,
          labels: ["chat-log"]
        })
      });
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    console.error("AYUR-BOT error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

const EMERGENCY_PATTERNS = [
  /\bchest pain\b/i, /\bdifficulty breathing\b/i, /\bshortness of breath\b/i,
  /\bsevere bleeding\b/i, /\bsuicid(e|al)\b/i, /\boverdose\b/i, /\bfainting\b/i, /\bunconscious\b/i
];

const URGENT_PATTERNS = [
  /\bpregnant\b/i, /\bchild\b/i, /\bbaby\b/i, /\binfant\b/i, /\bserious\b/i, /\bfever\b/i
];

function containsAny(text, patterns) {
  return patterns.some(p => p.test(text || ""));
}

// Utility: call OpenAI Chat Completions
async function callOpenAI(apiKey, prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are AYUR-BOT, a conservative and safety-focused wellness assistant. Provide general fitness, diet, ayurvedic lifestyle options. Never prescribe medication dosages. If the user indicates emergency symptoms, refuse and instruct to seek emergency care. If user asks for hospitals/doctors, provide general guidance and optionally include place listings if provided by server." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 700
    })
  });
  const j = await res.json();
  return j?.choices?.[0]?.message?.content ?? null;
}

// Utility: query Google Places (optional). Returns 3 nearby hospitals/doctors (name + address + place_id)
async function queryPlaces(apiKey, query, location = "20.5937,78.9629", radius = 50000) {
  // location default is India center — but better: accept user location
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location}&radius=${radius}&key=${apiKey}`;
  const r = await fetch(url);
  const j = await r.json();
  if (!j?.results) return [];
  return j.results.slice(0, 5).map(p => ({ name: p.name, address: p.formatted_address, place_id: p.place_id }));
}

export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const message = (body.message || "").trim();
    const userLocation = body.location || null; // optional {lat,lng} or "lat,lng"
    if (!message) return { statusCode: 400, body: JSON.stringify({ error: "Missing message" }) };

    // Emergency detection
    if (containsAny(message, EMERGENCY_PATTERNS)) {
      const em = "**EMERGENCY NOTICE:** Your message contains words that may indicate a medical emergency. I cannot provide emergency care. If this is immediate danger, call emergency services now (India: 112).";
      return { statusCode: 200, body: JSON.stringify({ reply: em }) };
    }

    // Urgent referral
    if (containsAny(message, URGENT_PATTERNS)) {
      const ur = "**Important:** Your message includes special circumstances (pregnancy/child/serious condition). I can provide general info, but please consult a licensed healthcare provider before making changes.";
      // continue to provide general info below but warn the user
    }

    // Build a careful prompt for the LLM
    let prompt = `User question: ${message}\n\nDeliver a concise reply containing:\n- 1-2 line summary\n- Practical daily suggestions (fitness/diet/ayurvedic lifestyle options, non-prescriptive)\n- When to see a doctor (clear red flags)\n- If user asks about local treatment options/hospitals/doctors, include instructions on how to find nearby specialists and (if allowed) list a few places using Google Places.\nAlways end with: "This is informational only — not medical advice."`;

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return { statusCode: 500, body: JSON.stringify({ error: "Server misconfigured: missing OPENAI_API_KEY" }) };

    // Call OpenAI
    const aiReply = await callOpenAI(OPENAI_KEY, prompt);

    let finalReply = aiReply || "Sorry, I couldn't generate a reply right now.";

    // If user explicitly asked for nearby hospitals/doctors, try Google Places (optional)
    const wantsPlaces = /\b(hospital|clinic|doctor|physician|ayurved(ic)? (doctor|clinic)|treatment center|hospital near|clinic near|doctor near)\b/i.test(message);
    if (wantsPlaces && process.env.GOOGLE_PLACES_API_KEY) {
      const locStr = userLocation || process.env.DEFAULT_SEARCH_CENTER || "20.5937,78.9629"; // India center fallback
      const query = /ayurved/i.test(message) ? "Ayurvedic clinic near me" : "Hospital near me";
      const places = await queryPlaces(process.env.GOOGLE_PLACES_API_KEY, query, locStr, 50000);
      if (places.length) {
        finalReply += `\n\n**Nearby places (sample):**\n` + places.map(p => `• ${p.name} — ${p.address}`).join("\n");
        finalReply += `\n\n(These are search results from Google Places. Verify before visiting.)`;
      } else {
        finalReply += `\n\nI couldn't fetch nearby place listings right now. You can search "Ayurvedic clinic near me" or use local directories like Justdial/Practo for India.`;
      }
    } else if (wantsPlaces && !process.env.GOOGLE_PLACES_API_KEY) {
      finalReply += `\n\nTip: to enable local place suggestions, configure a Google Places API key in the Netlify site's environment variables (GOOGLE_PLACES_API_KEY).`;
    }

    // Optional: Log chat to GitHub Issues if GITHUB_TOKEN present
    if (process.env.GITHUB_TOKEN) {
      try {
        const repoOwner = process.env.GITHUB_OWNER || "smkammath";
        const repoName = process.env.GITHUB_REPO || "AYUR-BOT";
        await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues`, {
          method: "POST",
          headers: {
            "Authorization": `token ${process.env.GITHUB_TOKEN}`,
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: `Chat log: ${message.substring(0,60)}`,
            body: `**User:** ${message}\n\n**Bot:**\n${finalReply}`,
            labels: ["chat-log"]
          })
        });
      } catch (err) {
        console.warn("GitHub logging failed:", err && err.message);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ reply: finalReply }) };

  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
}
