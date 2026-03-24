// ============================================================
// JARVIS 3 — Core Type Definitions
// ============================================================

export type TaskType = "text" | "image" | "video" | "code" | "workflow";

export type JobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "canceled";

export type ProviderCapability = "text" | "image" | "video" | "code";

export type ProviderStatus = "available" | "unavailable" | "unchecked" | "error";

export interface ProviderInfo {
  id: string;
  name: string;
  capability: ProviderCapability;
  isFree: boolean;
  isLocal: boolean;
  status: ProviderStatus;
  endpoint?: string;
  lastChecked?: string;
  errorMessage?: string;
  latencyMs?: number;
}

export interface ProviderHealthResult {
  status: ProviderStatus;
  latencyMs?: number;
  errorMessage?: string;
  checkedAt: string;
}

export interface JobInput {
  prompt: string;
  taskType: TaskType;
  options?: Record<string, unknown>;
  inputJobId?: string;
  inputOutputIndex?: number;
}

export interface JobOutput {
  type: "text" | "image" | "video" | "code" | "file";
  content?: string;
  filePath?: string;
  absolutePath?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

export interface Job {
  id: string;
  taskType: TaskType;
  status: JobStatus;
  providerId: string;
  providerName: string;
  input: JobInput;
  output?: JobOutput[];
  error?: string;
  progress?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  workflowId?: string;
  stepIndex?: number;
}

export interface WorkflowStep {
  id: string;
  stepIndex: number;
  taskType: TaskType;
  prompt: string;
  options?: Record<string, unknown>;
  useOutputFromStep?: number;
  outputIndex?: number;
}

export type WorkflowStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "canceled";

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  jobIds: string[];
  currentStep: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface JarvisConfig {
  ollamaEndpoint: string;
  ollamaModel: string;
  comfyUIEndpoint: string;
  automatic1111Endpoint: string;
  outputDir: string;
  features: {
    text: boolean;
    image: boolean;
    video: boolean;
    code: boolean;
    workflow: boolean;
  };
  premium: {
    openaiEnabled: boolean;
    openaiApiKey: string;
    stabilityEnabled: boolean;
    stabilityApiKey: string;
    replicateEnabled: boolean;
    replicateApiKey: string;
  };
}

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  taskType?: TaskType;
  jobId?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
