export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Team name translations
const TEAM_HE = {
  "France":"צרפת","Germany":"גרמניה","England":"אנגליה","Spain":"ספרד",
  "Argentina":"ארגנטינה","Portugal":"פורטוגל","Brazil":"ברזיל","Netherlands":"הולנד",
  "Belgium":"בלגיה","Croatia":"קרואטיה","Uruguay":"אורוגוואי","Mexico":"מקסיקו",
  "USA":"ארה\"ב","United States":"ארה\"ב","Canada":"קנדה","Morocco":"מרוקו",
  "Japan":"יפן","South Korea":"קוריאה","Senegal":"סנגל","Norway":"נורווגיה",
  "France":"צרפת","Germany":"גרמניה","Sweden":"שוודיה","Denmark":"דנמרק",
  "Switzerland":"שווייץ","Poland":"פולין","Serbia":"סרביה","Ukraine":"אוקראינה",
  "Ecuador":"אקוודור","Colombia":"קולומביה","Chile":"צ'ילה","Peru":"פרו",
  "Australia":"אוסטרליה","Iran":"איראן","Japan":"יפן","Saudi Arabia":"ערב הסעודית",
  "Egypt":"מצרים","Tunisia":"תוניסיה","Cameroon":"קמרון","Ghana":"גאנה",
  "Senegal":"סנגל","Morocco":"מרוקו","South Africa":"דרום אפריקה",
  "Czechia":"צ'כיה","Bosnia and Herzegovina":"בוסניה","Bosnia-H.":"בוסניה",
  "Qatar":"קטאר","South Korea":"קוריאה","Korea Republic":"קוריאה",
  "Cape Verde":"קייפ ורדה","Ivory Coast":"חוף השנהב","Curacao":"קוראסאו",
  "Paraguay":"פרגוואי","Turkey":"טורקיה","Austria":"אוסטריה","Algeria":"אלג'יריה",
  "Jordan":"ירדן","Congo DR":"קונגו DR","DR Congo":"קונגו DR",
  "New Zealand":"ניו זילנד","Iraq":"עיראק","Haiti":"האיטי","Scotland":"סקוטלנד",
  "Uzbekistan":"אוזבקיסטן","Panama":"פנמה","Portugal":"פורטוגל"
};

const GROUP_HE = {
  "GROUP_A":"בית A","GROUP_B":"בית B","GROUP_C":"בית C","GROUP_D":"בית D",
  "GROUP_E":"בית E","GROUP_F":"בית F","GROUP_G":"בית G","GROUP_H":"בית H",
  "GROUP_I":"בית I","GROUP_J":"בית J","GROUP_K":"בית K","GROUP_L":"בית L",
};

const STAGE_HE = {
  "GROUP_STAGE":"שלב הבתים","LAST_16":"שמינית גמר","QUARTER_FINALS":"רבע גמר",
  "SEMI_FINALS":"חצי גמר","FINAL":"גמר","THIRD_PLACE":"מקום שלישי"
};

function heTeam(name) {
  return TEAM_HE[name] || name;
}

function heGroup(g) {
  return GROUP_HE[g] || g?.replace("GROUP_","בית ") || "";
}

export async function GET() {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) return Response.json({ error: "Missing FOOTBALL_DATA_KEY" }, { status: 500 });

  const BASE = "https://api.football-data.org/v4";
  const headers = { "X-Auth-Token": key };

  try {
    const [matchesRes, standingsRes] = await Promise.all([
      fetch(`${BASE}/competitions/WC/matches?season=2026`, { headers }),
      fetch(`${BASE}/competitions/WC/standings?season=2026`, { headers }),
    ]);

    const matchesData = await matchesRes.json();
    const standingsData = await standingsRes.json();

    if (!matchesRes.ok) throw new Error(matchesData.message || "Matches API error");

    const allMatches = matchesData.matches || [];

    // ── Results (finished) ──
    const results = allMatches
      .filter(m => m.status === "FINISHED")
      .sort((a,b) => new Date(b.utcDate) - new Date(a.utcDate))
      .slice(0, 24)
      .map(m => ({
        group: heGroup(m.group),
        stage: STAGE_HE[m.stage] || m.stage,
        home: heTeam(m.homeTeam.shortName || m.homeTeam.name),
        homeEn: m.homeTeam.shortName || m.homeTeam.name,
        score: `${m.score.fullTime.home}–${m.score.fullTime.away}`,
        away: heTeam(m.awayTeam.shortName || m.awayTeam.name),
        awayEn: m.awayTeam.shortName || m.awayTeam.name,
        date: m.utcDate,
      }));

    // ── Upcoming fixtures (next 72h) ──
    const now = Date.now();
    const in72h = now + 72 * 60 * 60 * 1000;
    const upcoming = allMatches
      .filter(m => {
        const t = new Date(m.utcDate).getTime();
        return (m.status === "TIMED" || m.status === "SCHEDULED") && t >= now && t <= in72h;
      })
      .sort((a,b) => new Date(a.utcDate) - new Date(b.utcDate))
      .map(m => {
        const d = new Date(new Date(m.utcDate).getTime() + 3*60*60*1000);
        const days = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
        const day = days[d.getUTCDay()];
        const dateStr = `${d.getUTCDate()}.${d.getUTCMonth()+1}`;
        const time = `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;
        return {
          home: heTeam(m.homeTeam.shortName || m.homeTeam.name),
          homeEn: m.homeTeam.shortName || m.homeTeam.name,
          away: heTeam(m.awayTeam.shortName || m.awayTeam.name),
          awayEn: m.awayTeam.shortName || m.awayTeam.name,
          datetime: `${day} ${dateStr} בשעה ${time}`,
          isoDate: m.utcDate,
          group: heGroup(m.group),
          stage: STAGE_HE[m.stage] || m.stage,
        };
      });

    // ── All future fixtures (for schedule tab) ──
    const schedule = allMatches
      .filter(m => m.status === "TIMED" || m.status === "SCHEDULED")
      .sort((a,b) => new Date(a.utcDate) - new Date(b.utcDate))
      .slice(0, 40)
      .map(m => {
        const d = new Date(new Date(m.utcDate).getTime() + 3*60*60*1000);
        const days = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
        const months = ["ינו","פבר","מרץ","אפר","מאי","יוני","יולי","אוג","ספט","אוק","נוב","דצמ"];
        return {
          home: heTeam(m.homeTeam.shortName || m.homeTeam.name),
          away: heTeam(m.awayTeam.shortName || m.awayTeam.name),
          day: days[d.getUTCDay()],
          date: `${d.getUTCDate()} ${months[d.getUTCMonth()]}`,
          time: `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`,
          group: heGroup(m.group),
          stage: STAGE_HE[m.stage] || m.stage,
          isoDate: m.utcDate,
        };
      });

    // ── Group standings ──
    const groups = (standingsData.standings || [])
      .filter(g => g.type === "TOTAL")
      .map(g => ({
        group: heGroup(g.group) || g.group,
        table: g.table.map((t,i) => ({
          pos: i+1,
          team: heTeam(t.team.shortName || t.team.name),
          played: t.playedGames,
          won: t.won,
          drawn: t.draw,
          lost: t.lost,
          gf: t.goalsFor,
          ga: t.goalsAgainst,
          gd: t.goalDifference,
          pts: t.points,
          qualified: i < 2, // top 2 qualify
        }))
      }));

    // ── Current stage ──
    const stages = [...new Set(allMatches.filter(m=>m.status==="FINISHED").map(m=>m.stage))];
    const lastStage = stages[stages.length-1] || "GROUP_STAGE";
    const currentStage = STAGE_HE[lastStage] || "שלב הבתים";

    // ── Bracket (knockout) ──
    const knockoutMatches = allMatches
      .filter(m => !["GROUP_STAGE"].includes(m.stage))
      .sort((a,b) => new Date(a.utcDate) - new Date(b.utcDate))
      .map(m => {
        const d = new Date(new Date(m.utcDate).getTime() + 3*60*60*1000);
        return {
          stage: STAGE_HE[m.stage] || m.stage,
          home: heTeam(m.homeTeam.shortName || m.homeTeam.name),
          away: heTeam(m.awayTeam.shortName || m.awayTeam.name),
          score: m.status==="FINISHED" ? `${m.score.fullTime.home}–${m.score.fullTime.away}` : null,
          status: m.status,
          date: `${d.getUTCDate()}.${d.getUTCMonth()+1} ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`,
        };
      });

    return Response.json({
      currentStage,
      results,
      upcoming,
      schedule,
      groups,
      knockoutMatches,
      finishedCount: results.length,
      upcomingCount: upcoming.length,
    }, { headers: { "Cache-Control": "no-store" } });

  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
