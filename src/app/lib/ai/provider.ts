import type { OptimizeData } from "../optimizeSchemas";

export type OptimizeInput = {
  resumeText: string;
  jobDescription: string;
  schemaHint: string;
  systemPrompt: string;
};

export interface AIProvider {
  optimizeResume(input: OptimizeInput): Promise<OptimizeData>;
}
