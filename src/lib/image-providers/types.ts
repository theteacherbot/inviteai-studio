export interface GenerateImageResult {
  url: string;
  provider: string;
}

export interface GenerateImageOptions {
  metadata?: Record<string, unknown>;
}

export interface ImageProvider {
  id: string;
  generate(prompt: string, options?: GenerateImageOptions): Promise<GenerateImageResult>;
}
