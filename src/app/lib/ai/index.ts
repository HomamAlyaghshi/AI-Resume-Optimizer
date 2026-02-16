import type { AIProvider } from "./provider";
import { OllamaProvider } from "./ollamaProvider";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? "ollama";

  if (provider === "ollama") {
    const model = process.env.OLLAMA_MODEL ?? "phi3:mini";
    return new OllamaProvider(model);
  }

  throw new Error(`Unknown AI_PROVIDER: ${provider}`);
}
