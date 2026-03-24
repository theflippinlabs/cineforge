import type { BaseProvider } from "./base";
import type { ProviderCapability, ProviderInfo } from "@/types";
import { TEXT_PROVIDERS } from "./text";
import { IMAGE_PROVIDERS } from "./image";
import { VIDEO_PROVIDERS } from "./video";
import { CODE_PROVIDERS } from "./code";

const ALL_PROVIDERS: Record<ProviderCapability, BaseProvider[]> = { text: TEXT_PROVIDERS, image: IMAGE_PROVIDERS, video: VIDEO_PROVIDERS, code: CODE_PROVIDERS };

export async function getAvailableProvider(capability: ProviderCapability): Promise<BaseProvider | null> {
  for (const provider of ALL_PROVIDERS[capability] ?? []) {
    const health = await provider.isAvailable();
    if (health.status === "available") return provider;
  }
  return null;
}

export async function getProvidersInfo(capability: ProviderCapability): Promise<ProviderInfo[]> {
  return Promise.all((ALL_PROVIDERS[capability] ?? []).map((p) => p.getInfo()));
}

export async function getAllProvidersHealth(): Promise<Record<ProviderCapability, ProviderInfo[]>> {
  const capabilities: ProviderCapability[] = ["text", "image", "video", "code"];
  const result = {} as Record<ProviderCapability, ProviderInfo[]>;
  await Promise.all(capabilities.map(async (cap) => { result[cap] = await getProvidersInfo(cap); }));
  return result;
}

export { ALL_PROVIDERS };
export type { BaseProvider };
