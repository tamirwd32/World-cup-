export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Sanitize team names to avoid breaking JSON in AI prompts
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
    if (!m) throw new Error("No JSON found in response");
    return JSON.parse(m[0]);
  }
}

export async function POST(req) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY;

  let fixturesData = {};
  try { fixturesData = await req.json(); } catch {}

  const { results=[], upcoming=[], groups=[], currentStage="שלב הבתים" } = fixturesData;

  // Sanitize all team names to avoid JSON-breaking characters
  const resultsText = results.length > 0
    ? results.slice(0,12).map(r=>`${safe(r.home)} ${r.score} ${safe(r.away)} (${r.group})`).join(", ")
    : "No results yet";

  const upcomingText = upcoming.length > 0
    ? upcoming.map(u=>`${safe(u.home)} vs ${safe(u.away)} - ${u.datetime}`).join("\n")
    : "No upcoming fixtures";

  const standingsText = groups.length > 0
    ? groups.map(g=>
        `${g.group}: ` + g.table.map(t=>`${safe(t.team)} ${t.pts}pts (${t.played}G)`).join(", ")
      ).join(" | ")
    : "Not available";

  const prompt = `You are a World Cup 2026 analyst. Analyze this REAL live data:

RESULTS: ${resultsText}
UPCOMING FIXTURES: ${upcomingText}
STANDINGS: ${standingsText}
STAGE: ${currentStage}

Return ONLY a valid JSON object. No markdown, no backticks, nothing else before or after.
IMPORTANT: Team names must NOT contain double-quote characters. Use single quotes or Hebrew only.

{
  "lastUpdated": "16.6.2026 - יום 6",
  "standings": [
    {"rank":1,"team":"צרפת","prob":19,"odds":"+500","trend":"up","note":"סגל עמוק"},
    {"rank":2,"team":"גרמניה","prob":14,"odds":"+1400","trend":"up","note":"7-1 על קוראסאו"},
    {"rank":3,"team":"אנגליה","prob":13,"odds":"+650","trend":"flat","note":"בית קל"},
    {"rank":4,"team":"ספרד","prob":12,"odds":"+450","trend":"down","note":"0-0 קייפ ורדה"},
    {"rank":5,"team":"ארגנטינה","prob":10,"odds":"+900","trend":"flat","note":"מסי בן 39"},
    {"rank":6,"team":"פורטוגל","prob":9,"odds":"+850","trend":"flat","note":"רונאלדו"}
  ],
  "bets": [
    {"match":"קבוצה א - קבוצה ב","datetime":"שעה מדויקת מהנתונים","pick":"תחזית מדויקת עם תוצאה למשל צרפת מנצחת 2:0","confidence":"high","odds":"~2.10","reason":"נימוק קצר בעברית"}
  ],
  "analysis": "2-3 משפטים בעברית על תובנות מרכזיות"
}

Rules:
- standings: top 6 with flag emojis in team names (use Unicode, not ASCII quotes)
- bets: one per upcoming fixture, exact datetime from data above
- analysis: based on real results
- CRITICAL: no double-quote marks inside any JSON string values`;

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
    return Response.json({ ...parsed, provider }, { headers: { "Cache-Control": "no-store" } });
  } catch(e) {
    return Response.json({ error: "שגיאה בניתוח: " + e.message }, { status: 502 });
  }
}
