export const dynamic = "force-dynamic";
export const maxDuration = 60;

function safe(name) {
  return (name || "").replace(/"/g, "'").replace(/\\/g, "");
}

async function callGemini(key, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2500 }
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
        { role: "system", content: "You are a sports analyst API. You MUST respond with ONLY a valid JSON object. Never use placeholder text like 'Hebrew note' or 'short reason' - always write actual Hebrew content. Never copy the example structure literally." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2500
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Groq " + res.status + ": " + (data?.error?.message||""));
  return data?.choices?.[0]?.message?.content || "";
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(clean); }
  catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("No JSON found");
    return JSON.parse(m[0]);
  }
}

export async function POST(req) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY;

  let fixturesData = {};
  try { fixturesData = await req.json(); } catch {}

  const { results=[], upcoming=[], groups=[], currentStage="שלב הבתים" } = fixturesData;

  const resultsText = results.length > 0
    ? results.slice(0,12).map(r=>`${safe(r.home)} ${r.score} ${safe(r.away)} (${r.group})`).join(", ")
    : "No results yet";

  const upcomingText = upcoming.length > 0
    ? upcoming.map((u,i)=>`${i+1}. ${safe(u.home)} vs ${safe(u.away)} at ${u.datetime}`).join("\n")
    : "No upcoming fixtures";

  const standingsText = groups.length > 0
    ? groups.slice(0,6).map(g=>
        `${g.group}: ` + g.table.slice(0,4).map(t=>`${safe(t.team)} ${t.pts}pts`).join(", ")
      ).join(" | ")
    : "Not available";

  const prompt = `You are a World Cup 2026 football analyst. Analyze the real live data below and respond with a JSON object.

=== REAL DATA ===
RESULTS SO FAR: ${resultsText}
CURRENT STAGE: ${currentStage}
GROUP STANDINGS: ${standingsText}

UPCOMING FIXTURES (create one bet for EACH of these):
${upcomingText}

=== INSTRUCTIONS ===
Return a JSON object with these exact fields:

1. "lastUpdated": today's Hebrew date string, e.g. "16.6.2026 - יום 6"

2. "standings": array of exactly 6 objects, one per top title contender.
   Each object: rank (1-6), team (Hebrew name with flag emoji), prob (win percentage integer), odds (e.g. "+500"), trend ("up"/"down"/"flat"), note (real Hebrew insight, max 35 chars)
   Base this on actual results - teams that won should trend up.

3. "bets": array with ONE object per upcoming fixture listed above.
   Each object: 
   - match: "Hebrew team 1 - Hebrew team 2"
   - datetime: exact datetime from the fixtures list above
   - pick: your specific prediction in Hebrew including exact score, e.g. "צרפת מנצחת 2:1"
   - confidence: "high", "medium", or "low" based on your analysis
   - odds: estimated bookmaker odds like "~1.85"
   - reason: 1-2 sentences of REAL Hebrew analysis explaining why (NOT placeholder text)

4. "analysis": 2-3 sentences of real Hebrew insight about the tournament so far.

=== CRITICAL RULES ===
- Write REAL content, not placeholder text like "נימוק קצר" or "short reason"
- Every bet must have a different match from the fixtures list
- Do not include double-quote characters inside string values
- Return ONLY the JSON object, nothing else`;

  let text = "";
  let provider = "unknown";

  if (geminiKey) {
    try { text = await callGemini(geminiKey, prompt); provider = "gemini"; }
    catch(e) { if (e.code !== 429 && !groqKey) return Response.json({ error: String(e.message) }, { status: 502 }); }
  }

  if (!text && groqKey) {
    try { text = await callGroq(groqKey, prompt); provider = "groq"; }
    catch(e) { return Response.json({ error: "כל ספקי ה-AI אינם זמינים. נסו שוב." }, { status: 502 }); }
  }

  if (!text) return Response.json({ error: "לא מוגדר מפתח AI." }, { status: 500 });

  try {
    const parsed = parseJSON(text);
    if (!parsed.standings) throw new Error("Invalid shape - missing standings");
    // Validate bets have real content
    if (parsed.bets) {
      parsed.bets = parsed.bets.filter(b =>
        b.match && b.pick && b.reason &&
        !b.reason.includes("נימוק") &&
        !b.reason.includes("short") &&
        !b.reason.includes("Hebrew")
      );
    }
    return Response.json({ ...parsed, provider }, { headers: { "Cache-Control": "no-store" } });
  } catch(e) {
    return Response.json({ error: "שגיאה בניתוח: " + e.message }, { status: 502 });
  }
}
