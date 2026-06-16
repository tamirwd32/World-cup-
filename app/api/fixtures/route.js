export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TEAM_HE = {
  "France":"צרפת","Germany":"גרמניה","England":"אנגליה","Spain":"ספרד",
  "Argentina":"ארגנטינה","Portugal":"פורטוגל","Brazil":"ברזיל","Netherlands":"הולנד",
  "Belgium":"בלגיה","Croatia":"קרואטיה","Uruguay":"אורוגוואי","Mexico":"מקסיקו",
  "USA":"ארה\"ב","United States":"ארה\"ב","Canada":"קנדה","Morocco":"מרוקו",
  "Japan":"יפן","South Korea":"קוריאה","Korea Republic":"קוריאה","Senegal":"סנגל",
  "Norway":"נורווגיה","Sweden":"שוודיה","Denmark":"דנמרק","Switzerland":"שווייץ",
  "Poland":"פולין","Serbia":"סרביה","Ecuador":"אקוודור","Colombia":"קולומביה",
  "Australia":"אוסטרליה","Iran":"איראן","Saudi Arabia":"ערב הסעודית","Egypt":"מצרים",
  "Tunisia":"תוניסיה","Ghana":"גאנה","Senegal":"סנגל","Morocco":"מרוקו",
  "South Africa":"דרום אפריקה","Czechia":"צ'כיה","Bosnia and Herzegovina":"בוסניה",
  "Bosnia-H.":"בוסניה","Qatar":"קטאר","Cape Verde":"קייפ ורדה",
  "Ivory Coast":"חוף השנהב","Curacao":"קוראסאו","Paraguay":"פרגוואי",
  "Turkey":"טורקיה","Austria":"אוסטריה","Algeria":"אלג'יריה","Jordan":"ירדן",
  "Congo DR":"קונגו DR","DR Congo":"קונגו DR","New Zealand":"ניו זילנד",
  "Iraq":"עיראק","Haiti":"האיטי","Scotland":"סקוטלנד","Uzbekistan":"אוזבקיסטן",
  "Panama":"פנמה","Cameroon":"קמרון","Chile":"צ'ילה","Peru":"פרו",
  "Ukraine":"אוקראינה","Sweden":"שוודיה","Costa Rica":"קוסטה ריקה",
};

const GROUP_HE = {
  "GROUP_A":"בית A","GROUP_B":"בית B","GROUP_C":"בית C","GROUP_D":"בית D",
  "GROUP_E":"בית E","GROUP_F":"בית F","GROUP_G":"בית G","GROUP_H":"בית H",
  "GROUP_I":"בית I","GROUP_J":"בית J","GROUP_K":"בית K","GROUP_L":"בית L",
};

const STAGE_HE = {
  "GROUP_STAGE":"שלב הבתים","LAST_16":"שמינית גמר",
  "QUARTER_FINALS":"רבע גמר","SEMI_FINALS":"חצי גמר",
  "FINAL":"גמר","THIRD_PLACE":"מקום שלישי"
};

function ht(name) { return TEAM_HE[name] || name; }
function hg(g) { return GROUP_HE[g] || g?.replace("GROUP_","בית ") || ""; }

export async function GET() {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) return Response.json({ error: "Missing FOOTBALL_DATA_KEY" }, { status: 500 });

  const BASE = "https://api.football-data.org/v4";
  const headers = { "X-Auth-Token": key };

  try {
    const matchesRes = await fetch(`${BASE}/competitions/WC/matches?season=2026`, { headers });
    const matchesData = await matchesRes.json();
    if (!matchesRes.ok) throw new Error(matchesData.message || "API error");

    const allMatches = matchesData.matches || [];

    // ── Build group standings from match results ──
    const teamStats = {}; // key: "GROUP_A|Germany"

    allMatches
      .filter(m => m.stage === "GROUP_STAGE" && m.status === "FINISHED")
      .forEach(m => {
        const g = m.group;
        const hKey = `${g}|${m.homeTeam.shortName || m.homeTeam.name}`;
        const aKey = `${g}|${m.awayTeam.shortName || m.awayTeam.name}`;
        const hg_val = m.goals?.home ?? m.score?.fullTime?.home;
        const ag_val = m.goals?.away ?? m.score?.fullTime?.away;
        const hGoals = Number(hg_val);
        const aGoals = Number(ag_val);

        const init = (key, group, name) => {
          if (!teamStats[key]) teamStats[key] = {
            group, name, played:0, won:0, drawn:0, lost:0, gf:0, ga:0, pts:0
          };
        };
        init(hKey, g, m.homeTeam.shortName || m.homeTeam.name);
        init(aKey, g, m.awayTeam.shortName || m.awayTeam.name);

        teamStats[hKey].played++; teamStats[aKey].played++;
        teamStats[hKey].gf += hGoals; teamStats[hKey].ga += aGoals;
        teamStats[aKey].gf += aGoals; teamStats[aKey].ga += hGoals;

        if (hGoals > aGoals) {
          teamStats[hKey].won++; teamStats[hKey].pts += 3;
          teamStats[aKey].lost++;
        } else if (hGoals === aGoals) {
          teamStats[hKey].drawn++; teamStats[hKey].pts++;
          teamStats[aKey].drawn++; teamStats[aKey].pts++;
        } else {
          teamStats[aKey].won++; teamStats[aKey].pts += 3;
          teamStats[hKey].lost++;
        }
      });

    // Add teams that haven't played yet (from upcoming group matches)
    allMatches
      .filter(m => m.stage === "GROUP_STAGE")
      .forEach(m => {
        const g = m.group;
        [
          { key: `${g}|${m.homeTeam.shortName || m.homeTeam.name}`, name: m.homeTeam.shortName || m.homeTeam.name },
          { key: `${g}|${m.awayTeam.shortName || m.awayTeam.name}`, name: m.awayTeam.shortName || m.awayTeam.name }
        ].forEach(({ key, name }) => {
          if (!teamStats[key]) teamStats[key] = { group: g, name, played:0, won:0, drawn:0, lost:0, gf:0, ga:0, pts:0 };
        });
      });

    // Group and sort
    const groupMap = {};
    Object.values(teamStats).forEach(t => {
      if (!groupMap[t.group]) groupMap[t.group] = [];
      groupMap[t.group].push(t);
    });

    const groups = Object.keys(groupMap).sort().map(g => ({
      group: hg(g),
      groupKey: g,
      table: groupMap[g]
        .sort((a,b) => b.pts - a.pts || (b.gf-b.ga) - (a.gf-a.ga) || b.gf - a.gf)
        .map((t,i) => ({
          pos: i+1,
          team: ht(t.name),
          played: t.played,
          won: t.won,
          drawn: t.drawn,
          lost: t.lost,
          gf: t.gf,
          ga: t.ga,
          gd: t.gf - t.ga,
          pts: t.pts,
          qualified: i < 2,
        }))
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
      }));

    // ── Upcoming (next 72h) ──
    const now = Date.now();
    const in72h = now + 72*60*60*1000;
    const upcoming = allMatches
      .filter(m => {
        const t = new Date(m.utcDate).getTime();
        return (m.status==="TIMED"||m.status==="SCHEDULED") && t>=now && t<=in72h;
      })
      .sort((a,b) => new Date(a.utcDate)-new Date(b.utcDate))
      .map(m => {
        const d = new Date(new Date(m.utcDate).getTime()+3*60*60*1000);
        const days=["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
        return {
          home: ht(m.homeTeam.shortName||m.homeTeam.name),
          away: ht(m.awayTeam.shortName||m.awayTeam.name),
          datetime: `${days[d.getUTCDay()]} ${d.getUTCDate()}.${d.getUTCMonth()+1} בשעה ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`,
          group: hg(m.group)||"",
          isoDate: m.utcDate,
        };
      });

    // ── Schedule (next 40 matches) ──
    const months=["ינו","פבר","מרץ","אפר","מאי","יוני","יולי","אוג","ספט","אוק","נוב","דצמ"];
    const days2=["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
    const schedule = allMatches
      .filter(m => m.status==="TIMED"||m.status==="SCHEDULED")
      .sort((a,b)=>new Date(a.utcDate)-new Date(b.utcDate))
      .slice(0,40)
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

    // ── Knockout ──
    const knockoutMatches = allMatches
      .filter(m=>m.stage!=="GROUP_STAGE")
      .sort((a,b)=>new Date(a.utcDate)-new Date(b.utcDate))
      .map(m=>{
        const d=new Date(new Date(m.utcDate).getTime()+3*60*60*1000);
        return {
          stage: STAGE_HE[m.stage]||m.stage,
          home: ht(m.homeTeam.shortName||m.homeTeam.name),
          away: ht(m.awayTeam.shortName||m.awayTeam.name),
          score: m.status==="FINISHED"?`${m.score.fullTime.home}–${m.score.fullTime.away}`:null,
          status: m.status,
          date: `${d.getUTCDate()}.${d.getUTCMonth()+1} ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`,
        };
      });

    // ── Current stage ──
    const finishedStages=[...new Set(allMatches.filter(m=>m.status==="FINISHED").map(m=>m.stage))];
    const stageOrder=["GROUP_STAGE","LAST_16","QUARTER_FINALS","SEMI_FINALS","THIRD_PLACE","FINAL"];
    const lastStage=stageOrder.filter(s=>finishedStages.includes(s)).pop()||"GROUP_STAGE";
    const currentStage=STAGE_HE[lastStage]||"שלב הבתים";

    return Response.json({
      currentStage, results, upcoming, schedule, groups, knockoutMatches,
      finishedCount: results.length,
      upcomingCount: upcoming.length,
    }, { headers:{"Cache-Control":"no-store"} });

  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
