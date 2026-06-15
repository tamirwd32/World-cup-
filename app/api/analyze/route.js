export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PROMPT = `You are a World Cup 2026 analyst. Today is June 16 2026, group stage matchday 2. Known results: Mexico 2-0 South Africa, South Korea 2-1 Czechia, Canada 1-1 Bosnia, USA 4-1 Paraguay, Brazil 1-1 Morocco, Scotland 1-0 Haiti, Germany 7-1 Curacao, Ivory Coast 1-0 Ecuador, Netherlands 2-2 Japan, Sweden 5-1 Tunisia, Belgium 0-1 Egypt, Spain 0-0 Cape Verde. Upcoming: France vs Senegal today 22:00 Israel, Iraq vs Norway today 21:00 Israel, England vs Croatia tomorrow 23:00 Israel, Portugal vs DR Congo tomorrow 20:00 Israel.

Return ONLY a JSON object, no markdown:
{
  "lastUpdated": "16.6.2026 — יום 6",
  "currentStage": "שלב הבתים",
  "standings": [
    {"rank":1,"team":"צרפת 🇫🇷","prob":19,"odds":"+500","trend":"up","note":"סגל עמוק"},
    {"rank":2,"team":"גרמניה 🇩🇪","prob":14,"odds":"+1400","trend":"up","note":"7-1 על קוראסאו"},
    {"rank":3,"team":"אנגליה 🏴","prob":13,"odds":"+650","trend":"flat","note":"בית קל"},
    {"rank":4,"team":"ספרד 🇪🇸","prob":12,"odds":"+450","trend":"down","note":"0-0 קייפ ורדה"},
    {"rank":5,"team":"ארגנטינה 🇦🇷","prob":10,"odds":"+900","trend":"flat","note":"מסי בן 39"},
    {"rank":6,"team":"פורטוגל 🇵🇹","prob":9,"odds":"+850","trend":"flat","note":"רונאלדו"}
  ],
  "results": [
    {"group":"E","home":"גרמניה","score":"7-1","away":"קוראסאו","note":"xG 3.91"},
    {"group":"H","home":"ספרד","score":"0-0","away":"קייפ ורדה","note":"הפתעה"},
    {"group":"G","home":"בלגיה","score":"0-1","away":"מצרים","note":""},
    {"group":"D","home":"ארהב","score":"4-1","away":"פרגוואי","note":""},
    {"group":"C","home":"ברזיל","score":"1-1","away":"מרוקו","note":"ויניסיוס הציל"},
    {"group":"F","home":"הולנד","score":"2-2","away":"יפן","note":"דרמטי"}
  ],
  "bets": [
    {"match":"צרפת - סנגל","datetime":"שלישי 16.6 בשעה 22:00","pick":"צרפת מנצחת 2:0","confidence":"high","odds":"~2.10","reason":"מבאפה ואוליז חדים, סגל עמוק לעומת הגנת סנגל"},
    {"match":"עיראק - נורווגיה","datetime":"שלישי 16.6 בשעה 21:00","pick":"נורווגיה מנצחת 2:0","confidence":"high","odds":"~1.70","reason":"הלאנד מול הגנה חלשה של עיראק"},
    {"match":"אנגליה - קרואטיה","datetime":"רביעי 17.6 בשעה 23:00","pick":"אנגליה מנצחת 2:1","confidence":"medium","odds":"~3.40","reason":"קיין בשיאו, קרואטיה מזדקנת"},
    {"match":"פורטוגל - קונגו DR","datetime":"רביעי 17.6 בשעה 20:00","pick":"פורטוגל מנצחת 3:0","confidence":"high","odds":"~1.50","reason":"רונאלדו + ליאו מול נבחרת חלשה"}
  ],
  "analysis": "ספרד 0:0 עם קייפ ורדה — דפוס מדאיג חוזר. גרמניה 7:1 מרשים. צרפת המועמדת הראשית לפני יום 6."
}`;

export async function POST() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: PROMPT }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2000 }
      })
    });

    const data = await res.json();

    // Specific handling for rate limit (429)
    if (res.status === 429) {
      return Response.json({ error: "המכסה היומית של Gemini נוצלה. נסו שוב בעוד כמה דקות.", rateLimited: true }, { status: 429 });
    }

    if (!res.ok) {
      return Response.json({ error: data?.error?.message || ("Gemini error " + res.status) }, { status: 502 });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      const m = clean.match(/\{[\s\S]*\}/);
      if (!m) {
        // Do NOT fall back to the prompt template — return a clear error
        return Response.json({ error: "Gemini החזיר תשובה לא תקינה. נסו שוב." }, { status: 502 });
      }
      try {
        parsed = JSON.parse(m[0]);
      } catch {
        return Response.json({ error: "Gemini החזיר JSON שבור. נסו שוב." }, { status: 502 });
      }
    }

    // Validate the response has the expected shape
    if (!parsed.standings || !Array.isArray(parsed.standings)) {
      return Response.json({ error: "תשובת Gemini חסרה נתונים. נסו שוב." }, { status: 502 });
    }

    return Response.json(parsed, { headers: { "Cache-Control": "no-store" } });
  } catch(e) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
