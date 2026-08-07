const MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function generateWithHuggingFace(systemInstruction, userPrompt) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HUGGINGFACE_MODEL;
  if (!apiKey || !model) return null;

  const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = new Error(`Hugging Face API error (${res.status}): ${(await res.text()).slice(0, 300)}`);
    err.statusCode = 502;
    throw err;
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    const err = new Error("Hugging Face returned no content");
    err.statusCode = 502;
    throw err;
  }
  return text.trim();
}

async function generateContent(systemInstruction, userPrompt) {
  // A custom Hugging Face model is preferred for the hackathon. Gemini remains
  // a fallback so existing deployments work until the HF model is configured.
  const huggingFaceText = await generateWithHuggingFace(systemInstruction, userPrompt);
  if (huggingFaceText) return huggingFaceText;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const res = await fetch(`${API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    const err = new Error(`Gemini API error (${res.status}): ${errBody.slice(0, 300)}`);
    err.statusCode = 502;
    throw err;
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  if (!text) {
    const err = new Error("Gemini returned no content");
    err.statusCode = 502;
    throw err;
  }
  return text.trim();
}

module.exports = { generateContent };
