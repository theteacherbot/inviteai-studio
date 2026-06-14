/**
 * Text generation service. ALL text generation in the app must go through
 * this service so we keep a single POST/JSON path (never GET) and a single
 * BYOP (Bring Your Own Provider/Key) seam.
 *
 * Images continue to use the separate ImageProvider layer unchanged.
 */

import { PollinationsTextProvider } from "./text-providers/pollinations.server";
import type {
  GenerateTextOptions,
  GenerateTextResult,
  TextProvider,
} from "./text-providers/types";

export type { GenerateTextOptions, GenerateTextResult, TextProvider };
export { ProviderError } from "./text-providers/types";

const DEFAULT_PROVIDER: TextProvider = PollinationsTextProvider;

export async function generateText(
  options: GenerateTextOptions,
  provider: TextProvider = DEFAULT_PROVIDER,
): Promise<GenerateTextResult> {
  return provider.generateText(options);
}
