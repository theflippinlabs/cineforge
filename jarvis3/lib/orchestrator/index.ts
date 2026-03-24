import { v4 as uuidv4 } from "uuid";
import type { Job, JobInput, TaskType, Workflow, WorkflowStep } from "@/types";
import { detectIntent, parseWorkflowSteps } from "./intent";
import { enqueueJob } from "@/lib/jobs/queue";
import { readDataFile, appendToDataArray, updateInDataArray } from "@/lib/storage/local";

const WORKFLOWS_FILE = "workflows.json";

export interface OrchestrateResult {
  taskType: TaskType;
  job?: Job;
  workflow?: Workflow;
  intentConfidence: number;
  intentReason: string;
}

export async function orchestrate(prompt: string, options?: { taskType?: TaskType; extraOptions?: Record<string, unknown> }): Promise<OrchestrateResult> {
  const intent = detectIntent(prompt);
  const taskType = options?.taskType ?? intent.taskType;
  if (taskType === "workflow") {
    const workflow = await orchestrateWorkflow(prompt, options?.extraOptions);
    return { taskType, workflow, intentConfidence: intent.confidence, intentReason: intent.reason };
  }
  const input: JobInput = { prompt, taskType, options: options?.extraOptions };
  const job = await enqueueJob(taskType, input);
  return { taskType, job, intentConfidence: intent.confidence, intentReason: intent.reason };
}

async function orchestrateWorkflow(prompt: string, extraOptions?: Record<string, unknown>): Promise<Workflow> {
  const stepPrompts = parseWorkflowSteps(prompt);
  const steps: WorkflowStep[] = stepPrompts.map((stepPrompt, index) => {
    const stepIntent = detectIntent(stepPrompt);
    return {
      id: uuidv4(), stepIndex: index,
      taskType: stepIntent.taskType === "workflow" ? "text" : stepIntent.taskType,
      prompt: stepPrompt, options: extraOptions,
      useOutputFromStep: index > 0 ? index - 1 : undefined,
    };
  });
  const workflow: Workflow = {
    id: uuidv4(), name: prompt.slice(0, 60) + (prompt.length > 60 ? "\u2026" : ""),
    description: prompt, steps, status: "pending", jobIds: [], currentStep: 0,
    createdAt: new Date().toISOString(),
  };
  appendToDataArray(WORKFLOWS_FILE, workflow);
  executeWorkflowAsync(workflow.id).catch((err) => {
    console.error(`[Orchestrator] Workflow ${workflow.id} failed:`, err);
    updateInDataArray<Workflow>(WORKFLOWS_FILE, workflow.id, { status: "failed", error: err instanceof Error ? err.message : "Unknown error" });
  });
  return workflow;
}

async function executeWorkflowAsync(workflowId: string): Promise<void> {
  const workflows = readDataFile<Workflow[]>(WORKFLOWS_FILE) ?? [];
  const workflow = workflows.find((w) => w.id === workflowId);
  if (!workflow) return;
  updateInDataArray<Workflow>(WORKFLOWS_FILE, workflowId, { status: "running" });
  const jobIds: string[] = [];
  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    const input: JobInput = { prompt: step.prompt, taskType: step.taskType, options: step.options, inputJobId: step.useOutputFromStep !== undefined ? jobIds[step.useOutputFromStep] : undefined };
    try {
      const job = await enqueueJob(step.taskType, input, workflowId, i);
      jobIds.push(job.id);
      updateInDataArray<Workflow>(WORKFLOWS_FILE, workflowId, { jobIds: [...jobIds], currentStep: i });
      await waitForJob(job.id);
    } catch (err) {
      updateInDataArray<Workflow>(WORKFLOWS_FILE, workflowId, { status: "failed", error: err instanceof Error ? err.message : `Step ${i} failed`, jobIds });
      return;
    }
  }
  updateInDataArray<Workflow>(WORKFLOWS_FILE, workflowId, { status: "completed", currentStep: workflow.steps.length, completedAt: new Date().toISOString(), jobIds });
}

async function waitForJob(jobId: string, maxWaitMs = 600000): Promise<void> {
  const { getJob } = await import("@/lib/jobs/store");
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const job = getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    if (job.status === "completed") return;
    if (job.status === "failed") throw new Error(job.error ?? "Job failed");
    if (job.status === "canceled") throw new Error("Job was canceled");
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Job ${jobId} timed out`);
}

export function getWorkflow(id: string): Workflow | null {
  return (readDataFile<Workflow[]>(WORKFLOWS_FILE) ?? []).find((w) => w.id === id) ?? null;
}

export function listWorkflows(): Workflow[] {
  return readDataFile<Workflow[]>(WORKFLOWS_FILE) ?? [];
}
