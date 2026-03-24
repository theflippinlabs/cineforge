import { v4 as uuidv4 } from "uuid";
import type { Job, JobInput, JobStatus, TaskType } from "@/types";
import { readDataFile, writeDataFile, updateInDataArray, appendToDataArray } from "@/lib/storage/local";

const JOBS_FILE = "jobs.json";

export function createJob(taskType: TaskType, input: JobInput, providerId: string, providerName: string, workflowId?: string, stepIndex?: number): Job {
  const job: Job = {
    id: uuidv4(), taskType, status: "queued", providerId, providerName, input,
    createdAt: new Date().toISOString(), progress: 0, workflowId, stepIndex,
  };
  appendToDataArray(JOBS_FILE, job);
  return job;
}

export function getJob(id: string): Job | null {
  return (readDataFile<Job[]>(JOBS_FILE) ?? []).find((j) => j.id === id) ?? null;
}

export function listJobs(options?: { status?: JobStatus; taskType?: TaskType; workflowId?: string; limit?: number; offset?: number }): { items: Job[]; total: number } {
  let jobs = readDataFile<Job[]>(JOBS_FILE) ?? [];
  if (options?.status) jobs = jobs.filter((j) => j.status === options.status);
  if (options?.taskType) jobs = jobs.filter((j) => j.taskType === options.taskType);
  if (options?.workflowId) jobs = jobs.filter((j) => j.workflowId === options.workflowId);
  jobs = jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const total = jobs.length;
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 50;
  return { items: jobs.slice(offset, offset + limit), total };
}

export function updateJob(id: string, update: Partial<Job>): Job | null {
  return updateInDataArray<Job>(JOBS_FILE, id, update);
}
export function setJobRunning(id: string): Job | null {
  return updateJob(id, { status: "running", startedAt: new Date().toISOString(), progress: 0 });
}
export function setJobProgress(id: string, progress: number): Job | null {
  return updateJob(id, { progress });
}
export function setJobCompleted(id: string, output: Job["output"]): Job | null {
  return updateJob(id, { status: "completed", completedAt: new Date().toISOString(), progress: 100, output });
}
export function setJobFailed(id: string, error: string): Job | null {
  return updateJob(id, { status: "failed", completedAt: new Date().toISOString(), error });
}
export function setJobCanceled(id: string): Job | null {
  return updateJob(id, { status: "canceled", completedAt: new Date().toISOString() });
}
export function deleteJob(id: string): boolean {
  const jobs = readDataFile<Job[]>(JOBS_FILE) ?? [];
  const filtered = jobs.filter((j) => j.id !== id);
  if (filtered.length === jobs.length) return false;
  writeDataFile(JOBS_FILE, filtered);
  return true;
}
