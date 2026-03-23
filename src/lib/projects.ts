import { supabase } from './supabase';
import type { Project, CreateClipFormState } from '../types';

export async function getProjects(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      generation_jobs (
        id, status, progress, current_step, version, created_at,
        generation_outputs (id, output_type, file_url, format, resolution)
      )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  return { data, error };
}

export async function getProject(projectId: string, userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      generation_jobs (
        *,
        generation_steps (*),
        generation_outputs (*)
      )
    `)
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();
  return { data, error };
}

export async function createProject(userId: string, form: CreateClipFormState) {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      title: form.title,
      audio_url: form.audioUrl || null,
      lyrics: form.lyrics || null,
      concept_prompt: form.conceptPrompt,
      visual_style: form.visualStyle,
      mood: form.mood,
      pacing: form.pacing,
      aspect_ratio: form.aspectRatio,
      duration_seconds: form.durationSeconds,
      scene_density: form.sceneDensity,
      realism_level: form.realismLevel,
      camera_language: form.cameraLanguage,
      editing_intensity: form.editingIntensity,
      negative_prompt: form.negativePrompt || null,
      has_brand_overlay: form.hasBrandOverlay,
      has_subtitles: form.hasSubtitles,
      status: 'draft',
    })
    .select()
    .single();
  return { data, error };
}

export async function updateProject(projectId: string, updates: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .select()
    .single();
  return { data, error };
}

export async function duplicateProject(projectId: string, userId: string) {
  const { data: original, error: fetchError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !original) return { data: null, error: fetchError };

  const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = original;
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...rest, title: `${original.title} (copy)`, status: 'draft' })
    .select()
    .single();

  return { data, error };
}

export async function deleteProject(projectId: string, userId: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);
  return { error };
}

/**
 * Upload a character reference image to Supabase Storage.
 * The public URL is stored in config_snapshot.character_image_urls
 * and passed to fal.ai as the image-to-video reference frame.
 */
export async function uploadCharacterImage(
  file: File,
  userId: string
): Promise<{ url: string | null; error: Error | null }> {
  const ext = file.name.split('.').pop();
  const filename = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

  const { error } = await supabase.storage
    .from('character-references')
    .upload(filename, file, { upsert: false });

  if (error) return { url: null, error: new Error(error.message) };

  const { data } = supabase.storage.from('character-references').getPublicUrl(filename);
  return { url: data.publicUrl, error: null };
}

export async function uploadAudio(file: File, userId: string): Promise<{ url: string | null; error: Error | null }> {
  const ext = file.name.split('.').pop();
  const filename = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('audio-uploads')
    .upload(filename, file, { upsert: false });

  if (error) return { url: null, error: new Error(error.message) };

  const { data } = supabase.storage.from('audio-uploads').getPublicUrl(filename);
  return { url: data.publicUrl, error: null };
}
