/**
 * fal.ai Client
 *
 * Configured to route all requests through the Supabase Edge Function proxy,
 * so FAL_KEY never touches the browser.
 *
 * Usage:
 *   import { fal } from '@/lib/fal';
 *   const result = await fal.run('fal-ai/kling-video/v2.5/turbo/text-to-video', { input: {...} });
 *
 * Supported models:
 *   - fal-ai/kling-video/v2.5/turbo/text-to-video   (text → video, $0.07/sec)
 *   - fal-ai/kling-video/v2.5/turbo/image-to-video   (image + text → video)
 */

import { createFalClient } from '@fal-ai/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

if (!SUPABASE_URL) {
  console.warn('[fal] VITE_SUPABASE_URL is not set — video generation will not work');
}

// Proxy URL points to our Supabase Edge Function
// The Edge Function injects FAL_KEY server-side before forwarding to fal.ai
const proxyUrl = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/fal-proxy`
  : undefined;

export const fal = createFalClient({
  proxyUrl,
});

// ─── Model IDs ────────────────────────────────────────────────────────────────

export const FAL_MODELS = {
  /** Text → Video. Best default for music clips. ~$0.07/sec */
  kling_text_to_video: 'fal-ai/kling-video/v2.5/turbo/text-to-video',
  /** Image → Video. Use when character reference images are provided. */
  kling_image_to_video: 'fal-ai/kling-video/v2.5/turbo/image-to-video',
} as const;

export type FalModelId = (typeof FAL_MODELS)[keyof typeof FAL_MODELS];

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface KlingTextToVideoInput {
  prompt: string;
  negative_prompt?: string;
  /** Duration in seconds. Supported: 5 or 10 */
  duration?: 5 | 10;
  /** Aspect ratio of the output video */
  aspect_ratio?: '16:9' | '9:16' | '1:1';
}

export interface KlingImageToVideoInput {
  /** Public URL of the reference image (character, scene, etc.) */
  image_url: string;
  prompt: string;
  negative_prompt?: string;
  duration?: 5 | 10;
  aspect_ratio?: '16:9' | '9:16' | '1:1';
}

export interface KlingVideoOutput {
  video: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
}
