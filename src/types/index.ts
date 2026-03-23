// ─── User & Auth ──────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier_id: string | null;
  default_aspect_ratio: AspectRatio | null;
  default_render_profile_id: string | null;
  notification_preferences: NotificationPreferences;
  generation_preferences: GenerationPreferences;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  email_on_completion: boolean;
  email_on_failure: boolean;
  in_app_updates: boolean;
}

export interface GenerationPreferences {
  default_visual_style: VisualStyle;
  default_mood: Mood;
  default_pacing: Pacing;
  default_realism_level: number;
  default_cinematic_mode: CinematicMode;
  enable_quality_guardrails: boolean;
}

export interface SubscriptionTier {
  id: string;
  code: string;
  name: string;
  description: string;
  max_projects: number;
  max_generations_per_month: number;
  max_duration_seconds: number;
  export_quality: 'sd' | 'hd' | 'uhd';
  allows_subtitles: boolean;
  allows_branding: boolean;
  allows_reference_images: boolean;
  allows_priority_queue: boolean;
}

export type AccessTier = 'guest' | 'free' | 'nft_verified' | 'pro' | 'premium' | 'admin';

export type UserRole = 'user' | 'admin' | 'super_admin';

// ─── Wallet & NFT ─────────────────────────────────────────────────────────────

export interface Wallet {
  id: string;
  user_id: string;
  address: string;
  chain_id: number;
  chain_name: string;
  is_primary: boolean;
  linked_at: string;
  last_verified_at: string | null;
}

export interface NFTAccessRule {
  id: string;
  name: string;
  contract_address: string;
  chain_id: number;
  chain: string;
  collection_name: string;
  token_standard: 'ERC-721' | 'ERC-1155';
  required_balance: number;
  tier_unlocked: SubscriptionTier['code'];
  is_active: boolean;
  description: string | null;
  created_at: string;
}

export interface WalletNFTStatus {
  id: string;
  wallet_id: string;
  rule_id: string;
  is_eligible: boolean;
  verified_balance: number;
  token_ids: string[];
  last_checked_at: string;
  rule?: NFTAccessRule;
}

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
  shot_language: ShotLanguage;
  editing_intensity: EditingIntensity;
  cinematic_mode: CinematicMode;
  negative_prompt: string | null;
  has_brand_overlay: boolean;
  has_subtitles: boolean;
  has_style_lock: boolean;
  quality_guardrails: boolean;
  reference_image_url: string | null;
  lyrics: string | null;
  render_profile_id: string | null;
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

/** Granular shot presets that drive prompt-level camera instructions */
export type ShotLanguage =
  | 'handheld_intimate'
  | 'cinematic_slow_push'
  | 'static_luxury_frame'
  | 'performance_close_up'
  | 'wide_atmospheric'
  | 'editorial_motion'
  | 'drone_survey'
  | 'rack_focus_portrait';

export type EditingIntensity = 'subtle' | 'standard' | 'aggressive' | 'experimental';

/**
 * Cinematic mode sets a coherent bundle of visual constraints —
 * style, shot language, editing rhythm, color grade intent.
 */
export type CinematicMode =
  | 'cinematic'
  | 'clean_motion'
  | 'editorial_montage'
  | 'stylized_concept'
  | 'luxury_brand';

// ─── Quality & Guardrails ─────────────────────────────────────────────────────

export interface QualityGuardrails {
  /** Suppress surreal AI artifacts: floating limbs, distorted faces, etc. */
  suppress_artifacts: boolean;
  /** Lock visual style and color grade across scenes */
  style_lock: boolean;
  /** Cap number of distinct shot types to maintain coherence */
  max_shot_variety: number;
  /** Ensure character styling is consistent across scenes */
  character_consistency: boolean;
  /** Use restrained transitions (cut / dissolve only) */
  restrained_transitions: boolean;
  /** BPM-aware beat sync cuts */
  bpm_sync: boolean;
}

export interface StyleLockConfig {
  enabled: boolean;
  reference_image_url: string | null;
  color_grade: 'warm' | 'cool' | 'neutral' | 'desaturated' | 'high_contrast';
  grain_level: 'none' | 'light' | 'medium' | 'heavy';
  vignette: boolean;
}

// ─── Generation Jobs ──────────────────────────────────────────────────────────

export interface GenerationJob {
  id: string;
  project_id: string;
  user_id: string;
  version: number;
  status: JobStatus;
  progress: number; // 0-100
  access_tier: AccessTier;
  current_step: GenerationStepName | null;
  config_snapshot: ProjectConfig;
  provider_stack: ProviderStack;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
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
  step_order: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress: number;
  logs: StepLog[];
  metadata: Record<string, unknown>;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface StepLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface GenerationOutput {
  id: string;
  job_id: string;
  project_id: string;
  output_type: 'preview' | 'final' | 'thumbnail' | 'storyboard' | 'scene_clip';
  file_url: string;
  file_size_bytes: number;
  duration_seconds: number;
  width: number;
  height: number;
  resolution: string;
  format: 'mp4' | 'webm' | 'gif' | 'jpg' | 'png';
  render_profile_id: string | null;
  metadata: Record<string, unknown>;
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
  shot_language: ShotLanguage;
  editing_intensity: EditingIntensity;
  cinematic_mode: CinematicMode;
  negative_prompt: string | null;
  has_brand_overlay: boolean;
  has_subtitles: boolean;
  has_style_lock: boolean;
  quality_guardrails: boolean;
  reference_image_url: string | null;
  render_profile_id: string | null;
}

/** Which AI providers are used at each stage of the pipeline */
export interface ProviderStack {
  audio_analysis: string;
  scene_generation: string;
  video_synthesis: string;
  edit_assembly: string;
  export_render: string;
}

// ─── Prompt Presets ───────────────────────────────────────────────────────────

export interface PromptPreset {
  id: string;
  name: string;
  description: string;
  category: 'cinematic' | 'luxury' | 'neon' | 'urban' | 'minimal' | 'narrative' | 'custom';
  concept_prompt: string;
  visual_style: VisualStyle;
  mood: Mood;
  pacing: Pacing;
  camera_language: CameraLanguage;
  shot_language: ShotLanguage;
  editing_intensity: EditingIntensity;
  cinematic_mode: CinematicMode;
  realism_level: number;
  negative_prompt: string;
  tags: string[];
  is_system: boolean;
  is_featured: boolean;
  preview_image_url: string | null;
  created_at: string;
}

// ─── Usage & Metering ─────────────────────────────────────────────────────────

export interface UsageEvent {
  id: string;
  user_id: string;
  event_type: 'generation_started' | 'generation_completed' | 'download' | 'preview' | 'variation_created';
  job_id: string | null;
  project_id: string | null;
  quantity: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── Render Profiles ──────────────────────────────────────────────────────────

export interface RenderProfile {
  id: string;
  code: string;
  name: string;
  description: string;
  resolution: string;
  width: number;
  height: number;
  fps: number;
  bitrate_kbps: number;
  format: 'mp4' | 'webm';
  codec: 'h264' | 'h265' | 'vp9' | 'av1';
  tier_required: SubscriptionTier['code'];
  is_active: boolean;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  total_users: number;
  active_users_30d: number;
  total_projects: number;
  total_generations: number;
  pending_jobs: number;
  failed_jobs_24h: number;
  nft_verified_users: number;
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
  shotLanguage: ShotLanguage;
  editingIntensity: EditingIntensity;
  cinematicMode: CinematicMode;
  negativePrompt: string;
  hasBrandOverlay: boolean;
  hasSubtitles: boolean;
  hasStyleLock: boolean;
  enableQualityGuardrails: boolean;
  referenceImageUrl: string;
  renderProfileId: string;
}

// ─── Label Maps ───────────────────────────────────────────────────────────────

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

export const GENERATION_STEP_ORDER: GenerationStepName[] = [
  'audio_ingestion',
  'bpm_analysis',
  'scene_segmentation',
  'prompt_expansion',
  'scene_generation',
  'clip_stitching',
  'beat_sync',
  'subtitle_rendering',
  'final_export',
];

export const GENERATION_STEP_LABELS: Record<GenerationStepName, string> = {
  audio_ingestion: 'Audio Ingestion',
  bpm_analysis: 'BPM Analysis',
  scene_segmentation: 'Scene Segmentation',
  prompt_expansion: 'Prompt Expansion',
  scene_generation: 'Scene Generation',
  clip_stitching: 'Clip Assembly',
  beat_sync: 'Beat Sync',
  subtitle_rendering: 'Subtitle Rendering',
  final_export: 'Final Export',
};
