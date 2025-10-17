// netlify/functions/ayurbot.js
// ✅ CommonJS version (compatible with Netlify default runtime)

async function handler(event) {
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
          { role: "system", content: "You are a factual, health-safe Ayurvedic guide for India." },
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

module.exports = { handler };
