export const dynamic = "force-dynamic";
export async function GET() {
  const key = process.env.FOOTBALL_DATA_KEY;
  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches?season=2026", {
    headers: { "X-Auth-Token": key }
  });
  const data = await res.json();
  const matches = data.matches || [];
  const byStage = {};
  matches.forEach(m => {
    if (!byStage[m.stage]) byStage[m.stage] = { total:0, finished:0, live:0, upcoming:0 };
    byStage[m.stage].total++;
    if (m.status === "FINISHED") byStage[m.stage].finished++;
    else if (["IN_PLAY","PAUSED","HALFTIME"].includes(m.status)) byStage[m.stage].live++;
    else byStage[m.stage].upcoming++;
  });
  const last16 = matches.filter(m => m.stage === "LAST_16").map(m => ({
    home: m.homeTeam.shortName,
    away: m.awayTeam.shortName,
    status: m.status,
    score: m.status === "FINISHED" ? m.score.fullTime.home + "-" + m.score.fullTime.away : null,
    date: m.utcDate
  }));
  return Response.json({ byStage, last16_count: last16.length, last16 });
}
