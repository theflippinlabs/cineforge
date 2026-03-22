// ─── User & Auth ──────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionTier {
  id: string;
  name: 'free' | 'pro' | 'premium' | 'enterprise';
  display_name: string;
  monthly_generation_limit: number;
  max_duration_seconds: number;
  max_resolution: string;
  features: string[];
  price_monthly: number | null;
}

// ─── Wallet & NFT ─────────────────────────────────────────────────────────────

export interface Wallet {
  id: string;
  user_id: string;
  address: string;
  chain_id: number;
  chain_name: string;
  is_primary: boolean;
  linked_at: string;
}

export interface NFTAccessRule {
  id: string;
  contract_address: string;
  chain_id: number;
  collection_name: string;
  tier_unlocked: SubscriptionTier['name'];
  min_token_count: number;
  is_active: boolean;
  created_at: string;
}

export interface WalletNFTStatus {
  id: string;
  wallet_id: string;
  rule_id: string;
  is_eligible: boolean;
  token_ids: string[];
  last_verified_at: string;
  rule?: NFTAccessRule;
}

export type AccessTier = 'free' | 'nft_verified' | 'pro' | 'premium' | 'enterprise';

export interface AccessStatus {
  tier: AccessTier;
  walletConnected: boolean;
  nftVerified: boolean;
  unlockedFeatures: string[];
  generationsRemaining: number;
  generationsTotal: number;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  audio_url: string | null;
  audio_filename: string | null;
  concept_prompt: string;
  visual_style: VisualStyle;
  mood: Mood;
  pacing: Pacing;
  aspect_ratio: AspectRatio;
  duration_seconds: number;
  scene_density: SceneDensity;
  realism_level: number; // 0-100
  camera_language: CameraLanguage;
  editing_intensity: EditingIntensity;
  negative_prompt: string | null;
  has_brand_overlay: boolean;
  has_subtitles: boolean;
  lyrics: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  generation_jobs?: GenerationJob[];
}

export type ProjectStatus = 'draft' | 'generating' | 'completed' | 'archived';

export type VisualStyle =
  | 'cinematic'
  | 'noir'
  | 'neon_cyberpunk'
  | 'minimal_clean'
  | 'documentary'
  | 'abstract'
  | 'vintage_film'
  | 'hyper_real'
  | 'anime'
  | 'oil_painting';

export type Mood =
  | 'epic'
  | 'melancholic'
  | 'euphoric'
  | 'dark_intense'
  | 'dreamy'
  | 'aggressive'
  | 'romantic'
  | 'mysterious'
  | 'uplifting'
  | 'introspective';

export type Pacing =
  | 'slow_contemplative'
  | 'moderate'
  | 'dynamic'
  | 'rapid_cut'
  | 'beat_synced';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9';

export type SceneDensity = 'sparse' | 'balanced' | 'dense';

export type CameraLanguage =
  | 'static_composed'
  | 'fluid_handheld'
  | 'drone_aerial'
  | 'macro_intimate'
  | 'wide_epic'
  | 'mixed';

export type EditingIntensity = 'subtle' | 'standard' | 'aggressive' | 'experimental';

// ─── Generation Jobs ──────────────────────────────────────────────────────────

export interface GenerationJob {
  id: string;
  project_id: string;
  user_id: string;
  version: number;
  status: JobStatus;
  progress: number; // 0-100
  current_step: GenerationStepName | null;
  config_snapshot: ProjectConfig;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  steps?: GenerationStep[];
  outputs?: GenerationOutput[];
}

export type JobStatus =
  | 'queued'
  | 'analyzing_audio'
  | 'segmenting_track'
  | 'generating_scenes'
  | 'assembling_edit'
  | 'rendering_export'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type GenerationStepName =
  | 'audio_ingestion'
  | 'bpm_analysis'
  | 'scene_segmentation'
  | 'prompt_expansion'
  | 'scene_generation'
  | 'clip_stitching'
  | 'beat_sync'
  | 'subtitle_rendering'
  | 'final_export';

export interface GenerationStep {
  id: string;
  job_id: string;
  step_name: GenerationStepName;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  metadata: Record<string, unknown>;
  started_at: string | null;
  completed_at: string | null;
}

export interface GenerationOutput {
  id: string;
  job_id: string;
  project_id: string;
  output_type: 'preview' | 'final' | 'thumbnail';
  file_url: string;
  file_size_bytes: number;
  duration_seconds: number;
  resolution: string;
  format: 'mp4' | 'webm' | 'gif';
  created_at: string;
}

export interface ProjectConfig {
  concept_prompt: string;
  visual_style: VisualStyle;
  mood: Mood;
  pacing: Pacing;
  aspect_ratio: AspectRatio;
  duration_seconds: number;
  scene_density: SceneDensity;
  realism_level: number;
  camera_language: CameraLanguage;
  editing_intensity: EditingIntensity;
  negative_prompt: string | null;
  has_brand_overlay: boolean;
  has_subtitles: boolean;
}

// ─── Prompt Presets ───────────────────────────────────────────────────────────

export interface PromptPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  concept_prompt: string;
  visual_style: VisualStyle;
  mood: Mood;
  pacing: Pacing;
  camera_language: CameraLanguage;
  editing_intensity: EditingIntensity;
  realism_level: number;
  tags: string[];
  is_featured: boolean;
  preview_image_url: string | null;
}

// ─── Usage & Metering ─────────────────────────────────────────────────────────

export interface UsageEvent {
  id: string;
  user_id: string;
  event_type: 'generation_started' | 'generation_completed' | 'download' | 'preview';
  job_id: string | null;
  project_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── Render Profiles ──────────────────────────────────────────────────────────

export interface RenderProfile {
  id: string;
  name: string;
  description: string;
  resolution: string;
  fps: number;
  bitrate_kbps: number;
  format: string;
  codec: string;
  tier_required: SubscriptionTier['name'];
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface CreateClipFormState {
  title: string;
  audioFile: File | null;
  audioUrl: string;
  lyrics: string;
  conceptPrompt: string;
  visualStyle: VisualStyle;
  mood: Mood;
  pacing: Pacing;
  aspectRatio: AspectRatio;
  durationSeconds: number;
  sceneDensity: SceneDensity;
  realismLevel: number;
  cameraLanguage: CameraLanguage;
  editingIntensity: EditingIntensity;
  negativePrompt: string;
  hasBrandOverlay: boolean;
  hasSubtitles: boolean;
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  queued: 'Queued',
  analyzing_audio: 'Analyzing Audio',
  segmenting_track: 'Segmenting Track',
  generating_scenes: 'Generating Scenes',
  assembling_edit: 'Assembling Edit',
  rendering_export: 'Rendering Export',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const JOB_STATUS_PROGRESS: Record<JobStatus, number> = {
  queued: 5,
  analyzing_audio: 15,
  segmenting_track: 30,
  generating_scenes: 55,
  assembling_edit: 75,
  rendering_export: 90,
  completed: 100,
  failed: 0,
  cancelled: 0,
};
