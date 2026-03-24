/**
 * Automatic1111Provider — local image generation via AUTOMATIC1111 WebUI.
 * Setup: https://github.com/AUTOMATIC1111/stable-diffusion-webui  ./webui.sh --api
 * Default endpoint: http://localhost:7860
 * Used as fallback when ComfyUI is not available.
 */
import fs from "fs";
import path from "path";
import type { JobInput, JobOutput, ProviderHealthResult } from "@/types";
import { BaseProvider, type GenerateOptions } from "../base";
import { readConfig } from "@/lib/config";
import { ensureOutputDir, generateFilename } from "@/lib/storage/local";

interface A1111Txt2ImgRequest { prompt: string; negative_prompt: string; steps: number; cfg_scale: number; width: number; height: number; seed: number; sampler_name: string; batch_size: number; }
interface A1111Txt2ImgResponse { images: string[]; info: string; }

export class Automatic1111Provider extends BaseProvider {
  readonly id = "automatic1111";
  readonly name = "Automatic1111 (Local)";
  readonly capability = "image" as const;
  readonly isFree = true;
  readonly isLocal = true;

  private get endpoint() { return readConfig().automatic1111Endpoint; }

  async isAvailable(): Promise<ProviderHealthResult> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.endpoint}/sdapi/v1/sd-models`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { status: "available", latencyMs: Date.now() - start, checkedAt: new Date().toISOString() };
    } catch (err) {
      return { status: "unavailable", errorMessage: err instanceof Error ? err.message : "Could not reach Automatic1111 endpoint", checkedAt: new Date().toISOString() };
    }
  }

  validateInput(input: JobInput): string | null {
    if (!input.prompt?.trim()) return "Prompt cannot be empty";
    return null;
  }

  async generate(input: JobInput, opts: GenerateOptions): Promise<JobOutput[]> {
    const err = this.validateInput(input);
    if (err) throw new Error(err);
    const options = input.options ?? {};
    opts.onProgress?.(10);
    const payload: A1111Txt2ImgRequest = {
      prompt: input.prompt,
      negative_prompt: (options.negativePrompt as string) ?? "ugly, deformed, watermark",
      steps: (options.steps as number) ?? 20,
      cfg_scale: (options.cfgScale as number) ?? 7,
      width: (options.width as number) ?? 512,
      height: (options.height as number) ?? 512,
      seed: (options.seed as number) ?? -1,
      sampler_name: "Euler",
      batch_size: 1,
    };
    const res = await fetch(`${this.endpoint}/sdapi/v1/txt2img`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(300000) });
    if (!res.ok) throw new Error(`Automatic1111 error ${res.status}: ${await res.text()}`);
    opts.onProgress?.(80);
    const data = await res.json() as A1111Txt2ImgResponse;
    const outputs: JobOutput[] = [];
    const outputDir = ensureOutputDir("images");
    for (const b64 of data.images) {
      const buffer = Buffer.from(b64, "base64");
      const filename = generateFilename("image", "png");
      const absolutePath = path.join(outputDir.absolute, filename);
      fs.writeFileSync(absolutePath, buffer);
      outputs.push({ type: "image", filePath: `/outputs/images/${filename}`, absolutePath, mimeType: "image/png", metadata: { prompt: input.prompt, steps: payload.steps, cfgScale: payload.cfg_scale, width: payload.width, height: payload.height, provider: this.id } });
    }
    opts.onProgress?.(100);
    return outputs;
  }

  normalizeOutput(raw: unknown): JobOutput[] { return Array.isArray(raw) ? raw as JobOutput[] : []; }
}
