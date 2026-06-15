export const dynamic = "force-dynamic";

export async function GET() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  const result = {
    gemini_key_present: !!geminiKey,
    gemini_key_prefix: geminiKey ? geminiKey.substring(0,8) : null,
    groq_key_present: !!groqKey,
    groq_key_prefix: groqKey ? groqKey.substring(0,8) : null,
  };

  // Test Groq if key exists
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: "Say: OK" }],
          max_tokens: 5
        })
      });
      const data = await res.json();
      result.groq_status = res.status;
      result.groq_ok = res.ok;
      result.groq_answer = data?.choices?.[0]?.message?.content || null;
      result.groq_error = data?.error || null;
    } catch(e) {
      result.groq_exception = e.message;
    }
  }

  return Response.json(result);
}
