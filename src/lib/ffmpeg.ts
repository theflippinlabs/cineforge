/**
 * ffmpeg.wasm — Video Assembly
 *
 * Concatenates fal.ai-generated scene clips and mixes in the original audio
 * track, producing the final music video MP4 entirely in the browser.
 *
 * Uses the single-threaded build (@ffmpeg/core) to avoid SharedArrayBuffer /
 * COOP/COEP header requirements. WASM loaded from unpkg CDN on first call.
 *
 * Usage:
 *   const blob = await assembleMusicVideo({ clipUrls, audioUrl, aspectRatio });
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Singleton — loading 25 MB WASM only once per session
let _ffmpeg: FFmpeg | null = null;
let _loading = false;
let _loadPromise: Promise<FFmpeg> | null = null;

/** Load (or return cached) ffmpeg.wasm instance. */
async function getFFmpeg(): Promise<FFmpeg> {
  if (_ffmpeg) return _ffmpeg;
  if (_loadPromise) return _loadPromise;

  _loading = true;
  _loadPromise = (async () => {
    const ff = new FFmpeg();

    // Single-threaded core — no SharedArrayBuffer needed
    const BASE = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ff.load({
      coreURL: await toBlobURL(`${BASE}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${BASE}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    _ffmpeg = ff;
    _loading = false;
    return ff;
  })();

  return _loadPromise;
}

export interface AssembleOptions {
  /** Public URLs of scene clips produced by fal.ai (order matters). */
  clipUrls: string[];
  /** Public URL of the original audio track — mixed over all clips. */
  audioUrl: string | null;
  /** Used to derive output file name only. */
  jobId: string;
  /** Progress callback — called with 0–100 as FFmpeg processes frames. */
  onProgress?: (percent: number) => void;
}

export interface AssembleResult {
  blob: Blob;
  filename: string;
}

/**
 * Download all clips + audio, concatenate with FFmpeg, return the MP4 Blob.
 * Upload the result to Supabase Storage from the calling code.
 */
export async function assembleMusicVideo({
  clipUrls,
  audioUrl,
  jobId,
  onProgress,
}: AssembleOptions): Promise<AssembleResult> {
  if (clipUrls.length === 0) {
    throw new Error('No clips to assemble');
  }

  const ff = await getFFmpeg();
  const filename = `${jobId}_final.mp4`;

  // Wire progress callback
  if (onProgress) {
    ff.on('progress', ({ progress }) => {
      onProgress(Math.round(Math.min(progress * 100, 99)));
    });
  }

  try {
    // Write each clip into the virtual FS
    for (let i = 0; i < clipUrls.length; i++) {
      const name = `clip_${i}.mp4`;
      ff.writeFile(name, await fetchFile(clipUrls[i]));
    }

    // Build concat list
    const concatLines = clipUrls.map((_, i) => `file 'clip_${i}.mp4'`).join('\n');
    ff.writeFile('concat.txt', concatLines);

    let outputFile: string;

    if (audioUrl) {
      // Fetch audio
      ff.writeFile('audio_src', await fetchFile(audioUrl));

      // Concat video streams, mix original audio, trim to shortest track
      await ff.exec([
        '-f', 'concat', '-safe', '0', '-i', 'concat.txt',
        '-i', 'audio_src',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
        '-c:a', 'aac', '-b:a', '192k',
        '-map', '0:v:0', '-map', '1:a:0',
        '-shortest',
        '-movflags', '+faststart',
        filename,
      ]);
      outputFile = filename;
    } else {
      // No audio — just re-encode concatenated clips
      await ff.exec([
        '-f', 'concat', '-safe', '0', '-i', 'concat.txt',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
        '-movflags', '+faststart',
        filename,
      ]);
      outputFile = filename;
    }

    const data = await ff.readFile(outputFile);
    onProgress?.(100);

    return {
      blob: new Blob([data], { type: 'video/mp4' }),
      filename,
    };
  } finally {
    // Clean up virtual FS to free WASM memory for next call
    for (let i = 0; i < clipUrls.length; i++) {
      try { ff.deleteFile(`clip_${i}.mp4`); } catch { /* ignore */ }
    }
    try { ff.deleteFile('concat.txt'); } catch { /* ignore */ }
    try { ff.deleteFile('audio_src'); } catch { /* ignore */ }
    try { ff.deleteFile(filename); } catch { /* ignore */ }
  }
}
