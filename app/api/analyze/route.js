// Node.js runtime (not Edge) — required for Gemini API compatibility
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are a World Cup 2026 analyst. You have up-to-date knowledge of all matches played so far. Analyze the current state of the tournament and respond with a JSON object ONLY — no markdown, no backticks, no explanation.

JSON structure:
{
  "lastUpdated": "Hebrew date e.g. 15.6.2026 — יום 5",
  "standings": [
    { "rank": 1, "team": "team name with flag emoji", "prob": 19, "odds": "+500", "trend": "up", "note": "Hebrew note max 40 chars" }
  ],
  "results": [
    { "group": "A", "home": "Hebrew team name", "score": "X–Y", "away": "Hebrew team name", "note": "short Hebrew note or empty string" }
  ],
  "bets": [
    { "match": "Team A – Team B", "datetime": "exact kickoff Israel time Hebrew e.g. שלישי 16.6 בשעה 22:00", "pick": "precise prediction WITH scoreline e.g. צרפת מנצחת 2:0", "confidence": "high|medium|low", "odds": "~X.XX", "reason": "Hebrew max 110 chars" }
  ],
  "analysis": "2-3 Hebrew sentences on key insights"
}

Rules:
- standings: top 6 contenders by win probability, prob values for these 6 sum to ~75
- bets: upcoming matches next 72 hours ONLY, always include exact scoreline in pick
- datetime: Israel time (UTC+3), Hebrew day name + date + time
- confidence: high >70%, medium 55-70%, low <55%
- Return ONLY valid JSON, nothing else.`;

export async function POST() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
  }

  // Use gemini-1.5-flash with grounding disabled — plain generation
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{
          role: "user",
          parts: [{ text: "Based on your knowledge of the 2026 FIFA World Cup (which started June 11, 2026), provide the latest analysis. Today is June 15, 2026. Results so far: Group A: Mexico 2-0 South Africa, South Korea 2-1 Czechia. Group B: Canada 1-1 Bosnia, USA 4-1 Paraguay. Group C: Brazil 1-1 Morocco, Scotland 1-0 Haiti. Group E: Germany 7-1 Curacao, Ivory Coast 1-0 Ecuador. Group F: Netherlands 2-2 Japan, Sweden 5-1 Tunisia. Group G: Belgium 0-1 Egypt. Group H: Spain 0-0 Cape Verde. Upcoming: France vs Senegal June 16 22:00 Israel time, Argentina vs Algeria June 22, England vs Croatia June 17 23:00 Israel time. Return JSON only." }]
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
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
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in response: " + clean.substring(0, 200));
      parsed = JSON.parse(match[0]);
    }

    return Response.json(parsed, { headers: { "Cache-Control": "no-store" } });

  } catch (e) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
