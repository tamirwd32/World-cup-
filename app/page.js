"use client";
import { useState, useEffect, useCallback } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  :root {
    --pitch:#0a1628; --surface:#111e35; --surface2:#172540; --border:#1e3356;
    --gold:#f0b429; --gold-dim:#a07415; --red:#e05555; --green:#3ecf8e; --blue:#4a9eff;
    --text:#e8edf5; --muted:#7a8aa0;
    --font-head:'Bebas Neue',sans-serif; --font-body:'Inter',sans-serif; --font-mono:'JetBrains Mono',monospace;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:var(--pitch); color:var(--text); font-family:var(--font-body); }
  .app { max-width:960px; margin:0 auto; padding:24px 16px 80px; }
  .header { text-align:center; padding:32px 0 24px; }
  .header-eyebrow { font-family:var(--font-mono); font-size:11px; letter-spacing:3px; color:var(--gold); text-transform:uppercase; margin-bottom:8px; }
  .header-title { font-family:var(--font-head); font-size:clamp(48px,8vw,80px); letter-spacing:2px; line-height:1; }
  .header-title span { color:var(--gold); }
  .header-sub { font-size:13px; color:var(--muted); margin-top:10px; font-family:var(--font-mono); }
  .tabs { display:flex; gap:4px; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:4px; margin:24px 0 20px; }
  .tab { flex:1; padding:10px 8px; border:none; border-radius:7px; background:transparent; color:var(--muted); font-family:var(--font-body); font-size:13px; font-weight:500; cursor:pointer; transition:all .2s; }
  .tab.active { background:var(--surface2); color:var(--gold); border:1px solid var(--border); }
  .tab:hover:not(.active) { color:var(--text); }
  .refresh-bar { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--surface); border:1px solid var(--border); border-radius:10px; margin-bottom:20px; }
  .refresh-status { font-size:12px; color:var(--muted); font-family:var(--font-mono); }
  .refresh-status strong { color:var(--text); }
  .refresh-btn { display:flex; align-items:center; gap:8px; padding:8px 18px; background:var(--gold); color:#000; border:none; border-radius:7px; font-weight:700; font-size:13px; cursor:pointer; transition:opacity .2s; }
  .refresh-btn:hover { opacity:.88; }
  .refresh-btn:disabled { opacity:.45; cursor:not-allowed; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.4;transform:scale(0.7);} }
  .pulse-dot { width:8px; height:8px; background:#e05555; border-radius:50%; animation:pulse 1.4s ease-in-out infinite; }
  .pulse-dot.idle { background:var(--gold-dim); animation:none; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .spinner { width:14px; height:14px; border:2px solid rgba(0,0,0,.3); border-top-color:#000; border-radius:50%; animation:spin .7s linear infinite; }
  .card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:20px; margin-bottom:14px; }
  .card-title { font-family:var(--font-head); font-size:22px; letter-spacing:1px; color:var(--gold); margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--border); }
  .standings { width:100%; border-collapse:collapse; font-size:13px; }
  .standings th { text-align:right; padding:8px 10px; font-family:var(--font-mono); font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--muted); border-bottom:1px solid var(--border); }
  .standings td { padding:10px; border-bottom:1px solid rgba(255,255,255,.04); vertical-align:middle; }
  .standings tr:last-child td { border-bottom:none; }
  .rank-badge { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; font-weight:700; font-size:12px; font-family:var(--font-mono); }
  .rank-1 { background:var(--gold); color:#000; }
  .rank-2,.rank-3,.rank-4,.rank-5,.rank-6 { background:var(--surface2); color:var(--text); border:1px solid var(--border); }
  .prob-bar-wrap { display:flex; align-items:center; gap:8px; }
  .prob-bar-bg { flex:1; height:6px; background:var(--surface2); border-radius:3px; overflow:hidden; }
  .prob-bar-fill { height:100%; border-radius:3px; background:linear-gradient(90deg,var(--gold),#ffdb70); transition:width .6s ease; }
  .prob-text { font-family:var(--font-mono); font-size:12px; font-weight:600; color:var(--gold); min-width:40px; text-align:left; }
  .trend { font-size:11px; font-weight:600; padding:2px 7px; border-radius:4px; font-family:var(--font-mono); }
  .trend-up { background:rgba(62,207,142,.15); color:var(--green); }
  .trend-down { background:rgba(224,85,85,.15); color:var(--red); }
  .trend-flat { background:rgba(255,255,255,.06); color:var(--muted); }
  .bet-list { display:flex; flex-direction:column; gap:10px; }
  .bet-item { background:var(--surface2); border:1px solid var(--border); border-radius:9px; padding:14px 16px; }
  .bet-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px; gap:8px; }
  .bet-match { font-weight:600; font-size:14px; }
  .bet-time { font-family:var(--font-mono); font-size:11px; color:var(--blue); margin-bottom:8px; }
  .bet-confidence { font-family:var(--font-mono); font-size:11px; padding:3px 9px; border-radius:4px; font-weight:600; white-space:nowrap; }
  .conf-high { background:rgba(62,207,142,.15); color:var(--green); }
  .conf-medium { background:rgba(240,180,41,.15); color:var(--gold); }
  .conf-low { background:rgba(224,85,85,.15); color:var(--red); }
  .bet-pick { font-size:16px; font-weight:700; color:var(--gold); margin-bottom:4px; }
  .bet-reason { font-size:12px; color:var(--muted); line-height:1.5; }
  .bet-odds { display:inline-block; margin-top:6px; font-family:var(--font-mono); font-size:12px; color:var(--blue); }
  .load-more-btn { width:100%; margin-top:14px; padding:12px; background:var(--surface2); border:1px dashed var(--border); border-radius:8px; color:var(--gold); font-family:var(--font-body); font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; }
  .load-more-btn:hover:not(:disabled) { background:var(--border); }
  .load-more-btn:disabled { opacity:.45; cursor:not-allowed; }
  .bet-disclaimer { font-size:11px; color:var(--muted); text-align:center; padding:12px; border-top:1px solid var(--border); margin-top:14px; font-style:italic; }
  .results-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:10px; }
  .result-item { background:var(--surface2); border:1px solid var(--border); border-radius:8px; padding:10px 12px; }
  .result-group { font-size:10px; color:var(--muted); font-family:var(--font-mono); letter-spacing:1px; margin-bottom:4px; }
  .result-teams { font-size:13px; font-weight:600; }
  .result-score { font-family:var(--font-mono); font-size:16px; font-weight:700; color:var(--gold); margin:2px 0; }
  .result-note { font-size:11px; color:var(--muted); }
  .error-box { background:rgba(224,85,85,.1); border:1px solid rgba(224,85,85,.3); border-radius:10px; padding:16px; color:var(--red); font-size:13px; text-align:center; margin-bottom:14px; }
  .timestamp { font-family:var(--font-mono); font-size:11px; color:var(--muted); text-align:center; margin-top:24px; }
  @media (max-width:600px){ .standings th:nth-child(4),.standings td:nth-child(4){display:none;} }
`;

const SEED = {
  lastUpdated: "15.6.2026 — יום 5",
  standings: [
    { rank:1, team:"צרפת 🇫🇷", prob:19, odds:"+500", trend:"up", note:"טרם שיחקה — סגל עמוק" },
    { rank:2, team:"גרמניה 🇩🇪", prob:14, odds:"+1400", trend:"up", note:"7–1 על קוראסאו" },
    { rank:3, team:"אנגליה 🏴", prob:13, odds:"+650", trend:"flat", note:"בית קל, קיין בשיאו" },
    { rank:4, team:"ספרד 🇪🇸", prob:12, odds:"+450", trend:"down", note:"0–0 קייפ ורדה" },
    { rank:5, team:"ארגנטינה 🇦🇷", prob:10, odds:"+900", trend:"flat", note:"מסי בן 39" },
    { rank:6, team:"פורטוגל 🇵🇹", prob:9, odds:"+850", trend:"flat", note:"רונאלדו" },
  ],
  results: [
    { group:"E", home:"גרמניה", score:"7–1", away:"קוראסאו", note:"xG 3.91" },
    { group:"H", home:"ספרד", score:"0–0", away:"קייפ ורדה", note:"⚠️ הפתעה" },
    { group:"G", home:"בלגיה", score:"0–1", away:"מצרים", note:"⚠️" },
    { group:"D", home:"ארה\"ב", score:"4–1", away:"פרגוואי", note:"" },
    { group:"C", home:"ברזיל", score:"1–1", away:"מרוקו", note:"ויניסיוס הציל" },
    { group:"F", home:"הולנד", score:"2–2", away:"יפן", note:"תיקו דרמטי" },
  ],
  bets: [
    { match:"צרפת – סנגל", datetime:"שלישי 16.6 בשעה 22:00", pick:"צרפת מנצחת 2:0", confidence:"high", odds:"~2.10", reason:"הסגל העמוק ביותר, מבאפה ואוליז חדים מול הגנת סנגל" },
    { match:"אנגליה – קרואטיה", datetime:"רביעי 17.6 בשעה 23:00", pick:"אנגליה מנצחת 2:1", confidence:"medium", odds:"~3.40", reason:"קיין בשיאו, קרואטיה מזדקנת אבל מסוכנת" },
    { match:"ארגנטינה – אלג׳יריה", datetime:"שני 22.6 בשעה 20:00", pick:"ארגנטינה מנצחת 3:0", confidence:"high", odds:"~1.45", reason:"בית קל, ניסיון עצום של הסגל" },
    { match:"גרמניה – חוף השנהב", datetime:"שישי 20.6 בשעה 22:00", pick:"גרמניה מנצחת 2:1", confidence:"medium", odds:"~2.80", reason:"גרמניה חזקה אך חוף השנהב מסוכן בנגד-התקפה" },
  ],
  analysis: "עדכון יום 5: ספרד 0:0 עם קייפ ורדה (הפתעה), בלגיה 0:1 מצרים, גרמניה 7:1 מרשים. נבחרות עם עומק שורדות. צרפת המועמדת הראשית."
};

export default function Page() {
  const [tab, setTab] = useState("standings");
  const [data, setData] = useState(SEED);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const fresh = await res.json();
      if (fresh.error) throw new Error(fresh.error);
      setData(fresh);
    } catch {
      setError("לא הצלחתי לטעון נתונים עדכניים. מוצגים הנתונים האחרונים.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreBets = useCallback(async () => {
    setLoadingMore(true);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const fresh = await res.json();
      if (fresh.error || !fresh.bets) throw new Error("no bets");
      const existingMatches = new Set((data.bets || []).map(b => b.match));
      const newBets = fresh.bets.filter(b => !existingMatches.has(b.match));
      const merged = newBets.length > 0
        ? [...(data.bets || []), ...newBets]
        : [...(data.bets || []), ...fresh.bets];
      setData(prev => ({ ...prev, bets: merged }));
    } catch {
      // silent fail
    } finally {
      setLoadingMore(false);
    }
  }, [data.bets]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <header className="header">
          <div className="header-eyebrow">FIFA WORLD CUP 2026 · ניתוח חי</div>
          <h1 className="header-title">מונדיאל <span>2026</span></h1>
          <div className="header-sub">ניתוח אוטומטי · סיכויי זכייה · המלצות הימורים</div>
        </header>

        <div className="refresh-bar">
          <span className="refresh-status">עדכון אחרון: <strong>{data.lastUpdated}</strong></span>
          <button className="refresh-btn" onClick={refresh} disabled={loading}>
            {loading ? <><div className="spinner" />מעדכן...</> : <><div className="pulse-dot idle" />עדכן עכשיו</>}
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="tabs">
          {[
            { id:"standings", label:"📊 סיכויי זכייה" },
            { id:"results", label:"⚽ תוצאות" },
            { id:"bets", label:"🎯 המלצות הימורים" },
          ].map(t => (
            <button key={t.id} className={`tab${tab===t.id?" active":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {tab === "standings" && (
          <div className="card">
            <div className="card-title">סיכויי זכייה — מעודכן</div>
            <table className="standings">
              <thead><tr><th>#</th><th>נבחרת</th><th>הסתברות</th><th>אודס</th><th>טרנד</th></tr></thead>
              <tbody>
                {data.standings?.map(s => (
                  <tr key={s.rank}>
                    <td><span className={`rank-badge rank-${s.rank}`}>{s.rank}</span></td>
                    <td style={{fontWeight:600,fontSize:14}}>{s.team}</td>
                    <td><div className="prob-bar-wrap"><div className="prob-bar-bg"><div className="prob-bar-fill" style={{width:`${Math.min(s.prob*4,100)}%`}} /></div><span className="prob-text">{s.prob}%</span></div></td>
                    <td style={{fontFamily:"var(--font-mono)",fontSize:13,color:"var(--blue)"}}>{s.odds}</td>
                    <td><span className={`trend trend-${s.trend}`}>{s.trend==="up"?"↑":s.trend==="down"?"↓":"→"} {s.note}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.analysis && (
              <div style={{marginTop:18,padding:"14px 16px",background:"var(--surface2)",borderRadius:8,borderRight:"3px solid var(--gold)"}}>
                <div style={{fontSize:11,color:"var(--gold)",fontFamily:"var(--font-mono)",letterSpacing:2,marginBottom:6}}>ניתוח עדכני</div>
                <p style={{fontSize:13,lineHeight:1.7,color:"#c8d4e0"}}>{data.analysis}</p>
              </div>
            )}
          </div>
        )}

        {tab === "results" && (
          <div className="card">
            <div className="card-title">תוצאות — שלב הבתים</div>
            <div className="results-grid">
              {data.results?.map((r,i) => (
                <div key={i} className="result-item">
                  <div className="result-group">בית {r.group}</div>
                  <div className="result-teams">{r.home}</div>
                  <div className="result-score">{r.score}</div>
                  <div className="result-teams" style={{fontSize:12}}>{r.away}</div>
                  {r.note && <div className="result-note">{r.note}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "bets" && (
          <div className="card">
            <div className="card-title">🎯 המלצות הימורים — משחקים קרובים</div>
            <div className="bet-list">
              {data.bets?.map((b,i) => (
                <div key={i} className="bet-item">
                  <div className="bet-header">
                    <span className="bet-match">{b.match}</span>
                    <span className={`bet-confidence conf-${b.confidence}`}>{b.confidence==="high"?"ביטחון גבוה":b.confidence==="medium"?"ביטחון בינוני":"ביטחון נמוך"}</span>
                  </div>
                  {b.datetime && <div className="bet-time">🕐 {b.datetime}</div>}
                  <div className="bet-pick">✓ {b.pick}</div>
                  <div className="bet-reason">{b.reason}</div>
                  {b.odds && <span className="bet-odds">אודס משוער: {b.odds}</span>}
                </div>
              ))}
            </div>
            <button className="load-more-btn" onClick={loadMoreBets} disabled={loadingMore}>
              {loadingMore ? "⏳ טוען המלצות נוספות..." : "➕ טען עוד המלצות"}
            </button>
            <div className="bet-disclaimer">⚠️ להנאה בין חברים בלבד · לא ייעוץ פיננסי · אין להמר כסף אמיתי</div>
          </div>
        )}

        <div className="timestamp">מופעל על ידי Gemini (Google) · מתעדכן אוטומטית כל 30 דקות</div>
      </div>
    </>
  );
}
