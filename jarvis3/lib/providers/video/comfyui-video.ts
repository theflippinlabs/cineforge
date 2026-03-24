/**
 * ComfyUIVideoProvider — local video generation via ComfyUI.
 *
 * Uses AnimateDiff or Stable Video Diffusion workflow.
 * Requires ComfyUI with:
 *   - ComfyUI-AnimateDiff-Evolved extension
 *   - or ComfyUI-VideoHelperSuite for SVD
 *
 * Setup: https://github.com/comfyanonymous/ComfyUI
 *        https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved
 *
 * Default endpoint: http://localhost:8188
 */
import fs from "fs";
import path from "path";
import type { JobInput, JobOutput, ProviderHealthResult } from "@/types";
import { BaseProvider, type GenerateOptions } from "../base";
import { readConfig } from "@/lib/config";
import { ensureOutputDir, generateFilename } from "@/lib/storage/local";

// Minimal AnimateDiff workflow for txt2video
function buildAnimateDiffWorkflow(
  prompt: string,
  negativePrompt: string,
  steps: number,
  cfgScale: number,
  width: number,
  height: number,
  seed: number,
  numFrames: number
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
      inputs: { text: negativePrompt || "ugly, deformed, watermark, blurry", clip: ["1", 1] },
    },
    "4": {
      class_type: "ADE_AnimateDiffLoaderWithContext",
      inputs: { model_name: "mm_sd_v15_v2.ckpt", model: ["1", 0], beta_schedule: "sqrt_linear (AnimateDiff)" },
    },
    "5": {
      class_type: "EmptyLatentImage",
      inputs: { width, height, batch_size: numFrames },
    },
    "6": {
      class_type: "KSampler",
      inputs: {
        seed,
        steps,
        cfg: cfgScale,
        sampler_name: "euler",
        scheduler: "normal",
        denoise: 1,
        model: ["4", 0],
        positive: ["2", 0],
        negative: ["3", 0],
        latent_image: ["5", 0],
      },
    },
    "7": {
      class_type: "VAEDecode",
      inputs: { samples: ["6", 0], vae: ["1", 2] },
    },
    "8": {
      class_type: "VHS_VideoCombine",
      inputs: {
        images: ["7", 0],
        frame_rate: 8,
        loop_count: 0,
        filename_prefix: "jarvis3_video",
        format: "video/h264-mp4",
        pingpong: false,
        save_output: true,
      },
    },
  };
}

interface ComfyUIQueueResponse {
  prompt_id: string;
  number: number;
}

interface ComfyUIHistoryItem {
  status: { completed: boolean; status_str: string };
  outputs: Record<
    string,
    {
      videos?: Array<{ filename: string; subfolder: string; type: string }>;
      images?: Array<{ filename: string; subfolder: string; type: string }>;
      gifs?: Array<{ filename: string; subfolder: string; type: string }>;
    }
  >;
}

export class ComfyUIVideoProvider extends BaseProvider {
  readonly id = "comfyui-video";
  readonly name = "ComfyUI AnimateDiff (Local)";
  readonly capability = "video" as const;
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
    const numFrames = (options.numFrames as number) ?? 16;
    const negativePrompt = (options.negativePrompt as string) ?? "";

    opts.onProgress?.(10);

    const workflow =
      (options.workflow as Record<string, unknown>) ??
      buildAnimateDiffWorkflow(
        input.prompt,
        negativePrompt,
        steps,
        cfgScale,
        width,
        height,
        seed,
        numFrames
      );

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

    // Poll until done
    const outputFiles = await this.pollForCompletion(promptId, opts.onProgress);

    opts.onProgress?.(80);

    const outputs: JobOutput[] = [];
    const outputDir = ensureOutputDir("videos");

    for (const fileInfo of outputFiles) {
      const isVideo = fileInfo.filename.endsWith(".mp4") || fileInfo.filename.endsWith(".webm");
      const ext = isVideo ? "mp4" : "gif";
      const mimeType = isVideo ? "video/mp4" : "image/gif";

      const fileUrl = `${this.endpoint}/view?filename=${encodeURIComponent(fileInfo.filename)}&subfolder=${encodeURIComponent(fileInfo.subfolder)}&type=${fileInfo.type}`;
      const fileRes = await fetch(fileUrl, { signal: AbortSignal.timeout(60000) });
      if (!fileRes.ok) throw new Error("Failed to download video from ComfyUI");

      const buffer = Buffer.from(await fileRes.arrayBuffer());
      const filename = generateFilename("video", ext);
      const absolutePath = path.join(outputDir.absolute, filename);
      fs.writeFileSync(absolutePath, buffer);

      outputs.push({
        type: "video",
        filePath: `/outputs/videos/${filename}`,
        absolutePath,
        mimeType,
        metadata: {
          prompt: input.prompt,
          seed,
          steps,
          numFrames,
          width,
          height,
          provider: this.id,
        },
      });
    }

    opts.onProgress?.(100);
    return outputs;
  }

  private async pollForCompletion(
    promptId: string,
    onProgress?: (p: number) => void
  ): Promise<Array<{ filename: string; subfolder: string; type: string }>> {
    const maxAttempts = 600; // 10 minutes
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
        const files: Array<{ filename: string; subfolder: string; type: string }> = [];
        for (const nodeOutput of Object.values(item.outputs)) {
          if (nodeOutput.videos) files.push(...nodeOutput.videos);
          if (nodeOutput.gifs) files.push(...nodeOutput.gifs);
          // Fallback to images if no video output
          if (!nodeOutput.videos && !nodeOutput.gifs && nodeOutput.images) {
            files.push(...nodeOutput.images);
          }
        }
        return files;
      }

      if (item.status.status_str === "error") {
        throw new Error("ComfyUI video generation failed");
      }

      const progress = 20 + Math.min(55, (i / maxAttempts) * 55);
      onProgress?.(Math.round(progress));
    }

    throw new Error("ComfyUI video generation timed out after 10 minutes");
  }

  normalizeOutput(raw: unknown): JobOutput[] {
    if (Array.isArray(raw)) return raw as JobOutput[];
    return [];
  }
}
