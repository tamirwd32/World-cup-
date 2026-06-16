export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ─── Fetch live data from football-data.org ───────────────────────────────────
async function fetchFootballData(apiKey) {
  const BASE = "https://api.football-data.org/v4";
  const headers = { "X-Auth-Token": apiKey };
  const WC = "WC"; // World Cup competition code

  const [matchesRes, standingsRes] = await Promise.all([
    fetch(`${BASE}/competitions/${WC}/matches?season=2026`, { headers }),
    fetch(`${BASE}/competitions/${WC}/standings?season=2026`, { headers }),
  ]);

  const matchesData = await matchesRes.json();
  const standingsData = await standingsRes.json();

  // Finished matches
  const results = (matchesData.matches || [])
    .filter(m => m.status === "FINISHED")
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
    .slice(0, 16)
    .map(m => ({
      group: m.stage === "GROUP_STAGE" ? (m.group || "בית") : m.stage,
      home: m.homeTeam.shortName || m.homeTeam.name,
      score: `${m.score.fullTime.home}–${m.score.fullTime.away}`,
      away: m.awayTeam.shortName || m.awayTeam.name,
      note: ""
    }));

  // Upcoming fixtures — next 48h
  const now = Date.now();
  const in48h = now + 48 * 60 * 60 * 1000;
  const upcoming = (matchesData.matches || [])
    .filter(m => {
      const t = new Date(m.utcDate).getTime();
      return m.status === "TIMED" || m.status === "SCHEDULED"
        ? t >= now && t <= in48h
        : false;
    })
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
    .map(m => {
      // Convert UTC to Israel time (UTC+3)
      const d = new Date(new Date(m.utcDate).getTime() + 3 * 60 * 60 * 1000);
      const days = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
      const day = days[d.getUTCDay()];
      const dateStr = `${d.getUTCDate()}.${d.getUTCMonth()+1}`;
      const time = `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;
      return {
        home: m.homeTeam.shortName || m.homeTeam.name,
        away: m.awayTeam.shortName || m.awayTeam.name,
        datetime: `${day} ${dateStr} בשעה ${time}`,
        group: m.group || ""
      };
    });

  // Group standings
  const groups = standingsData.standings || [];
  const groupStandings = groups
    .filter(g => g.type === "TOTAL")
    .map(g => g.table.map(t => ({
      team: t.team.shortName || t.team.name,
      group: g.group || "",
      played: t.playedGames,
      won: t.won,
      drawn: t.draw,
      lost: t.lost,
      gf: t.goalsFor,
      ga: t.goalsAgainst,
      pts: t.points
    })));

  return { results, upcoming, groupStandings };
}

// ─── Build AI prompt ──────────────────────────────────────────────────────────
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

  return `You are a World Cup 2026 football analyst. Analyze the REAL live data below.

LATEST RESULTS: ${resultsText}

UPCOMING FIXTURES (next 48h — use these EXACT times):
${upcomingText}

GROUP STANDINGS: ${standingsText}

Return ONLY a valid JSON object — no markdown, no backticks, nothing else:
{
  "lastUpdated": "current Hebrew date e.g. 16.6.2026 — יום 6",
  "currentStage": "שלב הבתים",
  "standings": [
    {"rank":1,"team":"🇫🇷 צרפת","prob":19,"odds":"+500","trend":"up","note":"Hebrew note max 35 chars"}
  ],
  "results": [
    {"group":"A","home":"Hebrew team name","score":"X–Y","away":"Hebrew team name","note":""}
  ],
  "bets": [
    {"match":"Home – Away","datetime":"exact datetime from fixtures above","pick":"prediction WITH scoreline e.g. צרפת מנצחת 2:0","confidence":"high|medium|low","odds":"~X.XX","reason":"Hebrew max 100 chars"}
  ],
  "analysis": "2-3 Hebrew sentences on key insights"
}

RULES:
- bets: one per upcoming fixture, use EXACT datetime from data above
- results: translate team names to Hebrew, use real scores
- standings: top 6 title contenders by win probability
- Return ONLY valid JSON, nothing else`;
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
        { role: "system", content: "You are a JSON-only API. Respond with a single valid JSON object and nothing else. No markdown, no backticks, no text before or after the JSON." },
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
  const footballKey = process.env.FOOTBALL_DATA_KEY;
  const geminiKey   = process.env.GEMINI_API_KEY;
  const groqKey     = process.env.GROQ_API_KEY;

  // Step 1: Fetch real football data
  let footballData = { results: [], upcoming: [], groupStandings: [] };
  if (footballKey) {
    try {
      footballData = await fetchFootballData(footballKey);
    } catch(e) {
      console.error("Football-data.org error:", e.message);
    }
  }

  // Step 2: Build prompt with real data
  const prompt = buildPrompt(footballData);

  // Step 3: AI analysis — Gemini first, Groq fallback
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
    if (!parsed.standings) throw new Error("Invalid response shape");

    // Inject real results if AI skipped them
    if (footballData.results.length > 0 && (!parsed.results || parsed.results.length === 0)) {
      parsed.results = footballData.results;
    }

    return Response.json({ ...parsed, provider }, { headers: { "Cache-Control": "no-store" } });
  } catch(e) {
    return Response.json({ error: "שגיאה בניתוח תשובת ה-AI: " + e.message }, { status: 502 });
  }
}
