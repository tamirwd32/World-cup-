export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) return Response.json({ error: "No key" });

  const res = await fetch("https://api.football-data.org/v4/competitions/WC/standings?season=2026", {
    headers: { "X-Auth-Token": key }
  });
  const data = await res.json();

  // Show structure of standings
  const standings = data.standings || [];
  return Response.json({
    count: standings.length,
    types: standings.map(s => ({ type: s.type, group: s.group, rows: s.table?.length })),
    first_group_sample: standings[0]?.table?.slice(0,2).map(t => ({
      team: t.team.shortName,
      pts: t.points,
      group: t.group  // does table row have group?
    }))
  });
}
