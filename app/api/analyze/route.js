// Node.js runtime
export const dynamic = "force-dynamic";

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
    { "match": "Team A - Team B", "datetime": "Hebrew day + date + Israel time e.g. שלישי 16.6 בשעה 22:00", "pick": "prediction WITH exact scoreline e.g. צרפת מנצחת 2:0", "confidence": "high|medium|low", "odds": "~X.XX", "reason": "Hebrew max 110 chars" }
  ],
  "analysis": "2-3 Hebrew sentences"
}

CRITICAL RULES:
- bets: include ALL matches in the next 24 hours. Do not limit to 2 or 4. If there are 8 matches today, include all 8.
- Each bet must have an exact scoreline in the pick field (never just win/draw/loss).
- datetime: convert to Israel time (UTC+3), Hebrew day name.
- currentStage: the current tournament stage in Hebrew (שלב הבתים during group stage).
- standings: top 6 by win probability.
- Return ONLY valid JSON.`;

export async function POST() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{
          role: "user",
          parts: [{ text: "2026 FIFA World Cup analysis. Today is June 16, 2026. We are in the group stage (Matchday 2 starts today). Results so far — Group A: Mexico 2-0 South Africa, South Korea 2-1 Czechia. Group B: Canada 1-1 Bosnia, USA 4-1 Paraguay. Group C: Brazil 1-1 Morocco, Scotland 1-0 Haiti. Group E: Germany 7-1 Curacao, Ivory Coast 1-0 Ecuador. Group F: Netherlands 2-2 Japan, Sweden 5-1 Tunisia. Group G: Belgium 0-1 Egypt, Iran vs New Zealand played. Group H: Spain 0-0 Cape Verde, Saudi Arabia vs Uruguay played. Group I: France vs Senegal TODAY 22:00 Israel time, Iraq vs Norway TODAY 21:00 Israel time. Group J: Argentina vs Algeria TODAY 02:00 Israel time (June 17 technically), Austria vs Jordan TODAY 05:00 Israel time. List ALL of today and tomorrow matches with exact Israel kickoff times. Provide full analysis and ALL bets for next 24 hours. Return JSON only." }]
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 3000 }
      })
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: data?.error?.message || "Gemini error" }, { status: 502 });

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON: " + clean.substring(0, 200));
      parsed = JSON.parse(match[0]);
    }

    return Response.json(parsed, { headers: { "Cache-Control": "no-store" } });
  } catch(e) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
