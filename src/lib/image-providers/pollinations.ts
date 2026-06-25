import type { GenerateImageOptions, ImageProvider } from "./types";

/**
 * Pollinations.ai image provider.
 * Docs: https://image.pollinations.ai
 *
 * The endpoint returns the image bytes directly from the URL, so the URL
 * itself is the persistable artifact. We do NOT pre-fetch here:
 *  - Pollinations holds the connection open for 15-60s while generating,
 *    which would block `saveGeneratedImage` and risk being cancelled by
 *    React StrictMode unmounts before the INSERT runs.
 *  - The browser will load the URL via <img>, so load/error handling is
 *    delegated to the component (onLoad / onError).
 */

const BASE_URL = "https://image.pollinations.ai/prompt";

interface PollinationsMetadata {
  width?: number;
  height?: number;
  seed?: number | string;
  model?: string;
  apiKey?: string;
  nologo?: boolean;
  enhance?: boolean;
}

function buildUrl(prompt: string, meta: PollinationsMetadata = {}): string {
  const encoded = encodeURIComponent(prompt.trim().slice(0, 1800));
  const params = new URLSearchParams();
  params.set("width", String(meta.width ?? 800));
  params.set("height", String(meta.height ?? 1000));
  params.set("model", String(meta.model ?? "flux"));
  params.set("nologo", String(meta.nologo ?? true));
  if (meta.apiKey?.trim()) params.set("apikey", meta.apiKey.trim());
  if (meta.enhance) params.set("enhance", "true");
  if (meta.seed !== undefined) params.set("seed", String(meta.seed));
  return `${BASE_URL}/${encoded}?${params.toString()}`;
}

export const PollinationsProvider: ImageProvider = {
  id: "pollinations",
  async generate(prompt: string, options?: GenerateImageOptions) {
    const meta = (options?.metadata ?? {}) as PollinationsMetadata;
    const url = buildUrl(prompt, meta);
    return { url, provider: "pollinations" };
  },
};
