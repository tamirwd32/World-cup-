export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const key = process.env.GEMINI_API_KEY;
  
  // Detailed diagnostics
  if (!key) {
    console.error("[analyze] ERROR: GEMINI_API_KEY is missing");
    return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
  }
  
  console.log("[analyze] Key present, length:", key.length, "prefix:", key.substring(0,8));
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

  try {
    console.log("[analyze] Calling Gemini API...");
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(50000),
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Say only the word: OK" }] }],
        generationConfig: { maxOutputTokens: 10 }
      })
    });

    console.log("[analyze] Gemini status:", res.status);
    const data = await res.json();
    console.log("[analyze] Gemini response:", JSON.stringify(data).substring(0, 300));

    if (!res.ok) {
      return Response.json({ 
        error: "Gemini error: " + (data?.error?.message || res.status),
        gemini_status: res.status,
        gemini_error: data?.error
      }, { status: 502 });
    }

    return Response.json({ 
      ok: true, 
      gemini_status: res.status,
      test: data?.candidates?.[0]?.content?.parts?.[0]?.text 
    });

  } catch(e) {
    console.error("[analyze] Exception:", e.message);
    return Response.json({ error: e.message, type: e.constructor.name }, { status: 500 });
  }
}
