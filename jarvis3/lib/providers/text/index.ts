import { OllamaProvider } from "./ollama";
import type { BaseProvider } from "../base";
export const TEXT_PROVIDERS: BaseProvider[] = [new OllamaProvider()];
export { OllamaProvider };
