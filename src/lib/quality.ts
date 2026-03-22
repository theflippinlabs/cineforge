/**
 * Quality Control Service
 *
 * Defines cinematic modes, shot language presets, and guardrail configurations.
 * Acts as a creative director layer — constraining outputs toward coherent,
 * premium visuals rather than random AI generation.
 */
import type { CinematicMode, ShotLanguage, QualityGuardrails, StyleLockConfig, EditingIntensity, Mood, VisualStyle } from '../types';

// ─── Cinematic Mode Definitions ───────────────────────────────────────────────

export interface CinematicModeConfig {
  id: CinematicMode;
  label: string;
  description: string;
  /** Short copyline shown in the UI */
  tagline: string;
  defaults: {
    editing_intensity: EditingIntensity;
    shot_language: ShotLanguage;
    realism_level: number;
    guardrails: QualityGuardrails;
    style_lock: StyleLockConfig;
  };
}

export const CINEMATIC_MODES: CinematicModeConfig[] = [
  {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'Film-grade visual language. Anamorphic framing, restrained color grade, precise composition.',
    tagline: 'Directed. Considered. Cinematic.',
    defaults: {
      editing_intensity: 'standard',
      shot_language: 'cinematic_slow_push',
      realism_level: 80,
      guardrails: {
        suppress_artifacts: true,
        style_lock: true,
        max_shot_variety: 4,
        character_consistency: true,
        restrained_transitions: true,
        bpm_sync: true,
      },
      style_lock: {
        enabled: true,
        reference_image_url: null,
        color_grade: 'neutral',
        grain_level: 'light',
        vignette: true,
      },
    },
  },
  {
    id: 'clean_motion',
    label: 'Clean Motion',
    description: 'Zero artifact tolerance. Smooth, controlled movement. Contemporary commercial feel.',
    tagline: 'Precise. Controlled. Artifact-free.',
    defaults: {
      editing_intensity: 'subtle',
      shot_language: 'static_luxury_frame',
      realism_level: 95,
      guardrails: {
        suppress_artifacts: true,
        style_lock: true,
        max_shot_variety: 3,
        character_consistency: true,
        restrained_transitions: true,
        bpm_sync: false,
      },
      style_lock: {
        enabled: true,
        reference_image_url: null,
        color_grade: 'neutral',
        grain_level: 'none',
        vignette: false,
      },
    },
  },
  {
    id: 'editorial_montage',
    label: 'Editorial Montage',
    description: 'Fast-cut editorial rhythm. Magazine photography meets video. Sharp, confident cuts.',
    tagline: 'Sharp. Decisive. Editorial.',
    defaults: {
      editing_intensity: 'aggressive',
      shot_language: 'editorial_motion',
      realism_level: 70,
      guardrails: {
        suppress_artifacts: true,
        style_lock: false,
        max_shot_variety: 6,
        character_consistency: false,
        restrained_transitions: false,
        bpm_sync: true,
      },
      style_lock: {
        enabled: false,
        reference_image_url: null,
        color_grade: 'desaturated',
        grain_level: 'medium',
        vignette: false,
      },
    },
  },
  {
    id: 'stylized_concept',
    label: 'Stylized Concept',
    description: 'Bold art direction. Concept-driven visuals. Intentional surrealism allowed.',
    tagline: 'Bold. Conceptual. Intentional.',
    defaults: {
      editing_intensity: 'experimental',
      shot_language: 'wide_atmospheric',
      realism_level: 40,
      guardrails: {
        suppress_artifacts: false,
        style_lock: false,
        max_shot_variety: 8,
        character_consistency: false,
        restrained_transitions: false,
        bpm_sync: true,
      },
      style_lock: {
        enabled: false,
        reference_image_url: null,
        color_grade: 'high_contrast',
        grain_level: 'heavy',
        vignette: true,
      },
    },
  },
  {
    id: 'luxury_brand',
    label: 'Luxury Brand',
    description: 'Immaculate production quality. Warm color grade. Static and slow-push only. Zero noise.',
    tagline: 'Immaculate. Warm. Authoritative.',
    defaults: {
      editing_intensity: 'subtle',
      shot_language: 'static_luxury_frame',
      realism_level: 100,
      guardrails: {
        suppress_artifacts: true,
        style_lock: true,
        max_shot_variety: 2,
        character_consistency: true,
        restrained_transitions: true,
        bpm_sync: false,
      },
      style_lock: {
        enabled: true,
        reference_image_url: null,
        color_grade: 'warm',
        grain_level: 'none',
        vignette: false,
      },
    },
  },
];

// ─── Shot Language Definitions ────────────────────────────────────────────────

export interface ShotLanguageConfig {
  id: ShotLanguage;
  label: string;
  description: string;
  /** Prompt injection appended to scene prompts */
  prompt_fragment: string;
  /** Camera motion description for the renderer */
  motion: 'static' | 'push' | 'pull' | 'pan' | 'tilt' | 'handheld' | 'drone' | 'rack_focus';
}

export const SHOT_LANGUAGES: ShotLanguageConfig[] = [
  {
    id: 'handheld_intimate',
    label: 'Handheld Intimate',
    description: 'Naturalistic, close, emotionally present',
    prompt_fragment: 'handheld camera, close framing, slight natural motion, intimate, documentary feel',
    motion: 'handheld',
  },
  {
    id: 'cinematic_slow_push',
    label: 'Cinematic Slow Push',
    description: 'Controlled dolly move, shallow depth of field',
    prompt_fragment: 'slow dolly push-in, shallow depth of field, anamorphic lens, cinematic',
    motion: 'push',
  },
  {
    id: 'static_luxury_frame',
    label: 'Static Luxury Frame',
    description: 'Perfectly composed, zero movement, maximum control',
    prompt_fragment: 'static shot, tripod, perfectly balanced composition, luxury advertising',
    motion: 'static',
  },
  {
    id: 'performance_close_up',
    label: 'Performance Close-Up',
    description: 'Artist-forward, tight, emotionally charged',
    prompt_fragment: 'tight close-up, performance focus, shallow depth of field, sharp eyes',
    motion: 'static',
  },
  {
    id: 'wide_atmospheric',
    label: 'Wide Atmospheric',
    description: 'Environmental context, scale, mood',
    prompt_fragment: 'wide angle, environmental context, atmospheric, epic scale, landscape',
    motion: 'pan',
  },
  {
    id: 'editorial_motion',
    label: 'Editorial Motion',
    description: 'Dynamic angles, magazine energy',
    prompt_fragment: 'editorial photography, dynamic angle, motion blur, fashion editorial',
    motion: 'handheld',
  },
  {
    id: 'drone_survey',
    label: 'Drone Survey',
    description: 'Aerial perspective, sweeping movement',
    prompt_fragment: 'aerial drone shot, bird\'s eye view, sweeping reveal, wide angle',
    motion: 'drone',
  },
  {
    id: 'rack_focus_portrait',
    label: 'Rack Focus Portrait',
    description: 'Foreground/background isolation, subject presence',
    prompt_fragment: 'rack focus, subject isolation, bokeh background, portrait lens',
    motion: 'rack_focus',
  },
];

// ─── Default Negative Prompts ─────────────────────────────────────────────────

export const DEFAULT_NEGATIVE_PROMPTS: Record<CinematicMode, string> = {
  cinematic:
    'blurry, low quality, watermark, text, jpeg artifacts, bad anatomy, extra limbs, duplicate, amateur, overexposed, underexposed',
  clean_motion:
    'motion blur, shake, noise, grain, artifacts, distortion, surreal, uncanny valley, bad anatomy, overexposed',
  editorial_montage:
    'low quality, amateur, overexposed, bad composition, watermark, cluttered, messy',
  stylized_concept:
    'low quality, watermark, accidental artifacts, boring composition, flat lighting',
  luxury_brand:
    'grain, noise, motion blur, artifacts, casual, amateur, low quality, distorted, overexposed, saturated colors',
};

// ─── Visual Style Compatibility ───────────────────────────────────────────────

/** Recommended cinematic modes for each visual style */
export const STYLE_MODE_RECOMMENDATIONS: Record<VisualStyle, CinematicMode[]> = {
  cinematic: ['cinematic', 'clean_motion'],
  noir: ['cinematic', 'stylized_concept'],
  neon_cyberpunk: ['stylized_concept', 'editorial_montage'],
  minimal_clean: ['luxury_brand', 'clean_motion'],
  documentary: ['cinematic', 'editorial_montage'],
  abstract: ['stylized_concept', 'editorial_montage'],
  vintage_film: ['cinematic', 'stylized_concept'],
  hyper_real: ['clean_motion', 'cinematic'],
  anime: ['stylized_concept', 'editorial_montage'],
  oil_painting: ['stylized_concept', 'cinematic'],
};

// ─── BPM Pacing Logic ─────────────────────────────────────────────────────────

export interface PacingProfile {
  min_scene_duration: number;
  max_scene_duration: number;
  preferred_cuts_per_minute: number;
  transition_budget: 'cuts_only' | 'mixed' | 'dissolves_allowed';
}

export function getPacingProfile(bpm: number, editingIntensity: string): PacingProfile {
  const beatsPerCut = editingIntensity === 'aggressive' ? 2
    : editingIntensity === 'experimental' ? 1
    : editingIntensity === 'subtle' ? 8
    : 4;

  const cutInterval = (60 / bpm) * beatsPerCut;
  return {
    min_scene_duration: cutInterval * 0.5,
    max_scene_duration: cutInterval * 2,
    preferred_cuts_per_minute: 60 / cutInterval,
    transition_budget: editingIntensity === 'subtle' ? 'dissolves_allowed' : 'cuts_only',
  };
}

// ─── Prompt Consistency Layer ─────────────────────────────────────────────────

/**
 * Injects style-lock constraints into every scene prompt to maintain
 * visual coherence across the full sequence.
 */
export function applyConsistencyLayer(
  basePrompt: string,
  styleLock: StyleLockConfig,
  shotLanguage: ShotLanguageConfig
): string {
  const parts = [basePrompt];

  parts.push(shotLanguage.prompt_fragment);

  if (styleLock.enabled) {
    const gradeMap: Record<string, string> = {
      warm: 'warm tones, golden hour grade',
      cool: 'cool tones, blue hour grade',
      neutral: 'neutral color grade, balanced exposure',
      desaturated: 'desaturated, muted colors',
      high_contrast: 'high contrast, deep blacks',
    };
    parts.push(gradeMap[styleLock.color_grade] ?? '');

    if (styleLock.grain_level !== 'none') {
      parts.push(`${styleLock.grain_level} film grain`);
    }
    if (styleLock.vignette) {
      parts.push('subtle vignette');
    }
  }

  return parts.filter(Boolean).join(', ');
}
