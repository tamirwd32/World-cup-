export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

const GROUP_HE = {
  "GROUP_A":"בית A","GROUP_B":"בית B","GROUP_C":"בית C","GROUP_D":"בית D",
  "GROUP_E":"בית E","GROUP_F":"בית F","GROUP_G":"בית G","GROUP_H":"בית H",
  "GROUP_I":"בית I","GROUP_J":"בית J","GROUP_K":"בית K","GROUP_L":"בית L",
};

const STAGE_HE = {
  "GROUP_STAGE":"שלב הבתים","LAST_32":"שלב 32","LAST_16":"שלב 16",
  "QUARTER_FINALS":"רבע גמר","SEMI_FINALS":"חצי גמר",
  "THIRD_PLACE":"מקום שלישי","FINAL":"גמר"
};

const STAGE_ORDER = ["GROUP_STAGE","LAST_32","LAST_16","QUARTER_FINALS","SEMI_FINALS","THIRD_PLACE","FINAL"];

function ht(name) { return TEAM_HE[name] || name; }
function hg(g) { return GROUP_HE[g] || g?.replace("GROUP_","בית ") || ""; }

function fmtDate(utcDate) {
  const d = new Date(new Date(utcDate).getTime() + 3*60*60*1000);
  const days = ["א","ב","ג","ד","ה","ו","ש"];
  const months = ["ינו","פבר","מרץ","אפר","מאי","יוני","יולי","אוג","ספט","אוק","נוב","דצמ"];
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]} ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;
}

export async function GET() {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) return Response.json({ error: "Missing FOOTBALL_DATA_KEY" }, { status: 500 });

  const BASE = "https://api.football-data.org/v4";
  const headers = { "X-Auth-Token": key };

  try {
    const [matchesRes, scorersRes] = await Promise.all([
      fetch(`${BASE}/competitions/WC/matches?season=2026`, { headers }),
      fetch(`${BASE}/competitions/WC/scorers?season=2026&limit=20`, { headers }),
    ]);
    const matchesData = await matchesRes.json();
    const scorersData = await scorersRes.json();
    if (!matchesRes.ok) throw new Error(matchesData.message || "API error");

    const allMatches = matchesData.matches || [];

    // Top scorers
    const scorers = (scorersData.scorers || []).map((s, i) => ({
      pos: i + 1,
      name: s.player?.name || "—",
      team: ht(s.team?.name || ""),
      goals: s.goals || 0,
      assists: s.assists || 0,
      penalties: s.penalties || 0,
    }));
    const now = Date.now();

    // ── Current stage ──
    const finishedStages = [...new Set(allMatches.filter(m=>m.status==="FINISHED").map(m=>m.stage))];
    const liveStages = [...new Set(allMatches.filter(m=>["IN_PLAY","PAUSED","HALFTIME"].includes(m.status)).map(m=>m.stage))];
    const allActiveStages = [...new Set([...finishedStages, ...liveStages])];
    const lastStage = STAGE_ORDER.filter(s=>allActiveStages.includes(s)).pop() || "GROUP_STAGE";
    const currentStage = STAGE_HE[lastStage] || "שלב הבתים";

    // ── Bracket: all knockout matches ──
    const bracket = {};
    const knockoutStages = ["LAST_32","LAST_16","QUARTER_FINALS","SEMI_FINALS","THIRD_PLACE","FINAL"];

    knockoutStages.forEach(stage => {
      const matches = allMatches
        .filter(m => m.stage === stage)
        .sort((a,b) => new Date(a.utcDate) - new Date(b.utcDate))
        .map(m => {
          const isLive = ["IN_PLAY","PAUSED","HALFTIME"].includes(m.status);
          const isFinished = m.status === "FINISHED";
          const homeScore = isFinished ? m.score.fullTime.home : (isLive ? (m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? null) : null);
          const awayScore = isFinished ? m.score.fullTime.away : (isLive ? (m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? null) : null);
          const homeWon = isFinished && homeScore > awayScore;
          const awayWon = isFinished && awayScore > homeScore;
          return {
            home: ht(m.homeTeam.shortName || m.homeTeam.name),
            away: ht(m.awayTeam.shortName || m.awayTeam.name),
            homeScore,
            awayScore,
            homeWon,
            awayWon,
            status: m.status,
            isLive,
            isFinished,
            isTimed: m.status === "TIMED" || m.status === "SCHEDULED",
            date: fmtDate(m.utcDate),
            isoDate: m.utcDate,
          };
        });

      if (matches.length > 0) {
        bracket[stage] = {
          label: STAGE_HE[stage] || stage,
          matches,
          finished: matches.filter(m=>m.isFinished).length,
          live: matches.filter(m=>m.isLive).length,
          total: matches.length,
        };
      }
    });

    // ── Group standings (built from match results) ──
    const teamStats = {};
    allMatches
      .filter(m => m.stage === "GROUP_STAGE")
      .forEach(m => {
        const g = m.group;
        const hKey = `${g}|${m.homeTeam.shortName || m.homeTeam.name}`;
        const aKey = `${g}|${m.awayTeam.shortName || m.awayTeam.name}`;
        const init = (key, name) => {
          if (!teamStats[key]) teamStats[key] = { group:g, name, played:0, won:0, drawn:0, lost:0, gf:0, ga:0, pts:0 };
        };
        init(hKey, m.homeTeam.shortName || m.homeTeam.name);
        init(aKey, m.awayTeam.shortName || m.awayTeam.name);
        if (m.status === "FINISHED") {
          const hG = m.score.fullTime.home, aG = m.score.fullTime.away;
          teamStats[hKey].played++; teamStats[aKey].played++;
          teamStats[hKey].gf += hG; teamStats[hKey].ga += aG;
          teamStats[aKey].gf += aG; teamStats[aKey].ga += hG;
          if (hG > aG) { teamStats[hKey].won++; teamStats[hKey].pts+=3; teamStats[aKey].lost++; }
          else if (hG === aG) { teamStats[hKey].drawn++; teamStats[hKey].pts++; teamStats[aKey].drawn++; teamStats[aKey].pts++; }
          else { teamStats[aKey].won++; teamStats[aKey].pts+=3; teamStats[hKey].lost++; }
        }
      });

    const groupMap = {};
    Object.values(teamStats).forEach(t => {
      if (!groupMap[t.group]) groupMap[t.group] = [];
      groupMap[t.group].push(t);
    });
    const groups = Object.keys(groupMap).sort().map(g => ({
      group: hg(g), groupKey: g,
      table: groupMap[g]
        .sort((a,b) => b.pts-a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf)
        .map((t,i) => ({ pos:i+1, team:ht(t.name), played:t.played, won:t.won, drawn:t.drawn, lost:t.lost, gf:t.gf, ga:t.ga, gd:t.gf-t.ga, pts:t.pts, qualified:i<2 }))
    }));

    // ── Results ──
    const results = allMatches
      .filter(m => m.status === "FINISHED")
      .sort((a,b) => new Date(b.utcDate) - new Date(a.utcDate))
      .slice(0, 24)
      .map(m => ({
        group: hg(m.group) || (STAGE_HE[m.stage] || m.stage),
        home: ht(m.homeTeam.shortName || m.homeTeam.name),
        score: `${m.score.fullTime.home}–${m.score.fullTime.away}`,
        away: ht(m.awayTeam.shortName || m.awayTeam.name),
        date: m.utcDate,
      }));

    // ── Upcoming 72h ──
    const in72h = now + 72*60*60*1000;
    const upcoming = allMatches
      .filter(m => { const t=new Date(m.utcDate).getTime(); return (m.status==="TIMED"||m.status==="SCHEDULED") && t>=now && t<=in72h; })
      .sort((a,b) => new Date(a.utcDate)-new Date(b.utcDate))
      .map(m => ({
        home: ht(m.homeTeam.shortName||m.homeTeam.name),
        away: ht(m.awayTeam.shortName||m.awayTeam.name),
        datetime: fmtDate(m.utcDate),
        group: hg(m.group)||(STAGE_HE[m.stage]||m.stage),
        isoDate: m.utcDate,
      }));

    // ── Schedule ──
    const months=["ינו","פבר","מרץ","אפר","מאי","יוני","יולי","אוג","ספט","אוק","נוב","דצמ"];
    const days2=["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
    const schedule = allMatches
      .filter(m => m.status==="TIMED"||m.status==="SCHEDULED")
      .sort((a,b)=>new Date(a.utcDate)-new Date(b.utcDate))
      .slice(0,30)
      .map(m => {
        const d=new Date(new Date(m.utcDate).getTime()+3*60*60*1000);
        return {
          home: ht(m.homeTeam.shortName||m.homeTeam.name),
          away: ht(m.awayTeam.shortName||m.awayTeam.name),
          day: days2[d.getUTCDay()],
          date: `${d.getUTCDate()} ${months[d.getUTCMonth()]}`,
          time: `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`,
          group: hg(m.group)||(STAGE_HE[m.stage]||m.stage),
        };
      });

    return Response.json({
      currentStage, bracket, groups, results, upcoming, schedule, scorers,
      finishedCount: results.length,
    }, { headers: { "Cache-Control": "no-store" } });

  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
