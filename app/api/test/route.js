export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.FOOTBALL_DATA_KEY;
  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches?season=2026", {
    headers: { "X-Auth-Token": key }
  });
  const data = await res.json();
  const matches = data.matches || [];
  const now = Date.now();
  const in24h = now + 24*60*60*1000;
  const in72h = now + 72*60*60*1000;

  const next24 = matches.filter(m => {
    const t = new Date(m.utcDate).getTime();
    return (m.status==="TIMED"||m.status==="SCHEDULED") && t>=now && t<=in24h;
  }).map(m => ({
    home: m.homeTeam.shortName,
    away: m.awayTeam.shortName,
    utcDate: m.utcDate,
    status: m.status
  }));

  const next72 = matches.filter(m => {
    const t = new Date(m.utcDate).getTime();
    return (m.status==="TIMED"||m.status==="SCHEDULED") && t>=now && t<=in72h;
  }).length;

  return Response.json({ next24h_count: next24.length, next72h_count: next72, matches_next24h: next24 });
}
