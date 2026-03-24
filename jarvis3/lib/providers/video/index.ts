import { ComfyUIVideoProvider } from "./comfyui-video";
import type { BaseProvider } from "../base";

export const VIDEO_PROVIDERS: BaseProvider[] = [
  new ComfyUIVideoProvider(),
];

export { ComfyUIVideoProvider };
