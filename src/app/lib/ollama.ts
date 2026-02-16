type OllamaGenerateResponse = {
  response: string;
};

function extractJsonObject(text: string): string {
  const raw = text.trim();

  // remove markdown code fences if present
  const noFences = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const firstBrace = noFences.indexOf("{");
  const lastBrace = noFences.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Model did not return a JSON object.");
  }

  return noFences.slice(firstBrace, lastBrace + 1);
}

function stripJsonComments(s: string): string {
  // remove // comments and /* */ comments
  return s
    .replace(/\/\/[^\n\r]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

function quoteKnownKeys(s: string): string {
  // Quote only the keys we expect (safe-ish targeted repair)
  const keys = [
    "score",
    "missingKeywords",
    "headline",
    "summary",
    "rewrittenBullets",
    "keyword",
    "whyItMatters",
    "original",
    "improved",
  ];

  // Replace: score: -> "score":
  // Handles whitespace/newlines between key and colon
  const pattern = new RegExp(`\\b(${keys.join("|")})\\b\\s*:`, "g");
  return s.replace(pattern, `"$1":`);
}

function minimalJsonRepair(s: string): string {
  let t = s.trim();

  // 1) strip comments
  t = stripJsonComments(t);

  // 2) remove trailing commas before } or ]
  t = t.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");

  // 3) quote known keys if unquoted
  t = quoteKnownKeys(t);

  // 4) replace smart quotes with normal quotes
  t = t
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  // 5) (last resort) if model used single quotes for strings, convert to double quotes naively
  // Only convert when it looks like: 'text' (not perfect, but helps common Ollama output)
  t = t.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, `"$1"`);

  // 6) remove any leading/trailing junk again
  t = t.trim();

  return t;
}

function tryParseJson<T>(jsonText: string): T {
  // First attempt
  try {
    return JSON.parse(jsonText) as T;
  } catch {
    // Repair attempt
    const repaired = minimalJsonRepair(jsonText);
    return JSON.parse(repaired) as T;
  }
}

export async function ollamaGenerateJson<T>(opts: {
  model: string;
  system: string;
  prompt: string;
  schemaHint?: string;
}): Promise<T> {
  const fullPrompt = [
    `SYSTEM:\n${opts.system}`,
    opts.schemaHint ? `\nOUTPUT JSON SCHEMA (MUST MATCH):\n${opts.schemaHint}` : "",
    `\nUSER:\n${opts.prompt}`,
    `\nReturn ONLY valid JSON. No markdown. No extra text.`,
  ].join("\n");

  const res = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model,
      prompt: fullPrompt,
      stream: false,
      options: { temperature: 0.2 },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama HTTP ${res.status}: ${text || res.statusText}`);
  }

  const data = (await res.json()) as OllamaGenerateResponse;
  const jsonText = extractJsonObject(data.response);

  try {
    return tryParseJson<T>(jsonText);
  } catch (e) {
    // Helpful debug: show a small snippet in server logs (doesn't expose full resume)
    const snippet = jsonText.slice(0, 500);
    console.error("Invalid JSON from model. Snippet:", snippet);
    throw new Error("Invalid JSON returned by model.");
  }
}
