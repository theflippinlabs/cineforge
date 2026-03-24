/**
 * ComfyUIImageProvider — local image generation via ComfyUI.
 *
 * Setup: https://github.com/comfyanonymous/ComfyUI
 *   python main.py --listen
 *
 * Default endpoint: http://localhost:8188
 *
 * This uses the /prompt API with a minimal txt2img workflow.
 * You can customize the workflow JSON in options.workflow.
 */
import fs from "fs";
import path from "path";
import type { JobInput, JobOutput, ProviderHealthResult } from "@/types";
import { BaseProvider, type GenerateOptions } from "../base";
import { readConfig } from "@/lib/config";
import { ensureOutputDir, generateFilename } from "@/lib/storage/local";

// Minimal ComfyUI txt2img workflow using SDXL / SD1.5 nodes
function buildTxt2ImgWorkflow(
  prompt: string,
  negativePrompt: string,
  steps: number,
  cfgScale: number,
  width: number,
  height: number,
  seed: number
): Record<string, unknown> {
  return {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: "v1-5-pruned-emaonly.ckpt" },
    },
    "2": {
      class_type: "CLIPTextEncode",
      inputs: { text: prompt, clip: ["1", 1] },
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: { text: negativePrompt || "ugly, deformed, watermark", clip: ["1", 1] },
    },
    "4": {
      class_type: "EmptyLatentImage",
      inputs: { width, height, batch_size: 1 },
    },
    "5": {
      class_type: "KSampler",
      inputs: {
        seed,
        steps,
        cfg: cfgScale,
        sampler_name: "euler",
        scheduler: "normal",
        denoise: 1,
        model: ["1", 0],
        positive: ["2", 0],
        negative: ["3", 0],
        latent_image: ["4", 0],
      },
    },
    "6": {
      class_type: "VAEDecode",
      inputs: { samples: ["5", 0], vae: ["1", 2] },
    },
    "7": {
      class_type: "SaveImage",
      inputs: { images: ["6", 0], filename_prefix: "jarvis3" },
    },
  };
}

interface ComfyUIQueueResponse {
  prompt_id: string;
  number: number;
}

interface ComfyUIHistoryItem {
  status: { completed: boolean; status_str: string };
  outputs: Record<string, { images?: Array<{ filename: string; subfolder: string; type: string }> }>;
}

export class ComfyUIImageProvider extends BaseProvider {
  readonly id = "comfyui-image";
  readonly name = "ComfyUI (Local)";
  readonly capability = "image" as const;
  readonly isFree = true;
  readonly isLocal = true;

  private get endpoint(): string {
    return readConfig().comfyUIEndpoint;
  }

  async isAvailable(): Promise<ProviderHealthResult> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.endpoint}/system_stats`, {
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
            : "Could not reach ComfyUI endpoint",
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
    const seed = (options.seed as number) ?? Math.floor(Math.random() * 2 ** 32);
    const steps = (options.steps as number) ?? 20;
    const cfgScale = (options.cfgScale as number) ?? 7;
    const width = (options.width as number) ?? 512;
    const height = (options.height as number) ?? 512;
    const negativePrompt = (options.negativePrompt as string) ?? "";

    opts.onProgress?.(10);

    const workflow = (options.workflow as Record<string, unknown>) ??
      buildTxt2ImgWorkflow(input.prompt, negativePrompt, steps, cfgScale, width, height, seed);

    // Queue the prompt
    const queueRes = await fetch(`${this.endpoint}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: workflow, client_id: opts.jobId }),
      signal: AbortSignal.timeout(30000),
    });

    if (!queueRes.ok) {
      const body = await queueRes.text();
      throw new Error(`ComfyUI queue error ${queueRes.status}: ${body}`);
    }

    const queued = (await queueRes.json()) as ComfyUIQueueResponse;
    const promptId = queued.prompt_id;

    opts.onProgress?.(20);

    // Poll history until done (max 5 minutes)
    const outputImages = await this.pollForCompletion(promptId, opts.onProgress);

    opts.onProgress?.(80);

    // Download and save each image locally
    const outputs: JobOutput[] = [];
    const outputDir = ensureOutputDir("images");

    for (const imgInfo of outputImages) {
      const imgUrl = `${this.endpoint}/view?filename=${encodeURIComponent(imgInfo.filename)}&subfolder=${encodeURIComponent(imgInfo.subfolder)}&type=${imgInfo.type}`;
      const imgRes = await fetch(imgUrl, { signal: AbortSignal.timeout(30000) });
      if (!imgRes.ok) throw new Error(`Failed to download image from ComfyUI`);

      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const filename = generateFilename("image", "png");
      const absolutePath = path.join(outputDir.absolute, filename);
      fs.writeFileSync(absolutePath, buffer);

      outputs.push({
        type: "image",
        filePath: `/outputs/images/${filename}`,
        absolutePath,
        mimeType: "image/png",
        metadata: { prompt: input.prompt, seed, steps, cfgScale, width, height, provider: this.id },
      });
    }

    opts.onProgress?.(100);
    return outputs;
  }

  private async pollForCompletion(
    promptId: string,
    onProgress?: (p: number) => void
  ): Promise<Array<{ filename: string; subfolder: string; type: string }>> {
    const maxAttempts = 300; // 5 minutes at 1s intervals
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 1000));

      const res = await fetch(`${this.endpoint}/history/${promptId}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;

      const history = (await res.json()) as Record<string, ComfyUIHistoryItem>;
      const item = history[promptId];
      if (!item) continue;

      if (item.status.completed) {
        const images: Array<{ filename: string; subfolder: string; type: string }> = [];
        for (const nodeOutput of Object.values(item.outputs)) {
          if (nodeOutput.images) {
            images.push(...nodeOutput.images);
          }
        }
        return images;
      }

      if (item.status.status_str === "error") {
        throw new Error("ComfyUI generation failed");
      }

      // Rough progress estimate (20–75%)
      const progress = 20 + Math.min(55, (i / maxAttempts) * 55);
      onProgress?.(Math.round(progress));
    }

    throw new Error("ComfyUI generation timed out after 5 minutes");
  }

  normalizeOutput(raw: unknown): JobOutput[] {
    if (Array.isArray(raw)) return raw as JobOutput[];
    return [];
  }
}
