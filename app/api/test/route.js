export const dynamic = "force-dynamic";
export async function GET() {
  const key = process.env.FOOTBALL_DATA_KEY;
  const res = await fetch("https://api.football-data.org/v4/competitions/WC/scorers?season=2026&limit=20", {
    headers: { "X-Auth-Token": key }
  });
  const data = await res.json();
  return Response.json({
    status: res.status,
    error: data.message || null,
    count: data.scorers?.length || 0,
    sample: (data.scorers || []).slice(0,5).map(s => ({
      name: s.player?.name,
      team: s.team?.name,
      goals: s.goals,
      assists: s.assists,
      penalties: s.penalties
    }))
  });
}
