import { MockProvider } from "./mock";
import { PollinationsProvider } from "./pollinations";
import type { ImageProvider } from "./types";

export type ProviderId = "mock" | "pollinations" | "flux" | "openai" | "gemini" | "byop";

const registry: Record<string, ImageProvider> = {
  [MockProvider.id]: MockProvider,
  [PollinationsProvider.id]: PollinationsProvider,
};

/**
 * Active default provider. Switch between "mock" and "pollinations" here
 * (or pass `providerId` explicitly to `generateAndSaveImage`).
 */
export const DEFAULT_PROVIDER_ID: ProviderId = "pollinations";

export function getImageProvider(id: string = DEFAULT_PROVIDER_ID): ImageProvider {
  const provider = registry[id];
  if (!provider) {
    const available = Object.keys(registry).join(", ") || "(none)";
    throw new Error(
      `[image-providers] Provider "${id}" is not registered. Available providers: ${available}.`,
    );
  }
  return provider;
}

export function registerImageProvider(provider: ImageProvider): void {
  registry[provider.id] = provider;
}

export type { ImageProvider, GenerateImageResult, GenerateImageOptions } from "./types";

