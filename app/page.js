"use client";
import { useState, useEffect, useCallback } from "react";

const CACHE_KEY = "wc2026_v3";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
  :root {
    --g1:#0d5c2e; --g2:#1a7c3e; --g3:#22a35a;
    --pitch:#f7fdf9; --white:#fff;
    --gold:#f5a623; --gold2:#e8931a; --goldbg:#fef3c7;
    --red:#e03535; --redbg:#fee2e2;
    --blue:#1a56db;
    --text:#111827; --muted:#6b7280;
    --border:#d1fae5; --card:#fff; --card2:#f0fdf4;
    --qual:#d1fae5; --qualtext:#065f46;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--pitch);color:var(--text);font-family:'Inter',sans-serif;min-height:100vh;}
  .app{max-width:960px;margin:0 auto;padding:0 0 80px;}

  /* Hero */
  .hero{background:linear-gradient(150deg,#0a4a24 0%,var(--g2) 60%,var(--g3) 100%);padding:36px 24px 30px;text-align:center;position:relative;overflow:hidden;}
  .hero::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,.03) 40px,rgba(255,255,255,.03) 80px);}
  .hero-bg{position:absolute;inset:0;opacity:.06;display:flex;align-items:center;justify-content:center;gap:80px;font-size:120px;pointer-events:none;user-select:none;}
  .hero-eyebrow{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:4px;color:rgba(255,255,255,.7);text-transform:uppercase;margin-bottom:8px;position:relative;}
  .hero-icons{font-size:30px;margin-bottom:6px;position:relative;letter-spacing:8px;}
  .hero-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(52px,10vw,92px);line-height:1;color:#fff;letter-spacing:3px;position:relative;}
  .hero-title span{color:var(--gold);text-shadow:0 2px 24px rgba(245,166,35,.6);}
  .hero-sub{font-size:12px;color:rgba(255,255,255,.65);margin-top:8px;font-family:'JetBrains Mono',monospace;position:relative;}

  /* Refresh bar */
  .rbar{display:flex;align-items:center;justify-content:space-between;padding:11px 20px;background:#fff;border-bottom:2px solid var(--border);position:sticky;top:0;z-index:10;box-shadow:0 2px 8px rgba(0,0,0,.06);}
  .rstatus{font-size:12px;color:var(--muted);font-family:'JetBrains Mono',monospace;}
  .rstatus strong{color:var(--text);}
  .rbtn{display:flex;align-items:center;gap:7px;padding:8px 18px;background:linear-gradient(135deg,var(--g2),var(--g3));color:#fff;border:none;border-radius:50px;font-weight:700;font-size:13px;cursor:pointer;transition:all .2s;box-shadow:0 2px 8px rgba(26,124,62,.3);}
  .rbtn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(26,124,62,.4);}
  .rbtn:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .spinner{width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .ldot{width:7px;height:7px;background:#ff4444;border-radius:50%;animation:pulse 1.4s ease-in-out infinite;}

  /* Error */
  .err{margin:14px 20px;padding:11px 16px;background:#fff5f5;border:1px solid #feb2b2;border-radius:10px;color:var(--red);font-size:13px;text-align:center;}

  /* Tabs */
  .tabs{display:flex;background:#fff;border-bottom:2px solid var(--border);overflow-x:auto;scrollbar-width:none;}
  .tabs::-webkit-scrollbar{display:none;}
  .tab{flex:none;padding:13px 14px 11px;border:none;border-bottom:3px solid transparent;background:transparent;color:var(--muted);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;margin-bottom:-2px;}
  .tab.active{color:var(--g2);border-bottom-color:var(--g2);}
  .tab:hover:not(.active){color:var(--text);}

  .content{padding:16px;}

  /* Card */
  .card{background:var(--card);border:1px solid #e5f5ec;border-radius:16px;padding:18px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.05);}
  .ctitle{font-family:'Bebas Neue',sans-serif;font-size:21px;letter-spacing:1px;color:var(--g2);margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid var(--border);}
  .empty{color:var(--muted);font-size:13px;text-align:center;padding:24px 0;}

  /* Win probability table */
  .wtable{width:100%;border-collapse:collapse;}
  .wtable th{text-align:right;padding:7px 10px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border);}
  .wtable td{padding:11px 10px;border-bottom:1px solid #f0faf4;vertical-align:middle;}
  .wtable tr:last-child td{border-bottom:none;}
  .wtable tr:hover td{background:#f0fdf4;}
  .rbadge{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;font-weight:800;font-size:12px;font-family:'JetBrains Mono',monospace;}
  .rb1{background:linear-gradient(135deg,var(--gold),var(--gold2));color:#fff;box-shadow:0 2px 8px rgba(245,166,35,.4);}
  .rb2{background:#e5e7eb;color:#374151;}
  .rb3{background:#fde68a;color:#92400e;}
  .rb4,.rb5,.rb6{background:#f3f4f6;color:var(--muted);}
  .pbar-wrap{display:flex;align-items:center;gap:8px;}
  .pbar-bg{flex:1;height:7px;background:#e5f5ec;border-radius:4px;overflow:hidden;}
  .pbar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--g2),var(--g3));transition:width .6s ease;}
  .ptext{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--g2);min-width:36px;text-align:left;}
  .trend{font-size:11px;font-weight:700;padding:2px 7px;border-radius:20px;font-family:'JetBrains Mono',monospace;}
  .trend-up{background:#d1fae5;color:#065f46;}
  .trend-down{background:var(--redbg);color:#991b1b;}
  .trend-flat{background:#f3f4f6;color:var(--muted);}
  .abox{margin-top:14px;padding:13px 15px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:10px;border-right:4px solid var(--g2);}
  .alabel{font-size:10px;color:var(--g2);font-family:'JetBrains Mono',monospace;letter-spacing:2px;margin-bottom:5px;}
  .atext{font-size:13px;line-height:1.7;color:var(--text);}

  /* Results grid */
  .rgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:10px;}
  .ritem{background:var(--card2);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;position:relative;overflow:hidden;}
  .ritem::before{content:'⚽';position:absolute;top:-8px;right:-6px;font-size:28px;opacity:.05;transform:rotate(15deg);}
  .rgroup{font-size:10px;color:var(--muted);font-family:'JetBrains Mono',monospace;letter-spacing:1px;margin-bottom:5px;}
  .rhome{font-size:13px;font-weight:700;}
  .rscore{font-family:'Bebas Neue',sans-serif;font-size:30px;letter-spacing:3px;color:var(--g2);margin:2px 0;line-height:1;}
  .raway{font-size:12px;font-weight:600;color:var(--muted);}

  /* Schedule */
  .slist{display:flex;flex-direction:column;gap:8px;}
  .sday-header{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:2px;color:var(--g2);text-transform:uppercase;margin:12px 0 6px;padding-right:4px;}
  .sday-header:first-child{margin-top:0;}
  .smatch{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;background:var(--card2);border:1px solid var(--border);border-radius:10px;}
  .smatch-teams{font-weight:600;font-size:14px;flex:1;}
  .smatch-vs{color:var(--muted);font-weight:400;margin:0 4px;}
  .smatch-time{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--g2);background:#d1fae5;padding:3px 8px;border-radius:6px;white-space:nowrap;}
  .smatch-group{font-size:11px;color:var(--muted);margin-top:2px;}

  /* Group standings table */
  .group-section{margin-bottom:20px;}
  .group-title{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;color:var(--g2);margin-bottom:8px;padding:6px 10px;background:var(--card2);border-radius:8px;border-right:3px solid var(--g2);}
  .gtable{width:100%;border-collapse:collapse;font-size:12px;}
  .gtable th{text-align:center;padding:6px 6px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border);}
  .gtable th:first-child{text-align:right;}
  .gtable td{padding:9px 6px;text-align:center;border-bottom:1px solid #f0faf4;}
  .gtable td:first-child{text-align:right;font-weight:600;}
  .gtable tr:last-child td{border-bottom:none;}
  .gtable tr.qualified td:first-child{color:var(--g2);font-weight:700;}
  .gtable tr.qualified{background:rgba(209,250,229,.2);}
  .qual-dot{display:inline-block;width:7px;height:7px;background:var(--g3);border-radius:50%;margin-left:4px;vertical-align:middle;}
  .gd-pos{color:var(--g2);}
  .gd-neg{color:var(--red);}

  /* Live scores */
  .live-section{background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px;}
  .live-title{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:1px;color:var(--red);margin-bottom:12px;display:flex;align-items:center;gap:8px;}
  @keyframes livepulse{0%,100%{opacity:1}50%{opacity:.4}}
  .live-dot{width:9px;height:9px;background:var(--red);border-radius:50%;animation:livepulse .9s ease-in-out infinite;}
  .live-card{background:linear-gradient(135deg,#fef2f2,#fff5f5);border:1px solid #fecaca;border-radius:10px;padding:14px;margin-bottom:8px;}
  .live-row{display:flex;align-items:center;justify-content:space-between;}
  .live-team{font-weight:700;font-size:14px;flex:1;}
  .live-score{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:3px;color:var(--red);margin:0 10px;line-height:1;}
  .live-min{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--red);background:#fee2e2;padding:2px 7px;border-radius:4px;text-align:center;margin-top:4px;}
  .live-btn{margin-top:10px;width:100%;padding:8px;background:#fee2e2;border:1px solid #fecaca;border-radius:8px;color:var(--red);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;}
  .live-btn:hover{background:#fecaca;}
  .live-btn:disabled{opacity:.5;cursor:not-allowed;}
  .no-live-box{text-align:center;padding:16px;}
  .no-live-icon{font-size:36px;display:block;margin-bottom:6px;}
  .no-live-btn{margin-top:10px;padding:8px 20px;background:var(--card2);border:1px solid var(--border);border-radius:8px;color:var(--g2);font-size:12px;font-weight:700;cursor:pointer;}
  .recent-title{font-size:10px;color:var(--muted);font-family:'JetBrains Mono',monospace;letter-spacing:2px;margin:10px 0 6px;}
  .recent-row{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--card2);border-radius:8px;margin-bottom:6px;}
  .recent-team{font-size:13px;font-weight:600;flex:1;}
  .recent-score{font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--g2);margin:0 8px;}

  /* Accordion */
  .acc-group{margin-bottom:8px;border:1px solid var(--border);border-radius:12px;overflow:hidden;}
  .acc-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--card2);cursor:pointer;border:none;width:100%;text-align:right;font-family:'Inter',sans-serif;transition:background .15s;}
  .acc-header:hover{background:#e5f5ec;}
  .acc-date{font-weight:700;font-size:14px;color:var(--g1);}
  .acc-meta{font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:2px;}
  .acc-arrow{font-size:11px;color:var(--muted);transition:transform .2s;}
  .acc-arrow.open{transform:rotate(180deg);}
  .acc-body{padding:12px;background:#fff;}

  /* Bracket */
  .bracket-stage{margin-bottom:20px;}
  .bracket-stage-title{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;color:var(--g1);margin-bottom:10px;text-align:center;}
  .bracket-match{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--card2);border:1px solid var(--border);border-radius:12px;margin-bottom:8px;}
  .bteam{font-weight:700;font-size:14px;flex:1;}
  .bteam.winner{color:var(--g2);}
  .bscore{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;color:var(--g2);margin:0 12px;}
  .bdate{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);}

  /* Bets */
  .sbadge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:linear-gradient(135deg,var(--g2),var(--g3));color:#fff;border-radius:50px;font-size:12px;font-weight:700;margin-bottom:14px;box-shadow:0 2px 8px rgba(26,124,62,.3);}
  .blist{display:flex;flex-direction:column;gap:10px;}
  .bitem{background:#fff;border:1px solid var(--border);border-radius:14px;padding:14px 16px;position:relative;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04);}
  .bitem::after{content:'';position:absolute;top:0;right:0;width:4px;height:100%;}
  .bitem::before{content:'⚽';position:absolute;bottom:-10px;left:-10px;font-size:56px;opacity:.04;pointer-events:none;}
  .bitem.high::after{background:var(--g3);}
  .bitem.medium::after{background:var(--gold);}
  .bitem.low::after{background:var(--red);}
  .bhdr{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px;}
  .bmatch{font-weight:700;font-size:14px;}
  .bconf{font-family:'JetBrains Mono',monospace;font-size:11px;padding:3px 9px;border-radius:20px;font-weight:700;white-space:nowrap;}
  .ch{background:#d1fae5;color:#065f46;}
  .cm{background:var(--goldbg);color:#92400e;}
  .cl{background:var(--redbg);color:#991b1b;}
  .btime{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--blue);margin-bottom:8px;}
  .bpick{font-family:'Bebas Neue',sans-serif;font-size:21px;letter-spacing:1px;color:var(--g2);margin-bottom:4px;}
  .breason{font-size:12px;color:var(--muted);line-height:1.5;}
  .bodds{display:inline-block;margin-top:7px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--gold2);background:var(--goldbg);padding:2px 8px;border-radius:4px;}
  .lmbtn{width:100%;margin-top:12px;padding:12px;background:#fff;border:2px dashed var(--g2);border-radius:10px;color:var(--g2);font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;}
  .lmbtn:hover:not(:disabled){background:var(--card2);}
  .lmbtn:disabled{opacity:.45;cursor:not-allowed;}
  .disc{font-size:11px;color:var(--muted);text-align:center;padding:10px;border-top:1px solid var(--border);margin-top:14px;font-style:italic;}

  .ts{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);text-align:center;margin-top:20px;}
  .cbadge{font-size:11px;color:var(--gold2);background:var(--goldbg);padding:2px 8px;border-radius:4px;font-family:'JetBrains Mono',monospace;margin-right:8px;}

  @media(max-width:600px){
    .wtable th:nth-child(4),.wtable td:nth-child(4){display:none;}
    .gtable th:nth-child(6),.gtable td:nth-child(6){display:none;}
  }
`;

const SEED_STANDINGS = [
  {rank:1,team:"🇫🇷 צרפת",prob:19,odds:"+500",trend:"up",note:"סגל עמוק"},
  {rank:2,team:"🇩🇪 גרמניה",prob:14,odds:"+1400",trend:"up",note:"7–1 על קוראסאו"},
  {rank:3,team:"🏴 אנגליה",prob:13,odds:"+650",trend:"flat",note:"בית קל"},
  {rank:4,team:"🇪🇸 ספרד",prob:12,odds:"+450",trend:"down",note:"0–0 קייפ ורדה"},
  {rank:5,team:"🇦🇷 ארגנטינה",prob:10,odds:"+900",trend:"flat",note:"מסי בן 39"},
  {rank:6,team:"🇵🇹 פורטוגל",prob:9,odds:"+850",trend:"flat",note:"רונאלדו"},
];

export default function Page() {
  const [tab, setTab] = useState("win");
  const [fixtures, setFixtures] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [modal, setModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [openAccordions, setOpenAccordions] = useState({});
  const [lastUpdated, setLastUpdated] = useState("טוען...");
  const [provider, setProvider] = useState("");

  // Load cache on mount
  useEffect(() => {
    try {
      const c = localStorage.getItem(CACHE_KEY);
      if (c) {
        const p = JSON.parse(c);
        if (p.fixtures) { setFixtures(p.fixtures); setFromCache(true); }
        if (p.analysis) { setAnalysis(p.analysis); setLastUpdated(p.analysis.lastUpdated||""); setProvider(p.analysis.provider||""); }
      }
    } catch {}
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null); setFromCache(false);
    try {
      // Step 1: Fetch live fixtures (fast, no AI)
      const fRes = await fetch("/api/fixtures");
      const fData = await fRes.json();
      if (fData.error) throw new Error(fData.error);
      setFixtures(fData);

      // Step 2: AI analysis with fixtures data
      const aRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: fData.results || [],
          upcoming: fData.upcoming || [],
          groups: fData.groups || [],
          currentStage: fData.currentStage || "שלב הבתים"
        })
      });
      const aData = await aRes.json();
      if (aData.error) { setError(aData.error + " מוצגים הנתונים האחרונים."); }
      else {
        setAnalysis(aData);
        setLastUpdated(aData.lastUpdated || "");
        setProvider(aData.provider || "");
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ fixtures: fData, analysis: aData })); } catch {}
      }
    } catch(e) {
      setError(e.message || "שגיאה בטעינה. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreBets = useCallback(async () => {
    setLoadingMore(true);
    try {
      const aRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: fixtures?.results || [],
          upcoming: fixtures?.upcoming || [],
          groups: fixtures?.groups || [],
          currentStage: fixtures?.currentStage || "שלב הבתים"
        })
      });
      const fresh = await aRes.json();
      if (fresh.error || !fresh.bets) throw new Error("no bets");
      // Add new bets - mark as alternative analysis if same match exists
      const existingMatches = new Set((analysis?.bets||[]).map(b=>b.match));
      const newBets = fresh.bets.map(b => 
        existingMatches.has(b.match) 
          ? { ...b, match: b.match + " (ניתוח חלופי)" }
          : b
      );
      const merged = [...(analysis?.bets||[]), ...newBets];
      const updated = { ...analysis, bets: merged };
      setAnalysis(updated);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ fixtures, analysis: updated })); } catch {}
    } catch {} finally { setLoadingMore(false); }
  }, [fixtures, analysis]);

  const openModal = useCallback(async (bet) => {
    setModal(bet);
    setModalData(null);
    setModalLoading(true);
    try {
      const res = await fetch("/api/match-analysis", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          home: bet.match.split(" - ")[0]?.replace(/^[\uD800-\uDBFF][\uDC00-\uDFFF]\s*/,"").trim() || bet.match,
          away: bet.match.split(" - ")[1]?.replace(/^[\uD800-\uDBFF][\uDC00-\uDFFF]\s*/,"").trim() || "",
          datetime: bet.datetime || "",
          mainPick: bet.pick || "",
          recentResults: (fixtures?.results||[]).slice(0,6).map(r=>`${r.home} ${r.score} ${r.away}`).join(", ")
        })
      });
      const data = await res.json();
      if (!data.error) setModalData(data);
      else setModalData({ error: data.error });
    } catch(e) {
      setModalData({ error: e.message });
    } finally {
      setModalLoading(false);
    }
  }, [fixtures]);

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({...prev, [key]: !prev[key]}));
  };

  const fetchLive = useCallback(async () => {
    setLiveLoading(true);
    try {
      const res = await fetch("/api/live");
      const data = await res.json();
      if (!data.error) setLiveData(data);
    } catch {} finally { setLiveLoading(false); }
  }, []);

  // Auto-poll live scores every 2 min when page is visible
  useEffect(() => {
    fetchLive();
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") fetchLive();
    }, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchLive]);

  useEffect(() => {
    const id = setInterval(refresh, 60*60*1000);
    return () => clearInterval(id);
  }, [refresh]);

  const cl = c => c==="high"?"ביטחון גבוה":c==="medium"?"ביטחון בינוני":"ביטחון נמוך";
  const cc = c => c==="high"?"ch":c==="medium"?"cm":"cl";

  // Group schedule by date
  const scheduleByDay = (fixtures?.schedule || []).reduce((acc, m) => {
    const key = m.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  // Determine winner for bracket
  const getWinner = (m) => {
    if (!m.score) return null;
    const [h,a] = m.score.split("–").map(Number);
    if (h > a) return "home";
    if (a > h) return "away";
    return "draw";
  };

  const standings = analysis?.standings || SEED_STANDINGS;

  const TABS = [
    { id:"win",      label:"📊 סיכויי זכייה" },
    { id:"results",  label:"⚽ תוצאות" },
    { id:"schedule", label:"📅 לוח משחקים" },
    { id:"groups",   label:"🏆 טבלאות בתים" },
    { id:"bets",     label:"🎯 הימורים" },
  ];

  return (
    <>
      <style>{S}</style>
      <div className="app">

        <header className="hero">
          <div className="hero-bg">🏆⚽🥅</div>
          <div className="hero-eyebrow">FIFA WORLD CUP 2026 · ניתוח חי</div>
          <div className="hero-icons">🏆 ⚽ 🥇</div>
          <h1 className="hero-title">מונדיאל <span>2026</span></h1>
          <div className="hero-sub">ניתוח אוטומטי · סיכויי זכייה · המלצות הימורים</div>
        </header>

        <div className="rbar">
          <div>
            {fromCache && <span className="cbadge">מטמון</span>}
            <span className="rstatus">עדכון: <strong>{lastUpdated || "—"}</strong></span>
          </div>
          <button className="rbtn" onClick={refresh} disabled={loading}>
            {loading ? <><div className="spinner"/>מעדכן...</> : <><div className="ldot"/>עדכן עכשיו</>}
          </button>
        </div>

        {error && <div className="err">{error}</div>}

        <div className="tabs">
          {TABS.map(t => <button key={t.id} className={`tab${tab===t.id?" active":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}
        </div>

        <div className="content">

          {/* ── WIN PROBABILITY ── */}
          {tab === "win" && (
            <div className="card">
              <div className="ctitle">📊 סיכויי זכייה</div>
              <table className="wtable">
                <thead><tr><th>#</th><th>נבחרת</th><th>הסתברות</th><th>אודס</th><th>טרנד</th></tr></thead>
                <tbody>
                  {standings.map(s => (
                    <tr key={s.rank}>
                      <td><span className={`rbadge rb${s.rank}`}>{s.rank}</span></td>
                      <td style={{fontWeight:700,fontSize:14}}>{s.team}</td>
                      <td><div className="pbar-wrap"><div className="pbar-bg"><div className="pbar-fill" style={{width:`${Math.min(s.prob*4,100)}%`}}/></div><span className="ptext">{s.prob}%</span></div></td>
                      <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:s.rank===1?"var(--gold2)":"var(--muted)"}}>{s.odds}</td>
                      <td><span className={`trend trend-${s.trend}`}>{s.trend==="up"?"↑":s.trend==="down"?"↓":"→"} {s.note}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analysis?.analysis && (
                <div className="abox">
                  <div className="alabel">ניתוח עדכני</div>
                  <p className="atext">{analysis.analysis}</p>
                </div>
              )}
            </div>
          )}

          {/* ── RESULTS ── */}
          {tab === "results" && (
            <div>
              {/* LIVE SCORES */}
              <div className="live-section">
                <div className="live-title">
                  <div className="live-dot"/>
                  תוצאות חיות
                </div>
                {liveData?.hasLive ? (
                  <>
                    {liveData.live.map((m,i) => (
                      <div key={i} className="live-card">
                        <div className="live-row">
                          <div className="live-team">{m.home}</div>
                          <div className="live-score">{m.homeScore}:{m.awayScore}</div>
                          <div className="live-team" style={{textAlign:"left"}}>{m.away}</div>
                        </div>
                        <div className="live-min">{m.minute ? `${m.minute}'` : m.statusHe}</div>
                      </div>
                    ))}
                    <button className="live-btn" onClick={fetchLive} disabled={liveLoading}>
                      {liveLoading ? "⏳ מעדכן..." : "🔄 רענן תוצאות"}
                    </button>
                  </>
                ) : (
                  <div className="no-live-box">
                    <span className="no-live-icon">📺</span>
                    <div style={{fontSize:13,color:"var(--muted)"}}>
                      {liveData ? "אין משחקים בשידור חי כרגע" : "טוען..."}
                    </div>
                    <button className="no-live-btn" onClick={fetchLive} disabled={liveLoading}>
                      {liveLoading ? "⏳" : "🔄 בדוק עכשיו"}
                    </button>
                  </div>
                )}
                {liveData?.recentFinished?.length > 0 && (
                  <>
                    <div className="recent-title">הסתיימו לאחרונה</div>
                    {liveData.recentFinished.map((m,i) => (
                      <div key={i} className="recent-row">
                        <div className="recent-team">{m.home}</div>
                        <div className="recent-score">{m.homeScore}:{m.awayScore}</div>
                        <div className="recent-team" style={{textAlign:"left"}}>{m.away}</div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* RESULTS BY DATE (ACCORDION) */}
              <div className="card">
                <div className="ctitle">⚽ תוצאות — {fixtures?.currentStage || "שלב הבתים"}</div>
                {!fixtures?.results?.length ? (
                  <p className="empty">לחץ "עדכן עכשיו" לטעינת תוצאות</p>
                ) : (() => {
                  const byDate = {};
                  fixtures.results.forEach(r => {
                    const key = r.date
                      ? new Date(r.date).toLocaleDateString("he-IL",{day:"numeric",month:"long",timeZone:"Asia/Jerusalem"})
                      : (r.group || "—");
                    if (!byDate[key]) byDate[key] = [];
                    byDate[key].push(r);
                  });
                  const dates = Object.keys(byDate);
                  return dates.map((date, di) => {
                    const isOpen = di === 0 || !!openAccordions[date];
                    return (
                      <div key={date} className="acc-group">
                        <button className="acc-header" onClick={() => toggleAccordion(date)}>
                          <div>
                            <div className="acc-date">{date}</div>
                            <div className="acc-meta">{byDate[date].length} משחקים</div>
                          </div>
                          <span className={`acc-arrow${isOpen?" open":""}`}>▼</span>
                        </button>
                        {isOpen && (
                          <div className="acc-body">
                            <div className="rgrid">
                              {byDate[date].map((r,i) => (
                                <div key={i} className="ritem">
                                  <div className="rgroup">{r.group || r.stage}</div>
                                  <div className="rhome">{r.home}</div>
                                  <div className="rscore">{r.score}</div>
                                  <div className="raway">{r.away}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Knockout bracket */}
              {fixtures?.knockoutMatches?.length > 0 && (
                <div className="card">
                  <div className="ctitle">🏆 שלב הנוקאאוט</div>
                  {["שמינית גמר","רבע גמר","חצי גמר","מקום שלישי","גמר"].map(stage => {
                    const ms = fixtures.knockoutMatches.filter(m=>m.stage===stage && m.score);
                    if (!ms.length) return null;
                    return (
                      <div key={stage} className="bracket-stage">
                        <div className="bracket-stage-title">{stage}</div>
                        {ms.map((m,i) => {
                          const w = getWinner(m);
                          return (
                            <div key={i} className="bracket-match">
                              <span className={`bteam${w==="home"?" winner":""}`}>{m.home}</span>
                              <span className="bscore">{m.score}</span>
                              <span className={`bteam${w==="away"?" winner":""}`} style={{textAlign:"left"}}>{m.away}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── SCHEDULE ── */}
          {tab === "schedule" && (
            <div className="card">
              <div className="ctitle">📅 לוח משחקים קרובים</div>
              {!fixtures?.schedule?.length ? (
                <p className="empty">לחץ "עדכן עכשיו" לטעינת לוח המשחקים</p>
              ) : (
                <div className="slist">
                  {Object.entries(scheduleByDay).map(([date, matches]) => (
                    <div key={date}>
                      <div className="sday-header">📅 {matches[0].day} · {date}</div>
                      {matches.map((m,i) => (
                        <div key={i} className="smatch">
                          <div style={{flex:1}}>
                            <div className="smatch-teams">
                              {m.home} <span className="smatch-vs">נגד</span> {m.away}
                            </div>
                            <div className="smatch-group">{m.group || m.stage}</div>
                          </div>
                          <div className="smatch-time">{m.time}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── GROUP STANDINGS ── */}
          {tab === "groups" && (
            <div className="card">
              <div className="ctitle">🏆 טבלאות הבתים</div>
              {!fixtures?.groups?.length ? (
                <p className="empty">לחץ "עדכן עכשיו" לטעינת הטבלאות</p>
              ) : (
                fixtures.groups.map((g,gi) => (
                  <div key={gi} className="group-section">
                    <div className="group-title">{g.group}</div>
                    <table className="gtable">
                      <thead>
                        <tr>
                          <th>קבוצה</th>
                          <th>מ'</th>
                          <th>נ'</th>
                          <th>ת'</th>
                          <th>ה'</th>
                          <th>שע"מ</th>
                          <th>נק'</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.table.map((t,ti) => (
                          <tr key={ti} className={t.qualified?"qualified":""}>
                            <td>
                              {t.qualified && <span className="qual-dot"/>}
                              {t.team}
                            </td>
                            <td>{t.played}</td>
                            <td>{t.won}</td>
                            <td>{t.drawn}</td>
                            <td>{t.lost}</td>
                            <td className={t.gd>0?"gd-pos":t.gd<0?"gd-neg":""}>{t.gd>0?"+":""}{t.gd}</td>
                            <td style={{fontWeight:700}}>{t.pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
              {fixtures?.groups?.length > 0 && (
                <p style={{fontSize:11,color:"var(--muted)",marginTop:8,textAlign:"right"}}>
                  ● נקודה ירוקה = עברה לשלב הבא (שתי הראשונות בכל בית)
                </p>
              )}
            </div>
          )}

          {/* ── BETS ── */}
          {tab === "bets" && (
            <div className="card">
              <div className="ctitle">🎯 המלצות הימורים</div>
              {fixtures?.currentStage && <div className="sbadge">⚽ {fixtures.currentStage}</div>}
              {!analysis?.bets?.length ? (
                <p className="empty">לחץ "עדכן עכשיו" לקבלת המלצות</p>
              ) : (
                <div className="blist">
                  {analysis.bets.map((b,i) => (
                    <div key={i} className={`bitem ${b.confidence}`}>
                      <div className="bhdr">
                        <span className="bmatch">{b.match}</span>
                        <span className={`bconf ${cc(b.confidence)}`}>{cl(b.confidence)}</span>
                      </div>
                      {b.datetime && <div className="btime">🕐 {b.datetime}</div>}
                      <div className="bpick">✓ {b.pick}</div>
                      <div className="breason">{b.reason?.split(".")[0]}.</div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10,gap:8}}>
                        {b.odds && <span className="bodds">אודס: {b.odds}</span>}
                        <button
                          onClick={()=>openModal(b)}
                          style={{padding:"6px 14px",background:"linear-gradient(135deg,var(--g2),var(--g3))",color:"#fff",border:"none",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,boxShadow:"0 2px 6px rgba(26,124,62,.3)",whiteSpace:"nowrap"}}
                        >
                          🔍 ניתוח מלא
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button className="lmbtn" onClick={loadMoreBets} disabled={loadingMore}>
                {loadingMore?"⏳ טוען...":"➕ טען עוד המלצות"}
              </button>
              <div className="disc">⚠️ להנאה בין חברים בלבד · לא ייעוץ פיננסי</div>
            </div>
          )}

          {/* ── MATCH DETAIL MODAL ── */}
          {modal && (
            <div className="modal-overlay" onClick={(e)=>{if(e.target.classList.contains("modal-overlay")){setModal(null);setModalData(null);}}}>
              <div className="modal">
                <div className="modal-handle"/>
                <div className="modal-header">
                  <div className="modal-title">{modal.match}</div>
                  <button className="modal-close" onClick={()=>{setModal(null);setModalData(null);}}>✕</button>
                </div>

                {/* Main pick */}
                <div className="modal-section">
                  <div className="modal-section-title">המלצה ראשית</div>
                  <div className="bpick" style={{fontSize:24}}>✓ {modal.pick}</div>
                  {modal.datetime && <div className="btime" style={{marginTop:6}}>🕐 {modal.datetime}</div>}
                </div>

                {modalLoading && <div className="modal-spinner">🔄 טוען ניתוח מעמיק...</div>}

                {modalData?.error && <div className="err">{modalData.error}</div>}

                {modalData && !modalData.error && (
                  <>
                    {/* Deep analysis */}
                    <div className="modal-section">
                      <div className="modal-section-title">ניתוח מעמיק</div>
                      <p className="modal-analysis">{modalData.mainAnalysis}</p>
                    </div>

                    {/* Key factors */}
                    {modalData.mainFactors?.length > 0 && (
                      <div className="modal-section">
                        <div className="modal-section-title">גורמים מכריעים</div>
                        <div className="modal-factors">
                          {modalData.mainFactors.map((f,i)=>(
                            <div key={i} className="modal-factor">{f}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key player */}
                    {modalData.keyPlayer && (
                      <div className="modal-section">
                        <div className="modal-section-title">שחקן מפתח</div>
                        <div className="modal-kp">
                          <div className="modal-kp-name">⭐ {modalData.keyPlayer.name} — {modalData.keyPlayer.team}</div>
                          <div className="modal-kp-reason">{modalData.keyPlayer.reason}</div>
                        </div>
                      </div>
                    )}

                    {/* Risk */}
                    {modalData.riskLevel && (
                      <div className="modal-section">
                        <div className="modal-section-title">רמת סיכון</div>
                        <span className={`modal-risk risk-${modalData.riskLevel}`}>
                          {modalData.riskLevel==="low"?"🟢 סיכון נמוך":modalData.riskLevel==="medium"?"🟡 סיכון בינוני":"🔴 סיכון גבוה"}
                        </span>
                      </div>
                    )}

                    {/* Alternatives */}
                    {modalData.alternatives?.length > 0 && (
                      <div className="modal-section">
                        <div className="modal-section-title">תוצאות חלופיות</div>
                        {modalData.alternatives.map((a,i)=>(
                          <div key={i} className="modal-alt">
                            <div className="modal-alt-pick">{a.pick}</div>
                            <div className="modal-alt-meta">
                              {a.probability && <span className="modal-alt-prob">{a.probability}</span>}
                              {a.odds && <span className="modal-alt-odds">אודס: {a.odds}</span>}
                            </div>
                            <div className="modal-alt-reason">{a.reason}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="ts">
            מופעל על ידי {provider==="groq"?"Groq (Llama)":"Gemini (Google)"} + football-data.org · לחץ עדכן לרענון
          </div>
        </div>
      </div>
    </>
  );
}
