import type { GenerateImageOptions, ImageProvider } from "./types";

/**
 * Pollinations.ai image provider.
 * Docs: https://image.pollinations.ai
 *
 * The endpoint returns the image bytes directly from the URL, so the URL
 * itself is the persistable artifact. We perform a lightweight validation
 * fetch to surface rate-limits / server errors as a thrown error, which
 * the hook layer (`useGeneratedImage`) turns into the "error" UI state
 * and allows a retry on remount.
 */

const BASE_URL = "https://image.pollinations.ai/prompt";

interface PollinationsMetadata {
  width?: number;
  height?: number;
  seed?: number | string;
  model?: string;
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
  if (meta.enhance) params.set("enhance", "true");
  if (meta.seed !== undefined) params.set("seed", String(meta.seed));
  return `${BASE_URL}/${encoded}?${params.toString()}`;
}

export const PollinationsProvider: ImageProvider = {
  id: "pollinations",
  async generate(prompt: string, options?: GenerateImageOptions) {
    const meta = (options?.metadata ?? {}) as PollinationsMetadata;
    const url = buildUrl(prompt, meta);

    // Validate availability (rate-limits return 429, server errors return 5xx).
    // Pollinations serves images with permissive CORS so this works in-browser.
    let res: Response;
    try {
      res = await fetch(url, { method: "GET", mode: "cors" });
    } catch (err) {
      console.error("[pollinations] network error", err);
      throw new Error(
        `Pollinations no está disponible (network): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    if (!res.ok) {
      const reason =
        res.status === 429
          ? "rate limit alcanzado"
          : `error ${res.status} ${res.statusText}`;
      console.error("[pollinations] generation failed", { url, status: res.status });
      throw new Error(`Pollinations falló: ${reason}`);
    }

    return { url, provider: "pollinations" };
  },
};
