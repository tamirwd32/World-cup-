export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function callGemini(key, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2000 }
      })
    }
  );
  const data = await res.json();
  if (res.status === 429) { const e = new Error("rate_limited"); e.code = 429; throw e; }
  if (!res.ok) throw new Error("Gemini " + res.status);
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callGroq(key, prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a football analyst. Respond with ONLY valid JSON. Write real Hebrew analysis, never placeholders." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 2000
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Groq " + res.status);
  return data?.choices?.[0]?.message?.content || "";
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(clean); }
  catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("No JSON");
    return JSON.parse(m[0]);
  }
}

export async function POST(req) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  let body = {};
  try { body = await req.json(); } catch {}

  const { team = "", rank = "", prob = "", teamResults = "", currentStage = "", nextOpponent = "" } = body;

  const prompt = `You are a World Cup 2026 expert analyst. Provide a deep analysis of this team.

TEAM: ${team}
CURRENT TITLE PROBABILITY RANK: #${rank} (${prob}% win probability)
TOURNAMENT STAGE: ${currentStage}
TEAM RESULTS THIS TOURNAMENT: ${teamResults || "Not available"}
${nextOpponent ? "NEXT OPPONENT: " + nextOpponent : ""}

Return ONLY a valid JSON object:
{
  "overview": "4-5 sentences of deep Hebrew analysis: why this team is ranked here, their tournament journey so far, overall assessment",
  "strengths": ["strength 1 in Hebrew", "strength 2 in Hebrew", "strength 3 in Hebrew"],
  "weaknesses": ["weakness 1 in Hebrew", "weakness 2 in Hebrew"],
  "keyPlayers": [
    {"name": "player name", "position": "position in Hebrew", "impact": "1 sentence in Hebrew on their impact"},
    {"name": "second player", "position": "position in Hebrew", "impact": "1 sentence in Hebrew"}
  ],
  "tournamentPath": "2-3 Hebrew sentences on their likely path forward and biggest obstacles",
  "verdict": "1-2 Hebrew sentences: final assessment on their title chances"
}

CRITICAL: Real analysis based on the actual 2026 tournament data provided. No placeholders. No double-quote chars inside strings.`;

  let text = "", provider = "unknown";

  if (geminiKey) {
    try { text = await callGemini(geminiKey, prompt); provider = "gemini"; }
    catch(e) { if (e.code !== 429 && !groqKey) return Response.json({ error: String(e.message) }, { status: 502 }); }
  }
  if (!text && groqKey) {
    try { text = await callGroq(groqKey, prompt); provider = "groq"; }
    catch(e) { return Response.json({ error: "AI לא זמין" }, { status: 502 }); }
  }
  if (!text) return Response.json({ error: "לא מוגדר מפתח AI" }, { status: 500 });

  try {
    const parsed = parseJSON(text);
    if (!parsed.overview) throw new Error("Invalid shape");
    return Response.json({ ...parsed, provider }, { headers: { "Cache-Control": "no-store" } });
  } catch(e) {
    return Response.json({ error: "שגיאה: " + e.message }, { status: 502 });
  }
}
