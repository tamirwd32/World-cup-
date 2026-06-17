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
  "Bosnia and Herzegovina":"בוסניה","Qatar":"קטאר","Denmark":"דנמרק",
};

const STATUS_HE = {
  "IN_PLAY":"משחק חי","PAUSED":"הפסקה","HALFTIME":"הפסקה","FINISHED":"הסתיים",
  "TIMED":"לא התחיל","SCHEDULED":"לא התחיל","POSTPONED":"נדחה","SUSPENDED":"מושהה",
};

function ht(name) { return TEAM_HE[name] || name; }

export async function GET() {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) return Response.json({ error: "Missing key" }, { status: 500 });

  try {
    const res = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches?season=2026&status=IN_PLAY,PAUSED,HALFTIME",
      { headers: { "X-Auth-Token": key } }
    );
    const data = await res.json();

    // Also fetch matches finishing soon or just finished (last 3 hours)
    const res2 = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches?season=2026&status=FINISHED",
      { headers: { "X-Auth-Token": key } }
    );
    const data2 = await res2.json();

    const liveMatches = (data.matches || []).map(m => ({
      id: m.id,
      home: ht(m.homeTeam.shortName || m.homeTeam.name),
      away: ht(m.awayTeam.shortName || m.awayTeam.name),
      homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0,
      awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0,
      minute: m.minute || null,
      status: m.status,
      statusHe: STATUS_HE[m.status] || m.status,
      isLive: ["IN_PLAY","PAUSED","HALFTIME"].includes(m.status),
    }));

    // Recent finished (last 3 hours)
    const now = Date.now();
    const recentFinished = (data2.matches || [])
      .filter(m => {
        const t = new Date(m.utcDate).getTime();
        return now - t < 3 * 60 * 60 * 1000;
      })
      .map(m => ({
        id: m.id,
        home: ht(m.homeTeam.shortName || m.homeTeam.name),
        away: ht(m.awayTeam.shortName || m.awayTeam.name),
        homeScore: m.score.fullTime.home,
        awayScore: m.score.fullTime.away,
        minute: 90,
        status: "FINISHED",
        statusHe: "הסתיים",
        isLive: false,
      }));

    const hasLive = liveMatches.length > 0;

    return Response.json({
      hasLive,
      live: liveMatches,
      recentFinished,
      fetchedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });

  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
