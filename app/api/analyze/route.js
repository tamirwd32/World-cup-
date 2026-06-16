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
        generationConfig: { temperature: 0.2, maxOutputTokens: 2000 }
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
        { role: "system", content: "You are a JSON-only API. Output a single valid JSON object. No markdown, no backticks, no text outside the JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 2000
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

  // Receive fixtures data from client (passed from /api/fixtures call)
  let fixturesData = {};
  try { fixturesData = await req.json(); } catch {}

  const { results=[], upcoming=[], groups=[], currentStage="שלב הבתים" } = fixturesData;

  const resultsText = results.length > 0
    ? results.slice(0,12).map(r=>`${r.home} ${r.score} ${r.away} (${r.group})`).join(", ")
    : "No results yet";

  const upcomingText = upcoming.length > 0
    ? upcoming.map(u=>`${u.home} vs ${u.away} — ${u.datetime}`).join("\n")
    : "No upcoming fixtures";

  const standingsText = groups.length > 0
    ? groups.map(g=>
        `${g.group}: ` + g.table.map(t=>`${t.team} ${t.pts}pts`).join(", ")
      ).join(" | ")
    : "Not available";

  const prompt = `You are a World Cup 2026 analyst. Based on REAL live data:

RESULTS: ${resultsText}
UPCOMING: ${upcomingText}
STANDINGS: ${standingsText}
CURRENT STAGE: ${currentStage}

Return ONLY valid JSON:
{
  "lastUpdated": "Hebrew date e.g. 16.6.2026 — יום 6",
  "standings": [
    {"rank":1,"team":"🇫🇷 צרפת","prob":19,"odds":"+500","trend":"up","note":"Hebrew max 35 chars"}
  ],
  "bets": [
    {"match":"Home – Away","datetime":"exact datetime from upcoming","pick":"prediction WITH scoreline","confidence":"high|medium|low","odds":"~X.XX","reason":"Hebrew max 100 chars"}
  ],
  "analysis": "2-3 Hebrew sentences on key insights from latest results and standings"
}

Rules:
- standings: top 6 title contenders by win probability, with flag emojis
- bets: one per upcoming fixture, exact datetime from data
- analysis: insightful, based on real results
- Return ONLY valid JSON`;

  let text = "";
  let provider = "unknown";

  if (geminiKey) {
    try { text = await callGemini(geminiKey, prompt); provider = "gemini"; }
    catch(e) { if (e.code !== 429 && !groqKey) return Response.json({ error: String(e.message) }, { status: 502 }); }
  }

  if (!text && groqKey) {
    try { text = await callGroq(groqKey, prompt); provider = "groq"; }
    catch(e) { return Response.json({ error: "כל ספקי ה-AI אינם זמינים. נסו שוב בעוד מספר דקות." }, { status: 502 }); }
  }

  if (!text) return Response.json({ error: "לא מוגדר מפתח AI." }, { status: 500 });

  try {
    const parsed = parseJSON(text);
    if (!parsed.standings) throw new Error("Invalid shape");
    return Response.json({ ...parsed, provider }, { headers: { "Cache-Control": "no-store" } });
  } catch(e) {
    return Response.json({ error: "שגיאה בניתוח: " + e.message }, { status: 502 });
  }
}
