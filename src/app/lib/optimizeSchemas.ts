import { z } from "zod";

export const InputSchema = z.object({
  resumeText: z.string().min(50, "Resume is too short (minimum 50 characters)"),
  jobDescription: z
    .string()
    .min(50, "Job description is too short (minimum 50 characters)"),
});

export const OutputSchema = z.object({
  score: z.number().int().min(0).max(100),
  missingKeywords: z
    .array(
      z.object({
        keyword: z.string().min(1),
        whyItMatters: z.string().min(1),
      }),
    )
    .default([]),
  headline: z.string().min(1),
  summary: z.string().min(1),
  rewrittenBullets: z
    .array(
      z.object({
        original: z.string().min(1),
        improved: z.string().min(1),
      }),
    )
    .default([]),
});

export type OptimizeData = z.infer<typeof OutputSchema>;

export type OptimizeState =
  | {
      ok: false;
      error: {
        resumeText?: string[];
        jobDescription?: string[];
        general?: string[];
      };
    }
  | { ok: true; data: OptimizeData };

export const AI_RESULT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "score",
    "missingKeywords",
    "headline",
    "summary",
    "rewrittenBullets",
  ],
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    missingKeywords: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["keyword", "whyItMatters"],
        properties: {
          keyword: { type: "string" },
          whyItMatters: { type: "string" },
        },
      },
    },
    headline: { type: "string" },
    summary: { type: "string" },
    rewrittenBullets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["original", "improved"],
        properties: {
          original: { type: "string" },
          improved: { type: "string" },
        },
      },
    },
  },
} as const;
