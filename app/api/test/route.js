export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.FOOTBALL_DATA_KEY;
  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches?season=2026", {
    headers: { "X-Auth-Token": key }
  });
  const data = await res.json();
  const matches = data.matches || [];

  // Show unique group values from matches
  const groups = [...new Set(matches.map(m => m.group).filter(Boolean))].sort();
  const sample = matches.filter(m => m.group === groups[0]).slice(0,2).map(m => ({
    group: m.group,
    home: m.homeTeam.shortName,
    away: m.awayTeam.shortName,
    stage: m.stage
  }));

  return Response.json({ groups, sample });
}
