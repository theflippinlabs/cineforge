import { supabase } from './supabase';
import type { GenerationJob, JobStatus, ProjectConfig } from '../types';
import { JOB_STATUS_PROGRESS } from '../types';

export async function createGenerationJob(
  projectId: string,
  userId: string,
  config: ProjectConfig,
  version: number = 1
) {
  const { data, error } = await supabase
    .from('generation_jobs')
    .insert({
      project_id: projectId,
      user_id: userId,
      version,
      status: 'queued',
      progress: 5,
      current_step: null,
      config_snapshot: config,
    })
    .select()
    .single();

  if (!error && data) {
    // Log usage event
    await supabase.from('usage_events').insert({
      user_id: userId,
      event_type: 'generation_started',
      job_id: data.id,
      project_id: projectId,
    });
  }

  return { data, error };
}

export async function getJob(jobId: string, userId: string) {
  const { data, error } = await supabase
    .from('generation_jobs')
    .select(`
      *,
      generation_steps (*),
      generation_outputs (*)
    `)
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();
  return { data, error };
}

export async function getActiveJobs(userId: string) {
  const { data, error } = await supabase
    .from('generation_jobs')
    .select(`
      *,
      generation_outputs (id, output_type, file_url, format)
    `)
    .eq('user_id', userId)
    .not('status', 'in', '("completed","failed","cancelled")')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getRecentJobs(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from('generation_jobs')
    .select(`
      *,
      generation_outputs (id, output_type, file_url, format, resolution),
      projects (id, title)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
}

const PIPELINE_STEPS = [
  'audio_ingestion', 'bpm_analysis', 'scene_segmentation', 'prompt_expansion',
  'scene_generation', 'clip_stitching', 'beat_sync', 'subtitle_rendering', 'final_export',
] as const;

/**
 * Insert all 9 pipeline steps as 'pending' for a given job.
 * Must be called right after createGenerationJob so the pipeline
 * can UPDATE them (not INSERT) during execution.
 */
export async function createGenerationSteps(jobId: string) {
  const rows = PIPELINE_STEPS.map((step_name) => ({
    job_id: jobId,
    step_name,
    status: 'pending',
    progress: 0,
  }));
  return supabase.from('generation_steps').insert(rows);
}

export async function cancelJob(jobId: string, userId: string) {
  const { data, error } = await supabase
    .from('generation_jobs')
    .update({ status: 'cancelled' })
    .eq('id', jobId)
    .eq('user_id', userId)
    .select()
    .single();
  return { data, error };
}

// Simulate job progression for mock/demo mode
export async function simulateJobProgress(job: GenerationJob): Promise<Partial<GenerationJob>> {
  const statusSequence: JobStatus[] = [
    'queued',
    'analyzing_audio',
    'segmenting_track',
    'generating_scenes',
    'assembling_edit',
    'rendering_export',
    'completed',
  ];

  const currentIdx = statusSequence.indexOf(job.status);
  if (currentIdx === -1 || currentIdx === statusSequence.length - 1) return job;

  const nextStatus = statusSequence[currentIdx + 1];
  return {
    status: nextStatus,
    progress: JOB_STATUS_PROGRESS[nextStatus],
    current_step: null,
  };
}

export function subscribeToJob(
  jobId: string,
  callback: (job: Partial<GenerationJob>) => void
) {
  const channel = supabase
    .channel(`job:${jobId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'generation_jobs',
        filter: `id=eq.${jobId}`,
      },
      (payload) => {
        callback(payload.new as Partial<GenerationJob>);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
