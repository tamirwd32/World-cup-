// Node.js runtime — max 60s for Gemini API calls
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a World Cup 2026 analyst. Respond with a JSON object ONLY — no markdown, no backticks, no explanation.

JSON structure:
{
  "lastUpdated": "Hebrew date e.g. 16.6.2026 — יום 6",
  "currentStage": "שלב הבתים | שמינית גמר | רבע גמר | חצי גמר | גמר",
  "standings": [
    { "rank": 1, "team": "flag + Hebrew name", "prob": 19, "odds": "+500", "trend": "up", "note": "Hebrew max 40 chars" }
  ],
  "results": [
    { "group": "A", "home": "Hebrew", "score": "X-Y", "away": "Hebrew", "note": "" }
  ],
  "bets": [
    { "match": "Team A - Team B", "datetime": "Hebrew day + date + exact Israel time e.g. שלישי 16.6 בשעה 22:00", "pick": "prediction WITH exact scoreline e.g. צרפת מנצחת 2:0", "confidence": "high|medium|low", "odds": "~X.XX", "reason": "Hebrew max 110 chars" }
  ],
  "analysis": "2-3 Hebrew sentences"
}

CRITICAL RULES:
- bets: include ALL matches in the next 24 hours. Do not limit. If there are 8 matches, include all 8.
- Each bet must have an exact scoreline in the pick field.
- datetime: convert to Israel time (UTC+3), Hebrew day name.
- currentStage: current tournament stage in Hebrew.
- standings: top 6 by win probability.
- Return ONLY valid JSON, nothing else.`;

export async function POST() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(55000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{
          role: "user",
          parts: [{ text: "2026 FIFA World Cup. Today is June 16, 2026. Group stage matchday 2. Results so far: Mexico 2-0 South Africa, South Korea 2-1 Czechia, Canada 1-1 Bosnia, USA 4-1 Paraguay, Brazil 1-1 Morocco, Scotland 1-0 Haiti, Germany 7-1 Curacao, Ivory Coast 1-0 Ecuador, Netherlands 2-2 Japan, Sweden 5-1 Tunisia, Belgium 0-1 Egypt, Spain 0-0 Cape Verde. Upcoming today (June 16): France vs Senegal 22:00 Israel, Iraq vs Norway 21:00 Israel. Tomorrow (June 17): England vs Croatia 23:00 Israel, Portugal vs DR Congo 20:00 Israel. Provide complete JSON analysis with ALL upcoming bets." }]
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2500 }
      })
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: data?.error?.message || "Gemini API error: " + res.status }, { status: 502 });

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found in: " + clean.substring(0, 300));
      parsed = JSON.parse(match[0]);
    }

    return Response.json(parsed, { headers: { "Cache-Control": "no-store" } });
  } catch(e) {
    return Response.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
