"use client";
import { useState, useEffect, useCallback } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

  :root {
    --grass:    #1a7c3e;
    --grass2:   #15a351;
    --pitch:    #f0faf4;
    --white:    #ffffff;
    --gold:     #f5a623;
    --gold2:    #e8931a;
    --red:      #e03535;
    --green:    #1a7c3e;
    --blue:     #1a56db;
    --text:     #111827;
    --muted:    #6b7280;
    --border:   #d1fae5;
    --card:     #ffffff;
    --card2:    #f0fdf4;
    --font-head:'Bebas Neue',sans-serif;
    --font-body:'Inter',sans-serif;
    --font-mono:'JetBrains Mono',monospace;
  }

  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:var(--pitch); color:var(--text); font-family:var(--font-body); min-height:100vh; }
  .app { max-width:960px; margin:0 auto; padding:0 0 80px; }

  /* ── Hero header ── */
  .hero {
    background: linear-gradient(135deg, #0d5c2e 0%, #1a7c3e 50%, #22a35a 100%);
    padding: 36px 24px 28px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent 60px,
      rgba(255,255,255,.04) 60px,
      rgba(255,255,255,.04) 120px
    );
  }
  .hero-eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 4px;
    color: rgba(255,255,255,.7);
    text-transform: uppercase;
    margin-bottom: 8px;
    position: relative;
  }
  .hero-title {
    font-family: var(--font-head);
    font-size: clamp(52px,10vw,90px);
    line-height: 1;
    color: #fff;
    letter-spacing: 2px;
    position: relative;
  }
  .hero-title span {
    color: var(--gold);
    text-shadow: 0 2px 20px rgba(245,166,35,.5);
  }
  .hero-sub {
    font-size: 13px;
    color: rgba(255,255,255,.75);
    margin-top: 8px;
    font-family: var(--font-mono);
    position: relative;
  }
  .trophy { font-size: 40px; display:block; margin-bottom:4px; }

  /* ── Refresh bar ── */
  .refresh-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: #fff;
    border-bottom: 2px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0,0,0,.06);
  }
  .refresh-status { font-size: 12px; color: var(--muted); font-family: var(--font-mono); }
  .refresh-status strong { color: var(--text); }
  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 20px;
    background: linear-gradient(135deg, var(--grass), var(--grass2));
    color: #fff;
    border: none;
    border-radius: 50px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all .2s;
    box-shadow: 0 2px 8px rgba(26,124,62,.3);
  }
  .refresh-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(26,124,62,.4); }
  .refresh-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  .live-dot { width:8px; height:8px; background:#ff4444; border-radius:50%; animation:pulse 1.4s ease-in-out infinite; }

  /* ── Error ── */
  .error-box {
    margin: 16px 20px;
    padding: 12px 16px;
    background: #fff5f5;
    border: 1px solid #feb2b2;
    border-radius: 10px;
    color: var(--red);
    font-size: 13px;
    text-align: center;
  }

  /* ── Tabs ── */
  .tabs {
    display: flex;
    gap: 0;
    background: #fff;
    border-bottom: 2px solid var(--border);
    padding: 0 20px;
  }
  .tab {
    flex: 1;
    padding: 14px 8px 12px;
    border: none;
    border-bottom: 3px solid transparent;
    background: transparent;
    color: var(--muted);
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s;
    text-align: center;
    margin-bottom: -2px;
  }
  .tab.active { color: var(--grass); border-bottom-color: var(--grass); }
  .tab:hover:not(.active) { color: var(--text); }

  /* ── Content area ── */
  .content { padding: 20px; }

  /* ── Card ── */
  .card {
    background: var(--card);
    border: 1px solid #e5f5ec;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,.05);
  }
  .card-title {
    font-family: var(--font-head);
    font-size: 22px;
    letter-spacing: 1px;
    color: var(--grass);
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ── Standings ── */
  .standings { width:100%; border-collapse:collapse; }
  .standings th {
    text-align: right;
    padding: 8px 10px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
  }
  .standings td {
    padding: 12px 10px;
    border-bottom: 1px solid #f0faf4;
    vertical-align: middle;
  }
  .standings tr:last-child td { border-bottom: none; }
  .standings tr:hover td { background: #f0fdf4; }

  .rank-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px; height: 26px;
    border-radius: 50%;
    font-weight: 800;
    font-size: 12px;
    font-family: var(--font-mono);
  }
  .rank-1 { background: linear-gradient(135deg,#f5a623,#e8931a); color: #fff; box-shadow:0 2px 8px rgba(245,166,35,.4); }
  .rank-2 { background: #e5e7eb; color: #374151; }
  .rank-3 { background: #fde68a; color: #92400e; }
  .rank-4,.rank-5,.rank-6 { background: #f3f4f6; color: var(--muted); }

  .prob-bar-wrap { display:flex; align-items:center; gap:8px; }
  .prob-bar-bg { flex:1; height:8px; background:#e5f5ec; border-radius:4px; overflow:hidden; }
  .prob-bar-fill { height:100%; border-radius:4px; background:linear-gradient(90deg,var(--grass),var(--grass2)); transition:width .6s ease; }
  .prob-text { font-family:var(--font-mono); font-size:12px; font-weight:700; color:var(--grass); min-width:38px; text-align:left; }

  .trend { font-size:11px; font-weight:700; padding:3px 8px; border-radius:20px; font-family:var(--font-mono); }
  .trend-up   { background:#d1fae5; color:#065f46; }
  .trend-down { background:#fee2e2; color:#991b1b; }
  .trend-flat { background:#f3f4f6; color:var(--muted); }

  /* ── Analysis box ── */
  .analysis-box {
    margin-top: 16px;
    padding: 14px 16px;
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border-radius: 10px;
    border-right: 4px solid var(--grass);
  }
  .analysis-label { font-size:10px; color:var(--grass); font-family:var(--font-mono); letter-spacing:2px; margin-bottom:6px; }
  .analysis-text { font-size:13px; line-height:1.7; color:var(--text); }

  /* ── Results ── */
  .results-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:12px; }
  .result-item {
    background: var(--card2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px;
    text-align: center;
  }
  .result-group { font-size:10px; color:var(--muted); font-family:var(--font-mono); letter-spacing:1px; margin-bottom:6px; }
  .result-home { font-size:13px; font-weight:700; }
  .result-score {
    font-family:var(--font-head);
    font-size:28px;
    letter-spacing:2px;
    color:var(--grass);
    margin:4px 0;
    line-height:1;
  }
  .result-away { font-size:13px; font-weight:600; color:var(--muted); }
  .result-note { font-size:11px; color:var(--gold2); margin-top:4px; font-weight:600; }

  /* ── Bets ── */
  .stage-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px;
    background: linear-gradient(135deg,var(--grass),var(--grass2));
    color: #fff;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(26,124,62,.3);
  }
  .bet-list { display:flex; flex-direction:column; gap:12px; }
  .bet-item {
    background: var(--card2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    position: relative;
    overflow: hidden;
  }
  .bet-item::before {
    content:'';
    position:absolute;
    top:0; right:0;
    width:4px; height:100%;
  }
  .bet-item.high::before { background:var(--grass2); }
  .bet-item.medium::before { background:var(--gold); }
  .bet-item.low::before { background:var(--red); }

  .bet-header { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:6px; }
  .bet-match { font-weight:700; font-size:15px; color:var(--text); }
  .bet-confidence {
    font-family:var(--font-mono);
    font-size:11px;
    padding:3px 10px;
    border-radius:20px;
    font-weight:700;
    white-space:nowrap;
  }
  .conf-high   { background:#d1fae5; color:#065f46; }
  .conf-medium { background:#fef3c7; color:#92400e; }
  .conf-low    { background:#fee2e2; color:#991b1b; }

  .bet-time { font-family:var(--font-mono); font-size:11px; color:var(--blue); margin-bottom:10px; }
  .bet-pick {
    font-family:var(--font-head);
    font-size:20px;
    letter-spacing:1px;
    color:var(--grass);
    margin-bottom:6px;
  }
  .bet-reason { font-size:12px; color:var(--muted); line-height:1.5; }
  .bet-odds { display:inline-block; margin-top:8px; font-family:var(--font-mono); font-size:12px; font-weight:700; color:var(--gold2); background:#fef3c7; padding:2px 8px; border-radius:4px; }

  .load-more-btn {
    width:100%; margin-top:14px; padding:13px;
    background:#fff;
    border:2px dashed var(--grass);
    border-radius:10px;
    color:var(--grass);
    font-family:var(--font-body);
    font-size:13px;
    font-weight:700;
    cursor:pointer;
    transition:all .2s;
  }
  .load-more-btn:hover:not(:disabled) { background:#f0fdf4; }
  .load-more-btn:disabled { opacity:.45; cursor:not-allowed; }

  .disclaimer {
    font-size:11px; color:var(--muted); text-align:center;
    padding:12px; border-top:1px solid var(--border); margin-top:16px;
    font-style:italic;
  }
  .timestamp { font-family:var(--font-mono); font-size:11px; color:var(--muted); text-align:center; margin-top:24px; }

  @media (max-width:600px) {
    .standings th:nth-child(4), .standings td:nth-child(4) { display:none; }
  }
`;

const SEED = {
  lastUpdated: "15.6.2026 — יום 5",
  currentStage: "שלב הבתים",
  standings: [
    { rank:1, team:"🇫🇷 צרפת", prob:19, odds:"+500", trend:"up", note:"סגל עמוק" },
    { rank:2, team:"🇩🇪 גרמניה", prob:14, odds:"+1400", trend:"up", note:"7–1 על קוראסאו" },
    { rank:3, team:"🏴 אנגליה", prob:13, odds:"+650", trend:"flat", note:"בית קל" },
    { rank:4, team:"🇪🇸 ספרד", prob:12, odds:"+450", trend:"down", note:"0–0 קייפ ורדה" },
    { rank:5, team:"🇦🇷 ארגנטינה", prob:10, odds:"+900", trend:"flat", note:"מסי בן 39" },
    { rank:6, team:"🇵🇹 פורטוגל", prob:9, odds:"+850", trend:"flat", note:"רונאלדו" },
  ],
  results: [
    { group:"E", home:"גרמניה", score:"7–1", away:"קוראסאו", note:"xG 3.91" },
    { group:"H", home:"ספרד", score:"0–0", away:"קייפ ורדה", note:"⚠️ הפתעה" },
    { group:"G", home:"בלגיה", score:"0–1", away:"מצרים", note:"" },
    { group:"D", home:"ארה\"ב", score:"4–1", away:"פרגוואי", note:"" },
    { group:"C", home:"ברזיל", score:"1–1", away:"מרוקו", note:"ויניסיוס הציל" },
    { group:"F", home:"הולנד", score:"2–2", away:"יפן", note:"דרמטי" },
  ],
  bets: [
    { match:"צרפת – סנגל", datetime:"שלישי 16.6 בשעה 22:00", pick:"צרפת מנצחת 2:0", confidence:"high", odds:"~2.10", reason:"מבאפה ואוליז חדים, סגל עמוק לעומת הגנת סנגל" },
    { match:"נורווגיה – עיראק", datetime:"שלישי 16.6 בשעה 21:00", pick:"נורווגיה מנצחת 2:0", confidence:"high", odds:"~1.70", reason:"הלאנד מול הגנה חלשה של עיראק" },
    { match:"אנגליה – קרואטיה", datetime:"רביעי 17.6 בשעה 23:00", pick:"אנגליה מנצחת 2:1", confidence:"medium", odds:"~3.40", reason:"קיין בשיאו, קרואטיה מזדקנת" },
    { match:"פורטוגל – קונגו DR", datetime:"רביעי 17.6 בשעה 20:00", pick:"פורטוגל מנצחת 3:0", confidence:"high", odds:"~1.50", reason:"רונאלדו מול נבחרת חלשה" },
  ],
  analysis: "ספרד 0:0 עם קייפ ורדה — דפוס מדאיג חוזר. גרמניה 7:1 מרשים. צרפת המועמדת הראשית לפני יום 6."
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
      if (fresh.error) { setError(fresh.error + " מוצגים הנתונים האחרונים."); return; }
      setData(fresh);
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
      setData(prev => ({ ...prev, bets: merged }));
    } catch { } finally { setLoadingMore(false); }
  }, [data.bets]);

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
          <span className="trophy">🏆</span>
          <div className="header-eyebrow">FIFA WORLD CUP 2026 · ניתוח חי</div>
          <h1 className="hero-title">מונדיאל <span>2026</span></h1>
          <div className="hero-sub">ניתוח אוטומטי · סיכויי זכייה · המלצות הימורים</div>
        </header>

        <div className="refresh-bar">
          <span className="refresh-status">עדכון: <strong>{data.lastUpdated}</strong></span>
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
                      <td>
                        <div className="prob-bar-wrap">
                          <div className="prob-bar-bg"><div className="prob-bar-fill" style={{width:`${Math.min(s.prob*4,100)}%`}}/></div>
                          <span className="prob-text">{s.prob}%</span>
                        </div>
                      </td>
                      <td style={{fontFamily:"var(--font-mono)",fontSize:13,fontWeight:700,color:s.rank===1?"var(--gold2)":"var(--muted)"}}>{s.odds}</td>
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
              <div className="card-title">⚽ תוצאות — שלב הבתים</div>
              <div className="results-grid">
                {data.results?.map((r,i) => (
                  <div key={i} className="result-item">
                    <div className="result-group">בית {r.group}</div>
                    <div className="result-home">{r.home}</div>
                    <div className="result-score">{r.score}</div>
                    <div className="result-away">{r.away}</div>
                    {r.note && <div className="result-note">{r.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "bets" && (
            <div className="card">
              <div className="card-title">🎯 המלצות הימורים</div>
              {data.currentStage && <div className="stage-badge">⚽ {data.currentStage}</div>}
              <div className="bet-list">
                {data.bets?.map((b,i) => (
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
              <button className="load-more-btn" onClick={loadMoreBets} disabled={loadingMore}>
                {loadingMore ? "⏳ טוען..." : "➕ טען עוד המלצות"}
              </button>
              <div className="disclaimer">⚠️ להנאה בין חברים בלבד · לא ייעוץ פיננסי</div>
            </div>
          )}

          <div className="timestamp">מופעל על ידי {data.provider==="groq"?"Groq (Llama)":"Gemini (Google)"} · לחץ עדכן לרענון</div>
        </div>
      </div>
    </>
  );
}
