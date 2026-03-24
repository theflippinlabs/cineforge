/**
 * Image provider registry.
 * ComfyUI is preferred (more flexible); A1111 is fallback.
 */
import { ComfyUIImageProvider } from "./comfyui";
import { Automatic1111Provider } from "./automatic1111";
import type { BaseProvider } from "../base";

export const IMAGE_PROVIDERS: BaseProvider[] = [
  new ComfyUIImageProvider(),
  new Automatic1111Provider(),
];

export { ComfyUIImageProvider, Automatic1111Provider };
