"use client";
import { useState, useEffect, useCallback } from "react";

const CACHE_KEY = "wc2026_data";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

  :root {
    --grass:   #1a7c3e;
    --grass2:  #22a35a;
    --pitch:   #f7fdf9;
    --white:   #ffffff;
    --gold:    #f5a623;
    --gold2:   #e8931a;
    --red:     #e03535;
    --green:   #1a7c3e;
    --blue:    #1a56db;
    --text:    #111827;
    --muted:   #6b7280;
    --border:  #d1fae5;
    --card:    #ffffff;
    --card2:   #f0fdf4;
  }

  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:var(--pitch); color:var(--text); font-family:'Inter',sans-serif; min-height:100vh; }
  .app { max-width:960px; margin:0 auto; padding:0 0 80px; }

  /* ── Hero ── */
  .hero {
    background: linear-gradient(150deg, #0a4a24 0%, #1a7c3e 60%, #22a35a 100%);
    padding: 36px 24px 32px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .hero-bg {
    position: absolute;
    inset: 0;
    opacity: 0.07;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 80px;
    font-size: 120px;
    pointer-events: none;
    user-select: none;
  }
  /* Grass stripes */
  .hero::before {
    content:'';
    position:absolute;
    inset:0;
    background: repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,.03) 40px,rgba(255,255,255,.03) 80px);
  }
  .hero-eyebrow { font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:4px; color:rgba(255,255,255,.7); text-transform:uppercase; margin-bottom:8px; position:relative; }
  .hero-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(56px,10vw,96px); line-height:1; color:#fff; letter-spacing:3px; position:relative; }
  .hero-title span { color:var(--gold); text-shadow:0 2px 24px rgba(245,166,35,.6); }
  .hero-sub { font-size:13px; color:rgba(255,255,255,.7); margin-top:8px; font-family:'JetBrains Mono',monospace; position:relative; }
  .hero-icons { font-size:32px; margin-bottom:8px; position:relative; letter-spacing:8px; }

  /* ── Refresh bar ── */
  .refresh-bar {
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 20px; background:#fff;
    border-bottom:2px solid var(--border);
    position:sticky; top:0; z-index:10;
    box-shadow:0 2px 8px rgba(0,0,0,.06);
  }
  .refresh-status { font-size:12px; color:var(--muted); font-family:'JetBrains Mono',monospace; }
  .refresh-status strong { color:var(--text); }
  .refresh-btn {
    display:flex; align-items:center; gap:8px;
    padding:9px 20px;
    background:linear-gradient(135deg,var(--grass),var(--grass2));
    color:#fff; border:none; border-radius:50px;
    font-weight:700; font-size:13px; cursor:pointer;
    transition:all .2s;
    box-shadow:0 2px 8px rgba(26,124,62,.3);
  }
  .refresh-btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(26,124,62,.4); }
  .refresh-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  .live-dot { width:8px; height:8px; background:#ff4444; border-radius:50%; animation:pulse 1.4s ease-in-out infinite; }

  /* ── Error ── */
  .error-box { margin:16px 20px; padding:12px 16px; background:#fff5f5; border:1px solid #feb2b2; border-radius:10px; color:var(--red); font-size:13px; text-align:center; }

  /* ── Tabs ── */
  .tabs { display:flex; background:#fff; border-bottom:2px solid var(--border); padding:0 20px; }
  .tab { flex:1; padding:14px 8px 12px; border:none; border-bottom:3px solid transparent; background:transparent; color:var(--muted); font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; text-align:center; margin-bottom:-2px; }
  .tab.active { color:var(--grass); border-bottom-color:var(--grass); }
  .tab:hover:not(.active) { color:var(--text); }

  /* ── Content ── */
  .content { padding:20px; }

  /* ── Card ── */
  .card { background:var(--card); border:1px solid #e5f5ec; border-radius:16px; padding:20px; margin-bottom:16px; box-shadow:0 1px 4px rgba(0,0,0,.05); }
  .card-title { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:1px; color:var(--grass); margin-bottom:16px; padding-bottom:12px; border-bottom:2px solid var(--border); }

  /* ── Standings ── */
  .standings { width:100%; border-collapse:collapse; }
  .standings th { text-align:right; padding:8px 10px; font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--muted); border-bottom:1px solid var(--border); }
  .standings td { padding:12px 10px; border-bottom:1px solid #f0faf4; vertical-align:middle; }
  .standings tr:last-child td { border-bottom:none; }
  .standings tr:hover td { background:#f0fdf4; }

  .rank-badge { display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; font-weight:800; font-size:12px; font-family:'JetBrains Mono',monospace; }
  .rank-1 { background:linear-gradient(135deg,#f5a623,#e8931a); color:#fff; box-shadow:0 2px 8px rgba(245,166,35,.4); }
  .rank-2 { background:#e5e7eb; color:#374151; }
  .rank-3 { background:#fde68a; color:#92400e; }
  .rank-4,.rank-5,.rank-6 { background:#f3f4f6; color:var(--muted); }

  .prob-bar-wrap { display:flex; align-items:center; gap:8px; }
  .prob-bar-bg { flex:1; height:8px; background:#e5f5ec; border-radius:4px; overflow:hidden; }
  .prob-bar-fill { height:100%; border-radius:4px; background:linear-gradient(90deg,var(--grass),var(--grass2)); transition:width .6s ease; }
  .prob-text { font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:700; color:var(--grass); min-width:38px; text-align:left; }

  .trend { font-size:11px; font-weight:700; padding:3px 8px; border-radius:20px; font-family:'JetBrains Mono',monospace; }
  .trend-up   { background:#d1fae5; color:#065f46; }
  .trend-down { background:#fee2e2; color:#991b1b; }
  .trend-flat { background:#f3f4f6; color:var(--muted); }

  .analysis-box { margin-top:16px; padding:14px 16px; background:linear-gradient(135deg,#f0fdf4,#dcfce7); border-radius:10px; border-right:4px solid var(--grass); }
  .analysis-label { font-size:10px; color:var(--grass); font-family:'JetBrains Mono',monospace; letter-spacing:2px; margin-bottom:6px; }
  .analysis-text { font-size:13px; line-height:1.7; color:var(--text); }

  /* ── Results ── */
  .results-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; }
  .result-item {
    background:var(--card2);
    border:1px solid var(--border);
    border-radius:12px;
    padding:14px 12px;
    text-align:center;
    position:relative;
    overflow:hidden;
  }
  .result-item::before {
    content:'⚽';
    position:absolute;
    top:-8px; right:-8px;
    font-size:32px;
    opacity:.06;
    transform:rotate(15deg);
  }
  .result-group { font-size:10px; color:var(--muted); font-family:'JetBrains Mono',monospace; letter-spacing:1px; margin-bottom:6px; }
  .result-home { font-size:13px; font-weight:700; }
  .result-score { font-family:'Bebas Neue',sans-serif; font-size:32px; letter-spacing:3px; color:var(--grass); margin:4px 0; line-height:1; }
  .result-away { font-size:12px; font-weight:600; color:var(--muted); }
  .result-note { font-size:11px; color:var(--gold2); margin-top:4px; font-weight:600; }

  /* ── Bets ── */
  .stage-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 14px; background:linear-gradient(135deg,var(--grass),var(--grass2)); color:#fff; border-radius:50px; font-size:12px; font-weight:700; margin-bottom:16px; box-shadow:0 2px 8px rgba(26,124,62,.3); }
  .bet-list { display:flex; flex-direction:column; gap:12px; }
  .bet-item {
    background:#fff;
    border:1px solid var(--border);
    border-radius:14px;
    padding:16px;
    position:relative;
    overflow:hidden;
    box-shadow:0 1px 4px rgba(0,0,0,.04);
  }
  .bet-item::after {
    content:'';
    position:absolute;
    top:0; right:0;
    width:4px; height:100%;
  }
  .bet-item.high::after   { background:var(--grass2); }
  .bet-item.medium::after { background:var(--gold); }
  .bet-item.low::after    { background:var(--red); }

  /* Watermark ball */
  .bet-item::before {
    content:'⚽';
    position:absolute;
    bottom:-10px; left:-10px;
    font-size:60px;
    opacity:.04;
    pointer-events:none;
  }

  .bet-header { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:6px; }
  .bet-match { font-weight:700; font-size:15px; color:var(--text); }
  .bet-confidence { font-family:'JetBrains Mono',monospace; font-size:11px; padding:3px 10px; border-radius:20px; font-weight:700; white-space:nowrap; }
  .conf-high   { background:#d1fae5; color:#065f46; }
  .conf-medium { background:#fef3c7; color:#92400e; }
  .conf-low    { background:#fee2e2; color:#991b1b; }

  .bet-time { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--blue); margin-bottom:10px; }
  .bet-pick { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:1px; color:var(--grass); margin-bottom:6px; }
  .bet-reason { font-size:12px; color:var(--muted); line-height:1.5; }
  .bet-odds { display:inline-block; margin-top:8px; font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:700; color:var(--gold2); background:#fef3c7; padding:2px 8px; border-radius:4px; }

  .load-more-btn { width:100%; margin-top:14px; padding:13px; background:#fff; border:2px dashed var(--grass); border-radius:10px; color:var(--grass); font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; }
  .load-more-btn:hover:not(:disabled) { background:#f0fdf4; }
  .load-more-btn:disabled { opacity:.45; cursor:not-allowed; }

  .disclaimer { font-size:11px; color:var(--muted); text-align:center; padding:12px; border-top:1px solid var(--border); margin-top:16px; font-style:italic; }
  .timestamp { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--muted); text-align:center; margin-top:24px; }
  .cached-badge { font-size:11px; color:var(--gold2); background:#fef3c7; padding:2px 8px; border-radius:4px; font-family:'JetBrains Mono',monospace; }

  @media (max-width:600px) {
    .standings th:nth-child(4),.standings td:nth-child(4) { display:none; }
  }
`;

const SEED = {
  lastUpdated: "טוען...",
  currentStage: "שלב הבתים",
  standings: [
    { rank:1, team:"🇫🇷 צרפת", prob:19, odds:"+500", trend:"up", note:"סגל עמוק" },
    { rank:2, team:"🇩🇪 גרמניה", prob:14, odds:"+1400", trend:"up", note:"7–1 על קוראסאו" },
    { rank:3, team:"🏴 אנגליה", prob:13, odds:"+650", trend:"flat", note:"בית קל" },
    { rank:4, team:"🇪🇸 ספרד", prob:12, odds:"+450", trend:"down", note:"0–0 קייפ ורדה" },
    { rank:5, team:"🇦🇷 ארגנטינה", prob:10, odds:"+900", trend:"flat", note:"מסי בן 39" },
    { rank:6, team:"🇵🇹 פורטוגל", prob:9, odds:"+850", trend:"flat", note:"רונאלדו" },
  ],
  results: [],
  bets: [],
  analysis: "לחץ על עדכן עכשיו לניתוח עדכני."
};

export default function Page() {
  const [tab, setTab] = useState("standings");
  const [data, setData] = useState(SEED);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.standings?.length > 0) {
          setData(parsed);
          setFromCache(true);
        }
      }
    } catch(e) {}
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null); setFromCache(false);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const fresh = await res.json();
      if (fresh.error) { setError(fresh.error + " מוצגים הנתונים האחרונים."); return; }
      setData(fresh);
      // Save to localStorage
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(fresh)); } catch(e) {}
    } catch { setError("לא הצלחתי לטעון נתונים עדכניים. מוצגים הנתונים האחרונים."); }
    finally { setLoading(false); }
  }, []);

  const loadMoreBets = useCallback(async () => {
    setLoadingMore(true);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const fresh = await res.json();
      if (fresh.error || !fresh.bets) throw new Error("no bets");
      const existingMatches = new Set((data.bets || []).map(b => b.match));
      const newBets = fresh.bets.filter(b => !existingMatches.has(b.match));
      const merged = newBets.length > 0 ? [...(data.bets||[]), ...newBets] : [...(data.bets||[]), ...fresh.bets];
      const updated = { ...data, bets: merged };
      setData(updated);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(updated)); } catch(e) {}
    } catch { } finally { setLoadingMore(false); }
  }, [data]);

  useEffect(() => {
    const id = setInterval(refresh, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [refresh]);

  const confLabel = c => c==="high"?"ביטחון גבוה":c==="medium"?"ביטחון בינוני":"ביטחון נמוך";

  return (
    <>
      <style>{styles}</style>
      <div className="app">

        <header className="hero">
          <div className="hero-bg">🏆⚽🥅</div>
          <div className="hero-eyebrow">FIFA WORLD CUP 2026 · ניתוח חי</div>
          <div className="hero-icons">🏆 ⚽ 🥇</div>
          <h1 className="hero-title">מונדיאל <span>2026</span></h1>
          <div className="hero-sub">ניתוח אוטומטי · סיכויי זכייה · המלצות הימורים</div>
        </header>

        <div className="refresh-bar">
          <div>
            <span className="refresh-status">עדכון: <strong>{data.lastUpdated}</strong></span>
            {fromCache && <span className="cached-badge" style={{marginRight:8}}>מטמון</span>}
          </div>
          <button className="refresh-btn" onClick={refresh} disabled={loading}>
            {loading ? <><div className="spinner"/>מעדכן...</> : <><div className="live-dot"/>עדכן עכשיו</>}
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="tabs">
          {[{id:"standings",label:"📊 סיכויי זכייה"},{id:"results",label:"⚽ תוצאות"},{id:"bets",label:"🎯 הימורים"}]
            .map(t => <button key={t.id} className={`tab${tab===t.id?" active":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}
        </div>

        <div className="content">

          {tab === "standings" && (
            <div className="card">
              <div className="card-title">📊 סיכויי זכייה</div>
              <table className="standings">
                <thead><tr><th>#</th><th>נבחרת</th><th>הסתברות</th><th>אודס</th><th>טרנד</th></tr></thead>
                <tbody>
                  {data.standings?.map(s => (
                    <tr key={s.rank}>
                      <td><span className={`rank-badge rank-${s.rank}`}>{s.rank}</span></td>
                      <td style={{fontWeight:700,fontSize:14}}>{s.team}</td>
                      <td><div className="prob-bar-wrap"><div className="prob-bar-bg"><div className="prob-bar-fill" style={{width:`${Math.min(s.prob*4,100)}%`}}/></div><span className="prob-text">{s.prob}%</span></div></td>
                      <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:s.rank===1?"var(--gold2)":"var(--muted)"}}>{s.odds}</td>
                      <td><span className={`trend trend-${s.trend}`}>{s.trend==="up"?"↑":s.trend==="down"?"↓":"→"} {s.note}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.analysis && (
                <div className="analysis-box">
                  <div className="analysis-label">ניתוח עדכני</div>
                  <p className="analysis-text">{data.analysis}</p>
                </div>
              )}
            </div>
          )}

          {tab === "results" && (
            <div className="card">
              <div className="card-title">⚽ תוצאות — {data.currentStage || "שלב הבתים"}</div>
              {(!data.results || data.results.length === 0) ? (
                <p style={{color:"var(--muted)",fontSize:13,textAlign:"center",padding:"24px 0"}}>לחץ "עדכן עכשיו" לטעינת תוצאות</p>
              ) : (
                <div className="results-grid">
                  {data.results.map((r,i) => (
                    <div key={i} className="result-item">
                      <div className="result-group">{r.group}</div>
                      <div className="result-home">{r.home}</div>
                      <div className="result-score">{r.score}</div>
                      <div className="result-away">{r.away}</div>
                      {r.note && <div className="result-note">{r.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "bets" && (
            <div className="card">
              <div className="card-title">🎯 המלצות הימורים</div>
              {data.currentStage && <div className="stage-badge">⚽ {data.currentStage}</div>}
              {(!data.bets || data.bets.length === 0) ? (
                <p style={{color:"var(--muted)",fontSize:13,textAlign:"center",padding:"24px 0"}}>לחץ "עדכן עכשיו" לקבלת המלצות</p>
              ) : (
                <div className="bet-list">
                  {data.bets.map((b,i) => (
                    <div key={i} className={`bet-item ${b.confidence}`}>
                      <div className="bet-header">
                        <span className="bet-match">{b.match}</span>
                        <span className={`bet-confidence conf-${b.confidence}`}>{confLabel(b.confidence)}</span>
                      </div>
                      {b.datetime && <div className="bet-time">🕐 {b.datetime}</div>}
                      <div className="bet-pick">✓ {b.pick}</div>
                      <div className="bet-reason">{b.reason}</div>
                      {b.odds && <span className="bet-odds">אודס: {b.odds}</span>}
                    </div>
                  ))}
                </div>
              )}
              <button className="load-more-btn" onClick={loadMoreBets} disabled={loadingMore}>
                {loadingMore ? "⏳ טוען..." : "➕ טען עוד המלצות"}
              </button>
              <div className="disclaimer">⚠️ להנאה בין חברים בלבד · לא ייעוץ פיננסי</div>
            </div>
          )}

          <div className="timestamp">
            מופעל על ידי {data.provider==="groq"?"Groq (Llama)":"Gemini (Google)"} + football-data.org · לחץ עדכן לרענון
          </div>
        </div>
      </div>
    </>
  );
}
