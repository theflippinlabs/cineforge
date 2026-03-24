import type { JarvisConfig } from "@/types";

export const DEFAULT_CONFIG: JarvisConfig = {
  ollamaEndpoint: "http://localhost:11434",
  ollamaModel: "llama3",
  comfyUIEndpoint: "http://localhost:8188",
  automatic1111Endpoint: "http://localhost:7860",
  outputDir: "public/outputs",
  features: {
    text: true,
    image: true,
    video: true,
    code: true,
    workflow: true,
  },
  premium: {
    openaiEnabled: false,
    openaiApiKey: "",
    stabilityEnabled: false,
    stabilityApiKey: "",
    replicateEnabled: false,
    replicateApiKey: "",
  },
};
