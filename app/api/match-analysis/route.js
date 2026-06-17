export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function callGemini(key, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        contents:[{role:"user",parts:[{text:prompt}]}],
        generationConfig:{temperature:0.4,maxOutputTokens:2000}
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
        {role:"system",content:"You are a football analyst. Respond with ONLY valid JSON. Write real Hebrew analysis."},
        {role:"user",content:prompt}
      ],
      temperature:0.4,
      max_tokens:2000
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Groq "+res.status);
  return data?.choices?.[0]?.message?.content||"";
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g,"").trim();
  try{return JSON.parse(clean);}
  catch{
    const m=clean.match(/\{[\s\S]*\}/);
    if(!m) throw new Error("No JSON");
    return JSON.parse(m[0]);
  }
}

export async function POST(req) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY;

  let body={};
  try{body=await req.json();}catch{}

  const {home="",away="",datetime="",mainPick="",recentResults=""} = body;

  const prompt = `You are a World Cup 2026 expert analyst. Analyze this specific match in depth.

MATCH: ${home} vs ${away}
KICKOFF: ${datetime}
MAIN RECOMMENDATION: ${mainPick}
RECENT RESULTS CONTEXT: ${recentResults || "Group stage, early matches"}

Return ONLY a valid JSON object:
{
  "mainAnalysis": "4-6 sentences of deep Hebrew analysis explaining WHY the main pick is recommended. Cover team form, key players, tactical factors, historical context.",
  "mainFactors": ["factor 1 in Hebrew", "factor 2 in Hebrew", "factor 3 in Hebrew"],
  "alternatives": [
    {
      "pick": "alternative result with score e.g. תיקו 1:1",
      "probability": "20%",
      "odds": "~3.20",
      "reason": "2-3 sentences in Hebrew explaining when/why this alternative could happen"
    },
    {
      "pick": "second alternative with score",
      "probability": "15%",
      "odds": "~5.00",
      "reason": "2-3 sentences in Hebrew explaining this scenario"
    }
  ],
  "keyPlayer": {
    "name": "most important player name",
    "team": "Hebrew team name",
    "reason": "1-2 Hebrew sentences on why this player is decisive"
  },
  "riskLevel": "low|medium|high",
  "confidence": "high|medium|low"
}

CRITICAL: Write real, specific analysis. No placeholders. No double quotes inside strings.`;

  let text="", provider="unknown";

  if(geminiKey){
    try{text=await callGemini(geminiKey,prompt);provider="gemini";}
    catch(e){if(e.code!==429&&!groqKey)return Response.json({error:String(e.message)},{status:502});}
  }
  if(!text&&groqKey){
    try{text=await callGroq(groqKey,prompt);provider="groq";}
    catch(e){return Response.json({error:"AI לא זמין"},{status:502});}
  }
  if(!text) return Response.json({error:"לא מוגדר מפתח AI"},{status:500});

  try{
    const parsed=parseJSON(text);
    if(!parsed.mainAnalysis) throw new Error("Invalid shape");
    return Response.json({...parsed,provider},{headers:{"Cache-Control":"no-store"}});
  }catch(e){
    return Response.json({error:"שגיאה: "+e.message},{status:502});
  }
}
