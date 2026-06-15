export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Prompt without emojis — works with all LLM providers
const PROMPT = `You are a World Cup 2026 analyst. Today is June 16 2026, group stage matchday 2.
Known results: Mexico 2-0 South Africa, South Korea 2-1 Czechia, Canada 1-1 Bosnia, USA 4-1 Paraguay, Brazil 1-1 Morocco, Scotland 1-0 Haiti, Germany 7-1 Curacao, Ivory Coast 1-0 Ecuador, Netherlands 2-2 Japan, Sweden 5-1 Tunisia, Belgium 0-1 Egypt, Spain 0-0 Cape Verde.
Upcoming: France vs Senegal today 22:00 Israel, Iraq vs Norway today 21:00 Israel, England vs Croatia tomorrow 23:00 Israel, Portugal vs DR Congo tomorrow 20:00 Israel.

Return ONLY a valid JSON object. No markdown, no backticks, no explanation before or after.
Use these EXACT team name strings (copy exactly, they contain flag emojis):
France="\u{1F1EB}\u{1F1F7} \u05E6\u05E8\u05E4\u05EA", Germany="\u{1F1E9}\u{1F1EA} \u05D2\u05E8\u05DE\u05E0\u05D9\u05D4", England="\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67\uDB40\uDC7F \u05D0\u05E0\u05D2\u05DC\u05D9\u05D4", Spain="\u{1F1EA}\u{1F1F8} \u05E1\u05E4\u05E8\u05D3", Argentina="\u{1F1E6}\u{1F1F7} \u05D0\u05E8\u05D2\u05E0\u05D8\u05D9\u05E0\u05D4", Portugal="\u{1F1F5}\u{1F1F9} \u05E4\u05D5\u05E8\u05D8\u05D5\u05D2\u05DC"

{
  "lastUpdated": "16.6.2026 \u2014 \u05D9\u05D5\u05DD 6",
  "currentStage": "\u05E9\u05DC\u05D1 \u05D4\u05D1\u05EA\u05D9\u05DD",
  "standings": [
    {"rank":1,"team":"\u{1F1EB}\u{1F1F7} \u05E6\u05E8\u05E4\u05EA","prob":19,"odds":"+500","trend":"up","note":"\u05E1\u05D2\u05DC \u05E2\u05DE\u05D5\u05E7"},
    {"rank":2,"team":"\u{1F1E9}\u{1F1EA} \u05D2\u05E8\u05DE\u05E0\u05D9\u05D4","prob":14,"odds":"+1400","trend":"up","note":"7-1 \u05E2\u05DC \u05E7\u05D5\u05E8\u05D0\u05E1\u05D0\u05D5"},
    {"rank":3,"team":"\uD83C\uDFF4 \u05D0\u05E0\u05D2\u05DC\u05D9\u05D4","prob":13,"odds":"+650","trend":"flat","note":"\u05D1\u05D9\u05EA \u05E7\u05DC"},
    {"rank":4,"team":"\u{1F1EA}\u{1F1F8} \u05E1\u05E4\u05E8\u05D3","prob":12,"odds":"+450","trend":"down","note":"0-0 \u05E7\u05D9\u05D9\u05E4 \u05D5\u05E8\u05D3\u05D4"},
    {"rank":5,"team":"\u{1F1E6}\u{1F1F7} \u05D0\u05E8\u05D2\u05E0\u05D8\u05D9\u05E0\u05D4","prob":10,"odds":"+900","trend":"flat","note":"\u05DE\u05E1\u05D9 \u05D1\u05DF 39"},
    {"rank":6,"team":"\u{1F1F5}\u{1F1F9} \u05E4\u05D5\u05E8\u05D8\u05D5\u05D2\u05DC","prob":9,"odds":"+850","trend":"flat","note":"\u05E8\u05D5\u05E0\u05D0\u05DC\u05D3\u05D5"}
  ],
  "results": [
    {"group":"E","home":"\u05D2\u05E8\u05DE\u05E0\u05D9\u05D4","score":"7-1","away":"\u05E7\u05D5\u05E8\u05D0\u05E1\u05D0\u05D5","note":"xG 3.91"},
    {"group":"H","home":"\u05E1\u05E4\u05E8\u05D3","score":"0-0","away":"\u05E7\u05D9\u05D9\u05E4 \u05D5\u05E8\u05D3\u05D4","note":"\u05D4\u05E4\u05EA\u05E2\u05D4"},
    {"group":"G","home":"\u05D1\u05DC\u05D2\u05D9\u05D4","score":"0-1","away":"\u05DE\u05E6\u05E8\u05D9\u05DD","note":""},
    {"group":"D","home":"\u05D0\u05E8\u05D4\u05D1","score":"4-1","away":"\u05E4\u05E8\u05D2\u05D5\u05D0\u05D9","note":""},
    {"group":"C","home":"\u05D1\u05E8\u05D6\u05D9\u05DC","score":"1-1","away":"\u05DE\u05E8\u05D5\u05E7\u05D5","note":"\u05D5\u05D9\u05E0\u05D9\u05E1\u05D9\u05D5\u05E1 \u05D4\u05E6\u05D9\u05DC"},
    {"group":"F","home":"\u05D4\u05D5\u05DC\u05E0\u05D3","score":"2-2","away":"\u05D9\u05E4\u05DF","note":"\u05D3\u05E8\u05DE\u05D8\u05D9"}
  ],
  "bets": [
    {"match":"\u05E6\u05E8\u05E4\u05EA - \u05E1\u05E0\u05D2\u05DC","datetime":"\u05E9\u05DC\u05D9\u05E9\u05D9 16.6 \u05D1\u05E9\u05E2\u05D4 22:00","pick":"\u05E6\u05E8\u05E4\u05EA \u05DE\u05E0\u05E6\u05D7\u05EA 2:0","confidence":"high","odds":"~2.10","reason":"\u05DE\u05D1\u05D0\u05E4\u05D4 \u05D5\u05D0\u05D5\u05DC\u05D9\u05D6 \u05D7\u05D3\u05D9\u05DD, \u05E1\u05D2\u05DC \u05E2\u05DE\u05D5\u05E7 \u05DC\u05E2\u05D5\u05DE\u05EA \u05D4\u05D2\u05E0\u05EA \u05E1\u05E0\u05D2\u05DC"},
    {"match":"\u05E2\u05D9\u05E8\u05D0\u05E7 - \u05E0\u05D5\u05E8\u05D5\u05D5\u05D2\u05D9\u05D4","datetime":"\u05E9\u05DC\u05D9\u05E9\u05D9 16.6 \u05D1\u05E9\u05E2\u05D4 21:00","pick":"\u05E0\u05D5\u05E8\u05D5\u05D5\u05D2\u05D9\u05D4 \u05DE\u05E0\u05E6\u05D7\u05EA 2:0","confidence":"high","odds":"~1.70","reason":"\u05D4\u05DC\u05D0\u05E0\u05D3 \u05DE\u05D5\u05DC \u05D4\u05D2\u05E0\u05D4 \u05D7\u05DC\u05E9\u05D4 \u05E9\u05DC \u05E2\u05D9\u05E8\u05D0\u05E7"},
    {"match":"\u05D0\u05E0\u05D2\u05DC\u05D9\u05D4 - \u05E7\u05E8\u05D5\u05D0\u05D8\u05D9\u05D4","datetime":"\u05E8\u05D1\u05D9\u05E2\u05D9 17.6 \u05D1\u05E9\u05E2\u05D4 23:00","pick":"\u05D0\u05E0\u05D2\u05DC\u05D9\u05D4 \u05DE\u05E0\u05E6\u05D7\u05EA 2:1","confidence":"medium","odds":"~3.40","reason":"\u05E7\u05D9\u05D9\u05DF \u05D1\u05E9\u05D9\u05D0\u05D5, \u05E7\u05E8\u05D5\u05D0\u05D8\u05D9\u05D4 \u05DE\u05D6\u05D3\u05E7\u05E0\u05EA"},
    {"match":"\u05E4\u05D5\u05E8\u05D8\u05D5\u05D2\u05DC - \u05E7\u05D5\u05E0\u05D2\u05D5 DR","datetime":"\u05E8\u05D1\u05D9\u05E2\u05D9 17.6 \u05D1\u05E9\u05E2\u05D4 20:00","pick":"\u05E4\u05D5\u05E8\u05D8\u05D5\u05D2\u05DC \u05DE\u05E0\u05E6\u05D7\u05EA 3:0","confidence":"high","odds":"~1.50","reason":"\u05E8\u05D5\u05E0\u05D0\u05DC\u05D3\u05D5 \u05DE\u05D5\u05DC \u05E0\u05D1\u05D7\u05E8\u05EA \u05D7\u05DC\u05E9\u05D4"}
  ],
  "analysis": "\u05E1\u05E4\u05E8\u05D3 0:0 \u05E2\u05DD \u05E7\u05D9\u05D9\u05E4 \u05D5\u05E8\u05D3\u05D4 \u2014 \u05D3\u05E4\u05D5\u05E1 \u05DE\u05D3\u05D0\u05D9\u05D2 \u05D7\u05D5\u05D6\u05E8. \u05D2\u05E8\u05DE\u05E0\u05D9\u05D4 7:1 \u05DE\u05E8\u05E9\u05D9\u05DD. \u05E6\u05E8\u05E4\u05EA \u05D4\u05DE\u05D5\u05E2\u05DE\u05D3\u05EA \u05D4\u05E8\u05D0\u05E9\u05D9\u05EA \u05DC\u05E4\u05E0\u05D9 \u05D9\u05D5\u05DD 6."
}

IMPORTANT: The JSON above is just the format template. Generate your own updated analysis based on the match data provided. Return ONLY the JSON, nothing else.`;

async function callGemini(key) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: PROMPT }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2000 }
      })
    }
  );
  const data = await res.json();
  if (res.status === 429) { const err = new Error("rate_limited"); err.code = 429; throw err; }
  if (!res.ok) throw new Error("Gemini " + res.status + ": " + (data?.error?.message || ""));
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callGroq(key) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a JSON-only API. You must respond with a single valid JSON object and nothing else. No markdown, no backticks, no explanation. Only pure JSON."
        },
        { role: "user", content: PROMPT }
      ],
      temperature: 0.2,
      max_tokens: 2000
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Groq " + res.status + ": " + (data?.error?.message || ""));
  return data?.choices?.[0]?.message?.content || "";
}

function parseResponse(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  let parsed;
  try { parsed = JSON.parse(clean); }
  catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("No JSON in response");
    parsed = JSON.parse(m[0]);
  }
  if (!parsed.standings || !Array.isArray(parsed.standings)) throw new Error("Invalid shape");
  return parsed;
}

export async function POST() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // Try Gemini first
  if (geminiKey) {
    try {
      const text = await callGemini(geminiKey);
      const parsed = parseResponse(text);
      return Response.json({ ...parsed, provider: "gemini" }, { headers: { "Cache-Control": "no-store" } });
    } catch(e) {
      if (e.code !== 429 && !groqKey) {
        return Response.json({ error: String(e?.message || e) }, { status: 502 });
      }
    }
  }

  // Fallback: Groq
  if (groqKey) {
    try {
      const text = await callGroq(groqKey);
      const parsed = parseResponse(text);
      return Response.json({ ...parsed, provider: "groq" }, { headers: { "Cache-Control": "no-store" } });
    } catch(e) {
      return Response.json({ error: "כל ספקי ה-AI אינם זמינים כרגע. נסו שוב בעוד מספר דקות." }, { status: 502 });
    }
  }

  return Response.json({ error: "לא מוגדר מפתח API. בדוק את הגדרות Vercel." }, { status: 500 });
}
