export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ─── Fetch live data from API-Football ───────────────────────────────────────
async function fetchFootballData(apiKey) {
  const headers = { "x-apisports-key": apiKey };
  const BASE = "https://v3.football.api-sports.io";
  const LEAGUE = 1;    // FIFA World Cup
  const SEASON = 2026;

  const [fixturesRes, standingsRes] = await Promise.all([
    fetch(`${BASE}/fixtures?league=${LEAGUE}&season=${SEASON}&timezone=Asia/Jerusalem`, { headers }),
    fetch(`${BASE}/standings?league=${LEAGUE}&season=${SEASON}`, { headers }),
  ]);

  const fixturesData = await fixturesRes.json();
  const standingsData = await standingsRes.json();

  // Parse results (finished games)
  const results = (fixturesData.response || [])
    .filter(f => f.fixture.status.short === "FT")
    .sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date))
    .slice(0, 16)
    .map(f => ({
      group: f.league.round?.replace("Group Stage - ", "Group ") || "",
      home: f.teams.home.name,
      score: `${f.goals.home}–${f.goals.away}`,
      away: f.teams.away.name,
      note: ""
    }));

  // Parse upcoming fixtures (next 48h)
  const now = Date.now();
  const in48h = now + 48 * 60 * 60 * 1000;
  const upcoming = (fixturesData.response || [])
    .filter(f => {
      const t = new Date(f.fixture.date).getTime();
      return f.fixture.status.short === "NS" && t >= now && t <= in48h;
    })
    .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date))
    .map(f => {
      const d = new Date(f.fixture.date);
      const days = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
      const day = days[d.getDay()];
      const dateStr = `${d.getDate()}.${d.getMonth()+1}`;
      const time = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
      return {
        home: f.teams.home.name,
        away: f.teams.away.name,
        datetime: `${day} ${dateStr} בשעה ${time}`,
        round: f.league.round || ""
      };
    });

  // Parse standings (group stage)
  const groups = standingsData.response?.[0]?.league?.standings || [];
  const groupStandings = groups.map(group =>
    group.map(t => ({
      team: t.team.name,
      group: t.group,
      played: t.all.played,
      won: t.all.win,
      drawn: t.all.draw,
      lost: t.all.lose,
      gf: t.all.goals.for,
      ga: t.all.goals.against,
      pts: t.points
    }))
  );

  return { results, upcoming, groupStandings };
}

// ─── AI analysis prompt ───────────────────────────────────────────────────────
function buildPrompt(footballData) {
  const { results, upcoming, groupStandings } = footballData;

  const resultsText = results.length > 0
    ? results.map(r => `${r.home} ${r.score} ${r.away} (${r.group})`).join(", ")
    : "No results yet";

  const upcomingText = upcoming.length > 0
    ? upcoming.map(u => `${u.home} vs ${u.away} — ${u.datetime}`).join("\n")
    : "No upcoming fixtures in next 48h";

  const standingsText = groupStandings.length > 0
    ? groupStandings.map(g =>
        g.map(t => `${t.team}: ${t.pts}pts (${t.played}G ${t.won}W ${t.drawn}D ${t.lost}L)`).join(", ")
      ).join(" | ")
    : "Standings not available yet";

  return `You are a World Cup 2026 football analyst. Based on the REAL live data below, provide analysis.

LATEST RESULTS: ${resultsText}

UPCOMING FIXTURES (next 48h):
${upcomingText}

GROUP STANDINGS: ${standingsText}

Return ONLY a valid JSON object — no markdown, no backticks:
{
  "lastUpdated": "current date in Hebrew e.g. 16.6.2026 — יום 6",
  "currentStage": "שלב הבתים",
  "standings": [
    {"rank":1,"team":"🇫🇷 צרפת","prob":19,"odds":"+500","trend":"up","note":"brief Hebrew note max 35 chars"}
  ],
  "results": [
    {"group":"A","home":"team name in Hebrew","score":"X–Y","away":"team name in Hebrew","note":""}
  ],
  "bets": [
    {"match":"Home – Away","datetime":"exact Hebrew datetime from fixtures above","pick":"exact scoreline prediction e.g. צרפת מנצחת 2:0","confidence":"high|medium|low","odds":"~X.XX","reason":"Hebrew reasoning max 100 chars"}
  ],
  "analysis": "2-3 Hebrew sentences on key insights from the latest results"
}

RULES:
- standings: top 6 title contenders by win probability
- bets: one bet per upcoming fixture, use EXACT datetime from the data above
- results: use the real scores from the data, translate team names to Hebrew
- Return ONLY valid JSON`;
}

// ─── LLM calls ────────────────────────────────────────────────────────────────
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
        { role: "system", content: "You are a JSON-only API. Respond with a single valid JSON object and nothing else. No markdown, no backticks." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
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
    if (!m) throw new Error("No JSON found");
    return JSON.parse(m[0]);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST() {
  const footballKey = process.env.FOOTBALL_API_KEY;
  const geminiKey   = process.env.GEMINI_API_KEY;
  const groqKey     = process.env.GROQ_API_KEY;

  // Step 1: Fetch real football data
  let footballData = { results: [], upcoming: [], groupStandings: [] };
  if (footballKey) {
    try {
      footballData = await fetchFootballData(footballKey);
    } catch(e) {
      console.error("Football API error:", e.message);
      // Continue without live data — AI will use its own knowledge
    }
  }

  // Step 2: Build prompt with real data
  const prompt = buildPrompt(footballData);

  // Step 3: Get AI analysis — Gemini first, Groq as fallback
  let text = "";
  let provider = "unknown";

  if (geminiKey) {
    try {
      text = await callGemini(geminiKey, prompt);
      provider = "gemini";
    } catch(e) {
      if (e.code !== 429 && !groqKey) {
        return Response.json({ error: "שגיאת Gemini: " + e.message }, { status: 502 });
      }
    }
  }

  if (!text && groqKey) {
    try {
      text = await callGroq(groqKey, prompt);
      provider = "groq";
    } catch(e) {
      return Response.json({ error: "כל ספקי ה-AI אינם זמינים. נסו שוב בעוד מספר דקות." }, { status: 502 });
    }
  }

  if (!text) {
    return Response.json({ error: "לא מוגדר מפתח AI." }, { status: 500 });
  }

  try {
    const parsed = parseJSON(text);
    if (!parsed.standings) throw new Error("Invalid shape");

    // Inject real results if AI didn't return them properly
    if (footballData.results.length > 0 && (!parsed.results || parsed.results.length === 0)) {
      parsed.results = footballData.results;
    }

    return Response.json({ ...parsed, provider }, { headers: { "Cache-Control": "no-store" } });
  } catch(e) {
    return Response.json({ error: "שגיאה בניתוח תשובת ה-AI: " + e.message }, { status: 502 });
  }
}
