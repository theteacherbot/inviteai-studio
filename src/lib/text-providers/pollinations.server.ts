/**
 * Pollinations text provider — OpenAI-compatible POST endpoint.
 *
 * IMPORTANT: text generation is ALWAYS POST with a JSON body so prompts
 * (including >5000 chars) are never truncated by URL length limits.
 *
 * Endpoint: https://gen.pollinations.ai/v1/chat/completions
 */

import {
  ProviderError,
  type GenerateTextOptions,
  type GenerateTextResult,
  type TextProvider,
} from "./types";

const ENDPOINT = "https://gen.pollinations.ai/v1/chat/completions";
const DEFAULT_MODEL = "openai";
const PROVIDER_ID = "pollinations";

export const PollinationsTextProvider: TextProvider = {
  id: PROVIDER_ID,

  async generateText(opts: GenerateTextOptions): Promise<GenerateTextResult> {
    const apiKey = opts.apiKey ?? process.env.POLLINATIONS_API_KEY;
    if (!apiKey) {
      throw new ProviderError({
        code: "missing_api_key",
        message: "Pollinations text provider requires an API key (apiKey or POLLINATIONS_API_KEY).",
        provider: PROVIDER_ID,
      });
    }

    const model = opts.model ?? DEFAULT_MODEL;

    const messages: Array<{ role: "system" | "user"; content: string }> = [];
    if (opts.system) messages.push({ role: "system", content: opts.system });
    messages.push({ role: "user", content: opts.prompt });

    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages }),
        signal: opts.signal,
      });
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") {
        throw new ProviderError({
          code: "aborted",
          message: "Text generation aborted.",
          provider: PROVIDER_ID,
          cause: err,
        });
      }
      throw new ProviderError({
        code: "network_error",
        message: "Network error contacting Pollinations text endpoint.",
        provider: PROVIDER_ID,
        cause: err,
      });
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new ProviderError({
        code: "http_error",
        message: `Pollinations text endpoint returned ${response.status}: ${body.slice(0, 500)}`,
        provider: PROVIDER_ID,
        status: response.status,
      });
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch (err) {
      throw new ProviderError({
        code: "invalid_response",
        message: "Pollinations response was not valid JSON.",
        provider: PROVIDER_ID,
        cause: err,
      });
    }

    const text = extractText(json);
    if (!text) {
      throw new ProviderError({
        code: "invalid_response",
        message: "Pollinations response did not contain choices[0].message.content.",
        provider: PROVIDER_ID,
      });
    }

    return { text, provider: PROVIDER_ID, model, raw: json };
  },
};

function extractText(json: unknown): string | null {
  const choices = (json as { choices?: Array<{ message?: { content?: unknown } }> })?.choices;
  const content = choices?.[0]?.message?.content;
  return typeof content === "string" ? content : null;
}
