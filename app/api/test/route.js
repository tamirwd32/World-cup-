export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) return Response.json({ error: "No FOOTBALL_API_KEY" });

  const BASE = "https://v3.football.api-sports.io";
  const headers = { "x-apisports-key": key };

  try {
    // First check what leagues are available for 2026
    const leaguesRes = await fetch(`${BASE}/leagues?season=2026&type=Cup`, { headers });
    const leaguesData = await leaguesRes.json();

    const leagues = (leaguesData.response || []).slice(0, 10).map(l => ({
      id: l.league.id,
      name: l.league.name,
      country: l.country.name
    }));

    // Also try fixtures for league 1 (World Cup)
    const fixRes = await fetch(`${BASE}/fixtures?league=1&season=2026&last=5`, { headers });
    const fixData = await fixRes.json();

    return Response.json({
      football_api_status: leaguesRes.status,
      leagues_found: leagues,
      fixtures_status: fixRes.status,
      fixtures_count: fixData.response?.length || 0,
      fixtures_sample: (fixData.response || []).slice(0,2).map(f => ({
        date: f.fixture.date,
        home: f.teams.home.name,
        away: f.teams.away.name,
        score: `${f.goals.home}-${f.goals.away}`,
        status: f.fixture.status.short
      })),
      fixtures_errors: fixData.errors
    });
  } catch(e) {
    return Response.json({ error: e.message });
  }
}
