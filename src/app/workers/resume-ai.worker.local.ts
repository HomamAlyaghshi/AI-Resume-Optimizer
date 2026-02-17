/// <reference lib="webworker" />

import { pipeline, env } from "@huggingface/transformers";

env.allowRemoteModels = true;
env.allowLocalModels = false;

type OptimizeData = {
  score: number;
  missingKeywords: { keyword: string; whyItMatters: string }[];
  headline: string;
  summary: string;
  rewrittenBullets: { original: string; improved: string }[];
};

function extractJsonObject(text: string): string {
  const raw = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object found in model output.");
  }
  return raw.slice(first, last + 1);
}

function safeParse(jsonText: string): OptimizeData {
  // minimal "repair" for common issues
  const cleaned = jsonText
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .trim();

  return JSON.parse(cleaned) as OptimizeData;
}

let generator: any | null = null;

async function getGenerator() {
  if (generator) return generator;

  const model = "HuggingFaceTB/SmolLM2-135M-Instruct";
  type PipeOpts = {
    dtype?: string;
    device?: string;
  };

  generator = await pipeline("text-generation", model, {
    dtype: "q4f16",
    device: "webgpu",
  } satisfies PipeOpts as any);

  return generator;
}

self.onmessage = async (event: MessageEvent) => {
  const { resumeText, jobDescription, schemaHint, systemPrompt } = event.data as {
    resumeText: string;
    jobDescription: string;
    schemaHint: string;
    systemPrompt: string;
  };

  try {
    const gen = await getGenerator();
    
    const prompt = [
      systemPrompt,
      "",
      "OUTPUT JSON SCHEMA (MUST MATCH):",
      schemaHint,
      "",
      "RESUME:",
      resumeText,
      "",
      "JOB DESCRIPTION:",
      jobDescription,
      "",
      "Return ONLY valid JSON. No markdown. No extra text.",
    ].join("\n");

    const out = await gen(prompt, {
      max_new_tokens: 500,
      temperature: 0.2,
      top_p: 0.9,
      do_sample: true,
    });

    // transformers.js returns generated_text in different shapes depending on version
    const text = 
      Array.isArray(out) ? (out[0]?.generated_text ?? "") : (out?.generated_text ?? "");
    
    const jsonText = extractJsonObject(text);
    const data = safeParse(jsonText);
    
    // quick sanity clamps
    data.score = Math.max(0, Math.min(100, Math.round(data.score)));
    
    self.postMessage({ ok: true, data });
  } catch (err: any) {
    const msg = typeof err?.message === "string" ? err.message : "Unknown error";
    self.postMessage({ ok: false, error: msg });
  }
};
