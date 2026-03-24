import type { JobInput, JobOutput, ProviderCapability, ProviderHealthResult, ProviderInfo } from "@/types";

export interface GenerateOptions {
  jobId: string;
  onProgress?: (progress: number) => void;
}

export abstract class BaseProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly capability: ProviderCapability;
  abstract readonly isFree: boolean;
  abstract readonly isLocal: boolean;
  abstract isAvailable(): Promise<ProviderHealthResult>;
  abstract generate(input: JobInput, opts: GenerateOptions): Promise<JobOutput[]>;
  abstract validateInput(input: JobInput): string | null;
  abstract normalizeOutput(raw: unknown): JobOutput[];
  async getInfo(): Promise<ProviderInfo> {
    const health = await this.isAvailable();
    return { id: this.id, name: this.name, capability: this.capability, isFree: this.isFree, isLocal: this.isLocal, status: health.status, lastChecked: health.checkedAt, errorMessage: health.errorMessage, latencyMs: health.latencyMs };
  }
}
