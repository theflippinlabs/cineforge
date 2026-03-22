/**
 * Pipeline Orchestration Service
 *
 * Manages the multi-step generation pipeline. Each function maps to a
 * generation_step record in the database. Designed for mock-safe use:
 * replace the body of each step with a real provider call without
 * changing the calling interface.
 */
import { supabase } from './supabase';
import type { GenerationJob, GenerationStepName, JobStatus } from '../types';

// ─── Step Utilities ───────────────────────────────────────────────────────────

async function updateStep(
  jobId: string,
  stepName: GenerationStepName,
  patch: {
    status: 'running' | 'completed' | 'failed' | 'skipped';
    progress?: number;
    error_message?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status: patch.status };

  if (patch.status === 'running') update.started_at = now;
  if (patch.status === 'completed' || patch.status === 'failed') update.completed_at = now;
  if (patch.progress !== undefined) update.progress = patch.progress;
  if (patch.error_message) update.error_message = patch.error_message;
  if (patch.metadata) update.metadata = patch.metadata;

  return supabase
    .from('generation_steps')
    .update(update)
    .eq('job_id', jobId)
    .eq('step_name', stepName);
}

async function updateJob(
  jobId: string,
  patch: {
    status?: JobStatus;
    progress?: number;
    current_step?: GenerationStepName | null;
    error_message?: string;
    completed_at?: string;
    failed_at?: string;
  }
) {
  return supabase.from('generation_jobs').update(patch).eq('id', jobId);
}

async function logStep(
  jobId: string,
  stepName: GenerationStepName,
  level: 'info' | 'warn' | 'error',
  message: string
) {
  const log = { timestamp: new Date().toISOString(), level, message };
  const { data } = await supabase
    .from('generation_steps')
    .select('logs_json')
    .eq('job_id', jobId)
    .eq('step_name', stepName)
    .single();

  const existing = (data?.logs_json ?? []) as typeof log[];
  await supabase
    .from('generation_steps')
    .update({ logs_json: [...existing, log] })
    .eq('job_id', jobId)
    .eq('step_name', stepName);
}

// ─── Pipeline Steps ───────────────────────────────────────────────────────────

/**
 * Step 1 — Ingest audio from URL or storage path.
 * Validates format, duration, and sample rate.
 */
export async function analyzeAudio(job: GenerationJob): Promise<{ bpm: number; duration: number; waveform: number[] }> {
  await updateJob(job.id, { status: 'analyzing_audio', progress: 10, current_step: 'audio_ingestion' });
  await updateStep(job.id, 'audio_ingestion', { status: 'running' });

  try {
    await logStep(job.id, 'audio_ingestion', 'info', `Ingesting audio: ${job.config_snapshot.concept_prompt.slice(0, 60)}`);

    // Mock: real implementation calls audio analysis provider (e.g. Essentia, AudD)
    const mockResult = {
      bpm: 120 + Math.round(Math.random() * 40),
      duration: job.config_snapshot.duration_seconds,
      waveform: Array.from({ length: 100 }, () => Math.random()),
    };

    await updateStep(job.id, 'audio_ingestion', { status: 'completed', progress: 100, metadata: mockResult });
    await updateJob(job.id, { progress: 15, current_step: 'bpm_analysis' });
    await updateStep(job.id, 'bpm_analysis', { status: 'running' });

    await logStep(job.id, 'bpm_analysis', 'info', `Detected BPM: ${mockResult.bpm}`);
    await updateStep(job.id, 'bpm_analysis', { status: 'completed', progress: 100, metadata: { bpm: mockResult.bpm } });

    return mockResult;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Audio analysis failed';
    await updateStep(job.id, 'audio_ingestion', { status: 'failed', error_message: msg });
    throw err;
  }
}

/**
 * Step 2 — Segment track into sections (intro, verse, chorus, bridge, outro).
 * Uses BPM + audio energy to determine cut points.
 */
export async function extractTrackSections(
  job: GenerationJob,
  bpm: number
): Promise<{ sections: TrackSection[] }> {
  await updateJob(job.id, { status: 'segmenting_track', progress: 30, current_step: 'scene_segmentation' });
  await updateStep(job.id, 'scene_segmentation', { status: 'running' });

  const beatInterval = 60 / bpm;
  const bars = 4;
  const sectionDuration = beatInterval * 4 * bars;
  const totalSections = Math.floor(job.config_snapshot.duration_seconds / sectionDuration);

  const sectionTypes: TrackSection['type'][] = ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'outro'];
  const sections: TrackSection[] = Array.from({ length: totalSections }, (_, i) => ({
    index: i,
    type: sectionTypes[i % sectionTypes.length],
    start_seconds: i * sectionDuration,
    end_seconds: (i + 1) * sectionDuration,
    energy: 0.4 + Math.random() * 0.5,
  }));

  await logStep(job.id, 'scene_segmentation', 'info', `Segmented into ${sections.length} sections at ${bpm} BPM`);
  await updateStep(job.id, 'scene_segmentation', { status: 'completed', progress: 100, metadata: { section_count: sections.length, bpm } });

  return { sections };
}

/**
 * Step 3 — Expand prompts for each scene section.
 * Applies cinematic mode constraints, shot language, and negative prompts.
 */
export async function expandPrompts(
  job: GenerationJob,
  sections: TrackSection[]
): Promise<{ prompts: ScenePrompt[] }> {
  await updateJob(job.id, { status: 'generating_scenes', progress: 45, current_step: 'prompt_expansion' });
  await updateStep(job.id, 'prompt_expansion', { status: 'running' });

  const config = job.config_snapshot;
  const basePrompt = buildBasePrompt(config);

  const prompts: ScenePrompt[] = sections.map((section, i) => ({
    scene_index: i,
    section_type: section.type,
    positive_prompt: `${basePrompt}, ${getSectionVariation(section)}, ${config.mood} mood`,
    negative_prompt: buildNegativePrompt(config),
    shot_instruction: getShotInstruction(config.shot_language),
    duration_seconds: section.end_seconds - section.start_seconds,
    energy: section.energy,
  }));

  await logStep(job.id, 'prompt_expansion', 'info', `Expanded ${prompts.length} scene prompts`);
  await updateStep(job.id, 'prompt_expansion', { status: 'completed', progress: 100, metadata: { prompt_count: prompts.length } });

  return { prompts };
}

/**
 * Step 4 — Dispatch visual generation for each scene.
 * In production: calls video synthesis API (e.g. Runway, Kling, Pika).
 */
export async function dispatchVisualGeneration(
  job: GenerationJob,
  prompts: ScenePrompt[]
): Promise<{ scene_ids: string[] }> {
  await updateJob(job.id, { status: 'generating_scenes', progress: 55, current_step: 'scene_generation' });
  await updateStep(job.id, 'scene_generation', { status: 'running' });

  await logStep(job.id, 'scene_generation', 'info', `Dispatching ${prompts.length} scenes to ${job.provider_stack.video_synthesis}`);

  // Mock: simulate async generation
  const sceneIds = prompts.map((_, i) => `scene_${job.id}_${i}`);

  await updateStep(job.id, 'scene_generation', { status: 'completed', progress: 100, metadata: { scene_count: sceneIds.length } });

  return { scene_ids: sceneIds };
}

/**
 * Step 5 — Assemble generated clips into a coherent edit.
 * Applies beat sync, pacing rules, and transition constraints.
 */
export async function assembleEdit(
  job: GenerationJob,
  sceneIds: string[],
  bpm: number
): Promise<{ edit_manifest: EditManifest }> {
  await updateJob(job.id, { status: 'assembling_edit', progress: 75, current_step: 'clip_stitching' });
  await updateStep(job.id, 'clip_stitching', { status: 'running' });

  const manifest: EditManifest = {
    job_id: job.id,
    bpm,
    total_duration: job.config_snapshot.duration_seconds,
    scenes: sceneIds.map((id, i) => ({
      scene_id: id,
      order: i,
      transition: i === 0 ? 'none' : getTransitionType(job.config_snapshot.editing_intensity),
    })),
    beat_sync_enabled: job.config_snapshot.pacing === 'beat_synced',
    color_grade: getCinematicModeGrade(job.config_snapshot.cinematic_mode),
  };

  await logStep(job.id, 'clip_stitching', 'info', `Assembled ${sceneIds.length} clips`);
  await updateStep(job.id, 'clip_stitching', { status: 'completed', progress: 100 });

  if (job.config_snapshot.has_subtitles) {
    await updateStep(job.id, 'subtitle_rendering', { status: 'running' });
    await logStep(job.id, 'subtitle_rendering', 'info', 'Rendering subtitles from lyrics');
    await updateStep(job.id, 'subtitle_rendering', { status: 'completed', progress: 100 });
  } else {
    await updateStep(job.id, 'subtitle_rendering', { status: 'skipped' });
  }

  return { edit_manifest: manifest };
}

/**
 * Step 6 — Render final export using configured render profile.
 */
export async function renderFinalExport(
  job: GenerationJob,
  manifest: EditManifest
): Promise<{ output_url: string; file_size_bytes: number }> {
  await updateJob(job.id, { status: 'rendering_export', progress: 90, current_step: 'final_export' });
  await updateStep(job.id, 'final_export', { status: 'running' });

  await logStep(job.id, 'final_export', 'info', `Rendering with profile: ${job.config_snapshot.render_profile_id ?? 'default'}`);

  // Mock: real implementation calls render farm
  const outputUrl = `https://storage.example.com/outputs/${job.id}/final.mp4`;
  const fileSizeBytes = manifest.total_duration * 1_500_000; // ~1.5 MB/s estimate

  await updateStep(job.id, 'final_export', { status: 'completed', progress: 100, metadata: { output_url: outputUrl } });

  return { output_url: outputUrl, file_size_bytes: fileSizeBytes };
}

/**
 * Step 7 — Persist outputs and mark job complete.
 */
export async function finalizeJob(
  job: GenerationJob,
  outputUrl: string,
  fileSizeBytes: number
): Promise<void> {
  const config = job.config_snapshot;

  await supabase.from('generation_outputs').insert({
    job_id: job.id,
    project_id: job.project_id,
    output_type: 'final',
    file_url: outputUrl,
    file_size_bytes: fileSizeBytes,
    duration_seconds: config.duration_seconds,
    width: getResolutionDimensions(config.aspect_ratio).width,
    height: getResolutionDimensions(config.aspect_ratio).height,
    resolution: getResolutionString(config.aspect_ratio),
    format: 'mp4',
    metadata: { cinematic_mode: config.cinematic_mode, shot_language: config.shot_language },
  });

  await supabase.from('generation_jobs').update({
    status: 'completed',
    progress: 100,
    current_step: null,
    completed_at: new Date().toISOString(),
  }).eq('id', job.id);

  await supabase.from('projects').update({
    status: 'completed',
    updated_at: new Date().toISOString(),
  }).eq('id', job.project_id);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildBasePrompt(config: GenerationJob['config_snapshot']): string {
  const modeDescriptors: Record<string, string> = {
    cinematic: 'cinematic photography, anamorphic lens, film grain, color graded',
    clean_motion: 'clean motion, smooth movement, no artifacts, sharp focus',
    editorial_montage: 'editorial photography, magazine quality, precise composition',
    stylized_concept: 'stylized art direction, concept visual, bold aesthetic',
    luxury_brand: 'luxury brand visual, high-end production, immaculate',
  };
  return `${config.concept_prompt}, ${modeDescriptors[config.cinematic_mode] ?? ''}, ${config.visual_style.replace(/_/g, ' ')} style`;
}

function buildNegativePrompt(config: GenerationJob['config_snapshot']): string {
  const base = [
    'blurry', 'low quality', 'distorted face', 'extra limbs', 'bad anatomy',
    'watermark', 'text overlay', 'duplicate', 'morbid', 'jpeg artifacts',
  ];
  if (config.quality_guardrails) {
    base.push('surreal', 'uncanny', 'floating objects', 'inconsistent lighting', 'color banding');
  }
  const user = config.negative_prompt ?? '';
  return user ? `${user}, ${base.join(', ')}` : base.join(', ');
}

function getShotInstruction(shotLanguage: string): string {
  const instructions: Record<string, string> = {
    handheld_intimate: 'handheld camera, intimate close composition, slight natural shake',
    cinematic_slow_push: 'slow dolly push-in, shallow depth of field, cinematic',
    static_luxury_frame: 'static tripod shot, perfectly composed, luxury framing',
    performance_close_up: 'tight close-up on face or hands, shallow DOF, sharp',
    wide_atmospheric: 'wide establishing shot, atmospheric, environmental context',
    editorial_motion: 'editorial motion blur, dynamic angle, magazine photography',
    drone_survey: 'aerial drone shot, wide angle, sweeping movement',
    rack_focus_portrait: 'rack focus, subject isolation, bokeh background',
  };
  return instructions[shotLanguage] ?? '';
}

function getSectionVariation(section: TrackSection): string {
  const variations: Record<TrackSection['type'], string> = {
    intro: 'establishing shot, ambient atmosphere',
    verse: 'narrative scene, storytelling composition',
    chorus: 'high energy, dynamic movement, peak moment',
    bridge: 'transitional mood shift, contemplative',
    outro: 'resolution, fading energy, closing frame',
  };
  return variations[section.type] ?? '';
}

function getTransitionType(editingIntensity: string): EditScene['transition'] {
  if (editingIntensity === 'experimental') return 'glitch';
  if (editingIntensity === 'aggressive') return 'cut';
  if (editingIntensity === 'subtle') return 'dissolve';
  return 'cut';
}

function getCinematicModeGrade(mode: string): string {
  const grades: Record<string, string> = {
    cinematic: 'teal_orange_grade',
    clean_motion: 'neutral_grade',
    editorial_montage: 'desaturated_grade',
    stylized_concept: 'high_contrast_grade',
    luxury_brand: 'warm_grade',
  };
  return grades[mode] ?? 'neutral_grade';
}

function getResolutionDimensions(aspectRatio: string): { width: number; height: number } {
  const map: Record<string, { width: number; height: number }> = {
    '16:9': { width: 1920, height: 1080 },
    '9:16': { width: 1080, height: 1920 },
    '1:1': { width: 1080, height: 1080 },
    '4:5': { width: 1080, height: 1350 },
    '21:9': { width: 2560, height: 1080 },
  };
  return map[aspectRatio] ?? { width: 1920, height: 1080 };
}

function getResolutionString(aspectRatio: string): string {
  const { width, height } = getResolutionDimensions(aspectRatio);
  return `${width}x${height}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrackSection {
  index: number;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro';
  start_seconds: number;
  end_seconds: number;
  energy: number; // 0-1
}

export interface ScenePrompt {
  scene_index: number;
  section_type: TrackSection['type'];
  positive_prompt: string;
  negative_prompt: string;
  shot_instruction: string;
  duration_seconds: number;
  energy: number;
}

export interface EditScene {
  scene_id: string;
  order: number;
  transition: 'cut' | 'dissolve' | 'glitch' | 'none';
}

export interface EditManifest {
  job_id: string;
  bpm: number;
  total_duration: number;
  scenes: EditScene[];
  beat_sync_enabled: boolean;
  color_grade: string;
}
