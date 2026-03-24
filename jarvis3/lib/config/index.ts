import fs from "fs";
import path from "path";
import type { JarvisConfig } from "@/types";
import { DEFAULT_CONFIG } from "./defaults";

const CONFIG_PATH = path.join(process.cwd(), "data", "config.json");

function ensureDataDir(): void {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function readConfig(): JarvisConfig {
  try {
    ensureDataDir();
    if (!fs.existsSync(CONFIG_PATH)) {
      writeConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<JarvisConfig>;
    return deepMergeConfig(DEFAULT_CONFIG, parsed);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function writeConfig(config: JarvisConfig): void {
  ensureDataDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export function updateConfig(partial: Partial<JarvisConfig>): JarvisConfig {
  const current = readConfig();
  const updated = deepMergeConfig(current, partial);
  writeConfig(updated);
  return updated;
}

function deepMergeConfig(target: JarvisConfig, source: Partial<JarvisConfig>): JarvisConfig {
  return {
    ollamaEndpoint: source.ollamaEndpoint ?? target.ollamaEndpoint,
    ollamaModel: source.ollamaModel ?? target.ollamaModel,
    comfyUIEndpoint: source.comfyUIEndpoint ?? target.comfyUIEndpoint,
    automatic1111Endpoint: source.automatic1111Endpoint ?? target.automatic1111Endpoint,
    outputDir: source.outputDir ?? target.outputDir,
    features: { ...target.features, ...(source.features ?? {}) },
    premium: { ...target.premium, ...(source.premium ?? {}) },
  };
}
