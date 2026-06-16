export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) return Response.json({ error: "No FOOTBALL_DATA_KEY" });

  try {
    const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches?season=2026", {
      headers: { "X-Auth-Token": key }
    });
    const data = await res.json();

    return Response.json({
      status: res.status,
      ok: res.ok,
      error: data.message || null,
      total_matches: data.matches?.length || 0,
      finished: data.matches?.filter(m => m.status === "FINISHED").length || 0,
      upcoming: data.matches?.filter(m => m.status === "TIMED" || m.status === "SCHEDULED").length || 0,
      sample: (data.matches || []).filter(m => m.status === "FINISHED").slice(0,3).map(m => ({
        date: m.utcDate,
        home: m.homeTeam.shortName,
        away: m.awayTeam.shortName,
        score: `${m.score.fullTime.home}-${m.score.fullTime.away}`
      }))
    });
  } catch(e) {
    return Response.json({ error: e.message });
  }
}
