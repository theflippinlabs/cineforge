import type { JobInput, JobOutput, ProviderHealthResult } from "@/types";
import { BaseProvider, type GenerateOptions } from "../base";
import { readConfig } from "@/lib/config";

interface OllamaChatMessage { role: "user" | "assistant" | "system"; content: string; }
interface OllamaGenerateResponse { model: string; response?: string; message?: { content: string }; done: boolean; }

export class OllamaProvider extends BaseProvider {
  readonly id = "ollama";
  readonly name = "Ollama (Local)";
  readonly capability = "text" as const;
  readonly isFree = true;
  readonly isLocal = true;

  private get endpoint() { return readConfig().ollamaEndpoint; }
  private get model() { return readConfig().ollamaModel; }

  async isAvailable(): Promise<ProviderHealthResult> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.endpoint}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { status: "available", latencyMs: Date.now() - start, checkedAt: new Date().toISOString() };
    } catch (err) {
      return { status: "unavailable", errorMessage: err instanceof Error ? err.message : "Could not reach Ollama endpoint", checkedAt: new Date().toISOString() };
    }
  }

  validateInput(input: JobInput): string | null {
    if (!input.prompt?.trim()) return "Prompt cannot be empty";
    if (input.prompt.length > 32000) return "Prompt exceeds maximum length (32000 chars)";
    return null;
  }

  async generate(input: JobInput, opts: GenerateOptions): Promise<JobOutput[]> {
    const err = this.validateInput(input);
    if (err) throw new Error(err);
    opts.onProgress?.(10);
    const res = await fetch(`${this.endpoint}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "system", content: "You are Jarvis 3, an advanced AI assistant. Respond clearly and helpfully." }, { role: "user", content: input.prompt }],
        stream: false,
        options: { temperature: (input.options?.temperature as number) ?? 0.7, num_predict: (input.options?.maxTokens as number) ?? 2048 },
      }),
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
    const data = await res.json() as OllamaGenerateResponse;
    opts.onProgress?.(100);
    return this.normalizeOutput(data.message?.content ?? data.response ?? "");
  }

  normalizeOutput(raw: unknown): JobOutput[] {
    return [{ type: "text", content: typeof raw === "string" ? raw : JSON.stringify(raw) }];
  }
}
