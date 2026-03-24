import type { Job, JobInput, TaskType } from "@/types";
import type { BaseProvider } from "@/lib/providers/base";
import { createJob, setJobRunning, setJobProgress, setJobCompleted, setJobFailed } from "./store";
import { getAvailableProvider } from "@/lib/providers";

const runningJobs = new Map<string, string>();

export async function enqueueJob(taskType: TaskType, input: JobInput, workflowId?: string, stepIndex?: number): Promise<Job> {
  const capability = taskType === "workflow" ? "text" : taskType;
  const provider = await getAvailableProvider(capability as Parameters<typeof getAvailableProvider>[0]);
  if (!provider) {
    throw new Error(`No available provider for ${capability}. Please check your local services are running and configured in Settings.`);
  }
  const job = createJob(taskType, input, provider.id, provider.name, workflowId, stepIndex);
  runJobAsync(job.id, input, provider).catch((err) => console.error(`[Queue] Unhandled error for job ${job.id}:`, err));
  return job;
}

async function runJobAsync(jobId: string, input: JobInput, provider: BaseProvider): Promise<void> {
  const capabilityKey = provider.capability;
  while (runningJobs.has(capabilityKey)) await new Promise((r) => setTimeout(r, 500));
  runningJobs.set(capabilityKey, jobId);
  try {
    setJobRunning(jobId);
    const outputs = await provider.generate(input, { jobId, onProgress: (p) => setJobProgress(jobId, p) });
    setJobCompleted(jobId, outputs);
  } catch (err) {
    setJobFailed(jobId, err instanceof Error ? err.message : "Unknown error during generation");
    console.error(`[Queue] Job ${jobId} failed:`, err);
  } finally {
    runningJobs.delete(capabilityKey);
  }
}
