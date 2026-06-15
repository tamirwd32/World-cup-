export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ step: "FAIL", error: "No API key in env" });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Say: OK" }] }],
          generationConfig: { maxOutputTokens: 5 }
        })
      }
    );
    const data = await res.json();
    return Response.json({
      step: "DONE",
      gemini_status: res.status,
      gemini_ok: res.ok,
      error: data?.error || null,
      answer: data?.candidates?.[0]?.content?.parts?.[0]?.text || null
    });
  } catch(e) {
    return Response.json({ step: "EXCEPTION", error: e.message });
  }
}
