export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FLAG = {
  "צרפת":"🇫🇷","גרמניה":"🇩🇪","אנגליה":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","ספרד":"🇪🇸","ארגנטינה":"🇦🇷",
  "פורטוגל":"🇵🇹","ברזיל":"🇧🇷","הולנד":"🇳🇱","בלגיה":"🇧🇪","קרואטיה":"🇭🇷",
  "אורוגוואי":"🇺🇾","מקסיקו":"🇲🇽","ארהב":"🇺🇸","קנדה":"🇨🇦","מרוקו":"🇲🇦",
  "יפן":"🇯🇵","קוריאה":"🇰🇷","סנגל":"🇸🇳","נורווגיה":"🇳🇴","שוודיה":"🇸🇪",
  "דנמרק":"🇩🇰","שווייץ":"🇨🇭","פולין":"🇵🇱","סרביה":"🇷🇸","אקוודור":"🇪🇨",
  "קולומביה":"🇨🇴","אוסטרליה":"🇦🇺","איראן":"🇮🇷","ערב הסעודית":"🇸🇦","מצרים":"🇪🇬",
  "תוניסיה":"🇹🇳","גאנה":"🇬🇭","דרום אפריקה":"🇿🇦","צ'כיה":"🇨🇿","בוסניה":"🇧🇦",
  "קטאר":"🇶🇦","קייפ ורדה":"🇨🇻","חוף השנהב":"🇨🇮","קוראסאו":"🇨🇼","פרגוואי":"🇵🇾",
  "טורקיה":"🇹🇷","אוסטריה":"🇦🇹","אלג'יריה":"🇩🇿","ירדן":"🇯🇴","קונגו DR":"🇨🇩",
  "ניו זילנד":"🇳🇿","עיראק":"🇮🇶","האיטי":"🇭🇹","סקוטלנד":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","אוזבקיסטן":"🇺🇿","פנמה":"🇵🇦",
};

function withFlag(name) {
  const clean = (name||"").replace(/ \(ניתוח חלופי\)/,"");
  const flag = FLAG[clean] || "";
  return flag ? `${flag} ${name}` : name;
}

function safe(name) {
  return (name||"").replace(/"/g,"'").replace(/\\/g,"");
}

async function callGemini(key, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        contents:[{role:"user",parts:[{text:prompt}]}],
        generationConfig:{temperature:0.3,maxOutputTokens:3000}
      })
    }
  );
  const data = await res.json();
  if (res.status===429){const e=new Error("rate_limited");e.code=429;throw e;}
  if (!res.ok) throw new Error("Gemini "+res.status);
  return data?.candidates?.[0]?.content?.parts?.[0]?.text||"";
}

async function callGroq(key, prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions",{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
    body:JSON.stringify({
      model:"llama-3.3-70b-versatile",
      messages:[
        {role:"system",content:"You are a sports analyst. Respond with ONLY a valid JSON object. No markdown. Write real Hebrew analysis, never placeholders."},
        {role:"user",content:prompt}
      ],
      temperature:0.3,
      max_tokens:3000
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Groq "+res.status+": "+(data?.error?.message||""));
  return data?.choices?.[0]?.message?.content||"";
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g,"").trim();
  try{return JSON.parse(clean);}
  catch{
    const m=clean.match(/\{[\s\S]*\}/);
    if(!m) throw new Error("No JSON found");
    return JSON.parse(m[0]);
  }
}

export async function POST(req) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY;

  let fixturesData={};
  try{fixturesData=await req.json();}catch{}

  const {results=[],upcoming=[],groups=[],currentStage="שלב הבתים"}=fixturesData;

  const resultsText = results.length>0
    ? results.slice(0,12).map(r=>`${safe(r.home)} ${r.score} ${safe(r.away)} (${r.group})`).join(", ")
    : "No results yet";

  const standingsText = groups.length>0
    ? groups.slice(0,6).map(g=>
        `${g.group}: `+g.table.slice(0,4).map(t=>`${safe(t.team)} ${t.pts}pts`).join(", ")
      ).join(" | ")
    : "Not available";

  // Build explicit bet request for each upcoming match
  const betRequests = upcoming.length>0
    ? upcoming.map((u,i)=>
        `Bet ${i+1}: ${safe(u.home)} vs ${safe(u.away)} at ${u.datetime}`
      ).join("\n")
    : "No upcoming fixtures";

  const prompt = `You are a World Cup 2026 analyst. Create betting recommendations for ALL upcoming matches.

RESULTS: ${resultsText}
STAGE: ${currentStage}
STANDINGS: ${standingsText}

UPCOMING MATCHES - you MUST create exactly one bet for EACH match below:
${betRequests}

Return a JSON object with these fields:

"lastUpdated": today Hebrew date e.g. "16.6.2026 - יום 6"

"standings": array of 6 objects:
- rank: 1 to 6
- team: Hebrew team name only (no flag, no emoji)
- prob: integer win probability percentage
- odds: e.g. "+500"
- trend: "up", "down", or "flat"
- note: real Hebrew insight about this team, max 35 chars

"bets": array of EXACTLY ${upcoming.length} objects, one per match above in order:
- match: "Hebrew home team - Hebrew away team"
- datetime: exact datetime string from the match data above
- pick: specific score prediction in Hebrew e.g. "צרפת מנצחת 2:1" or "תיקו 1:1"
- confidence: "high", "medium", or "low"
- odds: bookmaker odds e.g. "~1.85"
- reason: 1-2 real sentences in Hebrew explaining your prediction

"analysis": 2-3 Hebrew sentences about the tournament so far

CRITICAL:
- Create ${upcoming.length} bets, one per match. Do not skip any match.
- Write real analysis, not placeholders
- No double-quote characters inside string values
- Return ONLY the JSON, nothing before or after`;

  let text="", provider="unknown";

  if(geminiKey){
    try{text=await callGemini(geminiKey,prompt);provider="gemini";}
    catch(e){if(e.code!==429&&!groqKey)return Response.json({error:String(e.message)},{status:502});}
  }
  if(!text&&groqKey){
    try{text=await callGroq(groqKey,prompt);provider="groq";}
    catch(e){return Response.json({error:"כל ספקי ה-AI אינם זמינים. נסו שוב."},{status:502});}
  }
  if(!text) return Response.json({error:"לא מוגדר מפתח AI."},{status:500});

  try{
    const parsed=parseJSON(text);
    if(!parsed.standings) throw new Error("missing standings");

    // Add flags to team names in standings
    if(parsed.standings){
      parsed.standings=parsed.standings.map(s=>({
        ...s,
        team: withFlag(s.team)
      }));
    }

    // Add flags to team names in bets
    if(parsed.bets){
      parsed.bets=parsed.bets
        .filter(b=>b.match&&b.pick&&b.reason&&b.reason.length>5)
        .map(b=>{
          const parts=b.match.split(" - ");
          if(parts.length===2){
            const home=withFlag(parts[0].trim());
            const away=withFlag(parts[1].trim());
            return {...b, match:`${home} - ${away}`};
          }
          return b;
        });
    }

    return Response.json({...parsed,provider},{headers:{"Cache-Control":"no-store"}});
  }catch(e){
    return Response.json({error:"שגיאה בניתוח: "+e.message},{status:502});
  }
}
