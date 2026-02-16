import { ollamaGenerateJson } from "../ollama";
import { OutputSchema, type OptimizeData } from "../optimizeSchemas";
import type { AIProvider, OptimizeInput } from "./provider";

export class OllamaProvider implements AIProvider {
  constructor(private model: string) {}

  async optimizeResume(input: OptimizeInput): Promise<OptimizeData> {
    const prompt = ["RESUME:", input.resumeText, "", "JOB DESCRIPTION:", input.jobDescription].join("\n");

    const raw = await ollamaGenerateJson<unknown>({
      model: this.model,
      system: input.systemPrompt,
      prompt,
      schemaHint: input.schemaHint,
    });

    const checked = OutputSchema.safeParse(raw);
    if (!checked.success) {
      throw new Error("AI returned an invalid JSON shape. Try again (or change model).");
    }
    return checked.data;
  }
}
