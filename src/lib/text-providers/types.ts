/**
 * TextProvider layer — separate from ImageProvider.
 * All text generation MUST go through a TextProvider using POST + JSON body
 * (never GET) so prompts of arbitrary length travel safely in the request body.
 */

export interface GenerateTextOptions {
  prompt: string;
  model?: string;
  /** BYOP: caller-supplied API key. Optional so providers can fall back to env. */
  apiKey?: string;
  /** Optional system prompt. */
  system?: string;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
}

export interface GenerateTextResult {
  text: string;
  provider: string;
  model: string;
  raw?: unknown;
}

export interface TextProvider {
  readonly id: string;
  generateText(options: GenerateTextOptions): Promise<GenerateTextResult>;
}

export type ProviderErrorCode =
  | "missing_api_key"
  | "http_error"
  | "invalid_response"
  | "network_error"
  | "aborted"
  | "unknown";

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly status?: number;
  readonly provider: string;
  readonly cause?: unknown;

  constructor(opts: {
    code: ProviderErrorCode;
    message: string;
    provider: string;
    status?: number;
    cause?: unknown;
  }) {
    super(opts.message);
    this.name = "ProviderError";
    this.code = opts.code;
    this.status = opts.status;
    this.provider = opts.provider;
    this.cause = opts.cause;
  }
}
