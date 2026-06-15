// Server-side route. The Gemini API key lives ONLY here, via process.env.
// It is never sent to the browser. This is what keeps the key safe.

export const runtime = "edge";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are a World Cup 2026 football analyst. Use Google Search to find the latest 2026 FIFA World Cup match results, standings, and upcoming fixtures. Then respond with a JSON object ONLY — no markdown, no backticks, no text before or after.

JSON structure:
{
  "lastUpdated": "Hebrew date string e.g. 15.6.2026 — יום 5",
  "standings": [
    { "rank": 1, "team": "team name with flag emoji", "prob": 19, "odds": "+500", "trend": "up", "note": "Hebrew note max 40 chars" }
  ],
  "results": [
    { "group": "A", "home": "team in Hebrew", "score": "X–Y", "away": "team in Hebrew", "note": "short Hebrew note or empty" }
  ],
  "bets": [
    { "match": "Team A – Team B", "datetime": "exact kickoff in Israel time, Hebrew e.g. שלישי 16.6, 22:00", "pick": "precise prediction in Hebrew INCLUDING exact scoreline e.g. צרפת מנצחת 2:0", "confidence": "high|medium|low", "odds": "~X.XX", "reason": "Hebrew reasoning max 110 chars" }
  ],
  "analysis": "2-3 sentences in Hebrew on key insights from latest results"
}

Rules:
- standings: top 6 title contenders, ordered by your win-probability estimate
- bets: ONLY upcoming matches in the next 72 hours. ALWAYS include a precise predicted scoreline in the pick field (e.g. "צרפת מנצחת 2:0", "תיקו 1:1"), not just win/draw/loss.
- datetime: convert kickoff to Israel time (UTC+3) and state the exact day + time in Hebrew.
- confidence: high = >70%, medium = 55-70%, low = <55%
- trend: up = better than expected, down = worse, flat = as expected
- Respond ONLY with valid JSON.`;

export async function POST() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{
          role: "user",
          parts: [{ text: "Search for the latest 2026 FIFA World Cup results today and the next fixtures, then analyze. Return JSON only." }]
        }],
        tools: [{ googleSearch: {} }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2000 }
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json({ error: data?.error?.message || "Gemini error" }, { status: 502 });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      // Try to extract the first JSON object if model added stray text
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in response");
      parsed = JSON.parse(match[0]);
    }

    return Response.json(parsed, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (e) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
