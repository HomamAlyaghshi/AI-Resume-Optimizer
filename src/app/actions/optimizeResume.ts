"use server";

import { AI_RESULT_JSON_SCHEMA, InputSchema, type OptimizeState } from "../lib/optimizeSchemas";
import { getAIProvider } from "../lib/ai";

export async function optimizeResumeAction(
  prevState: OptimizeState | null,
  formData: FormData
): Promise<OptimizeState> {
  const raw = {
    resumeText: String(formData.get("resumeText") ?? ""),
    jobDescription: String(formData.get("jobDescription") ?? ""),
  };

  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      error: {
        resumeText: fe.resumeText,
        jobDescription: fe.jobDescription,
      },
    };
  }

  try {
    const system = `
You are an ATS-focused resume coach.

TASK:
Compare the RESUME to the JOB DESCRIPTION and return ONLY a JSON object that matches the provided schema.

SCORING RUBRIC (0-100):
- 40 pts: Keyword & skill match (tools, frameworks, domain terms)
- 20 pts: Evidence & impact (metrics, outcomes, ownership)
- 15 pts: Role alignment (seniority, responsibilities, scope)
- 15 pts: Clarity & ATS readability (concise, skimmable, no fluff)
- 10 pts: Differentiators (leadership, collaboration, projects, certifications)

RULES:
- Be specific. Avoid generic advice unless directly supported.
- First, silently extract a list of key skills/keywords from the JOB DESCRIPTION.
- Then choose missingKeywords ONLY from that extracted list.
- missingKeywords: include 5-10 items MAX. Each must appear in the JOB DESCRIPTION and be absent/weak in the RESUME.
- rewrittenBullets: return 3-5 improved bullets, ATS-friendly, quantified when possible.
- Headline: 1 line, role + core strengths (no emojis).
- Summary: 3-5 sentences max. Mention the most relevant stack and achievements.

OUTPUT:
Return ONLY valid JSON. No markdown. No extra text.
`.trim();

    const provider = getAIProvider();
    const schemaHint = JSON.stringify(AI_RESULT_JSON_SCHEMA, null, 2);

    const data = await provider.optimizeResume({
      resumeText: parsed.data.resumeText,
      jobDescription: parsed.data.jobDescription,
      schemaHint,
      systemPrompt: system,
    });

    return { ok: true, data };
  } catch (err: any) {
    const msg = typeof err?.message === "string" ? err.message : "Unknown error";
    return { ok: false, error: { general: [msg] } };
  }
}
