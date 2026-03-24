/**
 * Automatic1111Provider — local image generation via AUTOMATIC1111 WebUI.
 *
 * Setup: https://github.com/AUTOMATIC1111/stable-diffusion-webui
 *   ./webui.sh --api
 *
 * Default endpoint: http://localhost:7860
 *
 * Used as fallback when ComfyUI is not available.
 */
import fs from "fs";
import path from "path";
import type { JobInput, JobOutput, ProviderHealthResult } from "@/types";
import { BaseProvider, type GenerateOptions } from "../base";
import { readConfig } from "@/lib/config";
import { ensureOutputDir, generateFilename } from "@/lib/storage/local";

interface A1111Txt2ImgRequest {
  prompt: string;
  negative_prompt: string;
  steps: number;
  cfg_scale: number;
  width: number;
  height: number;
  seed: number;
  sampler_name: string;
  batch_size: number;
}

interface A1111Txt2ImgResponse {
  images: string[]; // base64 encoded PNG
  info: string;
}

export class Automatic1111Provider extends BaseProvider {
  readonly id = "automatic1111";
  readonly name = "Automatic1111 (Local)";
  readonly capability = "image" as const;
  readonly isFree = true;
  readonly isLocal = true;

  private get endpoint(): string {
    return readConfig().automatic1111Endpoint;
  }

  async isAvailable(): Promise<ProviderHealthResult> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.endpoint}/sdapi/v1/sd-models`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return {
        status: "available",
        latencyMs: Date.now() - start,
        checkedAt: new Date().toISOString(),
      };
    } catch (err) {
      return {
        status: "unavailable",
        errorMessage:
          err instanceof Error
            ? err.message
            : "Could not reach Automatic1111 endpoint",
        checkedAt: new Date().toISOString(),
      };
    }
  }

  validateInput(input: JobInput): string | null {
    if (!input.prompt || input.prompt.trim().length === 0) {
      return "Prompt cannot be empty";
    }
    return null;
  }

  async generate(input: JobInput, opts: GenerateOptions): Promise<JobOutput[]> {
    const validationError = this.validateInput(input);
    if (validationError) throw new Error(validationError);

    const options = input.options ?? {};
    const seed = (options.seed as number) ?? -1;
    const steps = (options.steps as number) ?? 20;
    const cfgScale = (options.cfgScale as number) ?? 7;
    const width = (options.width as number) ?? 512;
    const height = (options.height as number) ?? 512;
    const negativePrompt = (options.negativePrompt as string) ?? "ugly, deformed, watermark";

    opts.onProgress?.(10);

    const payload: A1111Txt2ImgRequest = {
      prompt: input.prompt,
      negative_prompt: negativePrompt,
      steps,
      cfg_scale: cfgScale,
      width,
      height,
      seed,
      sampler_name: "Euler",
      batch_size: 1,
    };

    const res = await fetch(`${this.endpoint}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(300000), // 5 min timeout
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Automatic1111 error ${res.status}: ${body}`);
    }

    opts.onProgress?.(80);

    const data = (await res.json()) as A1111Txt2ImgResponse;
    const outputs: JobOutput[] = [];
    const outputDir = ensureOutputDir("images");

    for (const b64 of data.images) {
      const buffer = Buffer.from(b64, "base64");
      const filename = generateFilename("image", "png");
      const absolutePath = path.join(outputDir.absolute, filename);
      fs.writeFileSync(absolutePath, buffer);

      outputs.push({
        type: "image",
        filePath: `/outputs/images/${filename}`,
        absolutePath,
        mimeType: "image/png",
        metadata: {
          prompt: input.prompt,
          seed,
          steps,
          cfgScale,
          width,
          height,
          provider: this.id,
        },
      });
    }

    opts.onProgress?.(100);
    return outputs;
  }

  normalizeOutput(raw: unknown): JobOutput[] {
    if (Array.isArray(raw)) return raw as JobOutput[];
    return [];
  }
}
