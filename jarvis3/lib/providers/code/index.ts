import { LocalCodeProvider } from "./local";
import type { BaseProvider } from "../base";

export const CODE_PROVIDERS: BaseProvider[] = [
  new LocalCodeProvider(),
];

export { LocalCodeProvider };
