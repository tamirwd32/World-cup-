export const dynamic = "force-dynamic";
export const maxDuration = 15;

const TEAM_HE = {
  "France":"צרפת","Germany":"גרמניה","England":"אנגליה","Spain":"ספרד",
  "Argentina":"ארגנטינה","Portugal":"פורטוגל","Brazil":"ברזיל","Netherlands":"הולנד",
  "Belgium":"בלגיה","Croatia":"קרואטיה","Uruguay":"אורוגוואי","Mexico":"מקסיקו",
  "USA":"ארהב","United States":"ארהב","Canada":"קנדה","Morocco":"מרוקו",
  "Japan":"יפן","South Korea":"קוריאה","Korea Republic":"קוריאה","Senegal":"סנגל",
  "Norway":"נורווגיה","Sweden":"שוודיה","Switzerland":"שווייץ","Czechia":"צ'כיה",
  "Cape Verde":"קייפ ורדה","Ivory Coast":"חוף השנהב","Curacao":"קוראסאו",
  "Paraguay":"פרגוואי","Turkey":"טורקיה","Austria":"אוסטריה","Algeria":"אלג'יריה",
  "Jordan":"ירדן","Congo DR":"קונגו DR","DR Congo":"קונגו DR","New Zealand":"ניו זילנד",
  "Iraq":"עיראק","Haiti":"האיטי","Scotland":"סקוטלנד","South Africa":"דרום אפריקה",
  "Egypt":"מצרים","Tunisia":"תוניסיה","Ghana":"גאנה","Saudi Arabia":"ערב הסעודית",
  "Ecuador":"אקוודור","Colombia":"קולומביה","Panama":"פנמה","Uzbekistan":"אוזבקיסטן",
  "Bosnia and Herzegovina":"בוסניה","Qatar":"קטאר",
};

const STATUS_HE = {
  "IN_PLAY":"⚽ משחק חי","PAUSED":"⏸ הפסקה","HALFTIME":"⏸ הפסקה",
  "FINISHED":"✅ הסתיים","TIMED":"⏰ לא התחיל","SCHEDULED":"⏰ לא התחיל",
};

function ht(name) { return TEAM_HE[name] || name; }

export async function GET() {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) return Response.json({ error: "Missing key" }, { status: 500 });

  const headers = { "X-Auth-Token": key };
  const BASE = "https://api.football-data.org/v4";

  try {
    // Fetch ALL WC matches and filter locally — avoids unsupported multi-status param
    const res = await fetch(`${BASE}/competitions/WC/matches?season=2026`, { headers });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "API error " + res.status);

    const all = data.matches || [];
    const now = Date.now();

    // Live right now
    const liveStatuses = ["IN_PLAY","PAUSED","HALFTIME"];
    const live = all
      .filter(m => liveStatuses.includes(m.status))
      .map(m => ({
        home: ht(m.homeTeam.shortName || m.homeTeam.name),
        away: ht(m.awayTeam.shortName || m.awayTeam.name),
        homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0,
        awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0,
        minute: m.minute || null,
        status: m.status,
        statusHe: STATUS_HE[m.status] || m.status,
        isLive: true,
      }));

    // Finished in last 3 hours
    const recentFinished = all
      .filter(m => {
        if (m.status !== "FINISHED") return false;
        const t = new Date(m.utcDate).getTime();
        return now - t < 3 * 60 * 60 * 1000;
      })
      .sort((a,b) => new Date(b.utcDate) - new Date(a.utcDate))
      .map(m => ({
        home: ht(m.homeTeam.shortName || m.homeTeam.name),
        away: ht(m.awayTeam.shortName || m.awayTeam.name),
        homeScore: m.score.fullTime.home,
        awayScore: m.score.fullTime.away,
        statusHe: "✅ הסתיים",
        isLive: false,
      }));

    return Response.json({
      hasLive: live.length > 0,
      live,
      recentFinished,
      fetchedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });

  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
