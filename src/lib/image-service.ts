import { getImageProvider } from "./image-providers";
import { saveGeneratedImage, type GeneratedImageDB } from "./invitations-service";

export interface GenerateAndSaveImageInput {
  projectId: string;
  promptId?: string | null;
  prompt: string;
  providerId?: string;
  /** Reserved for future providers (e.g. size, style, seed, BYOP keys). */
  metadata?: Record<string, unknown>;
}

export async function generateAndSaveImage(
  input: GenerateAndSaveImageInput,
): Promise<GeneratedImageDB> {
  const provider = getImageProvider(input.providerId);
  const { url, provider: providerName } = await provider.generate(input.prompt, {
    metadata: input.metadata,
  });
  const row = await saveGeneratedImage({
    projectId: input.projectId,
    promptId: input.promptId ?? null,
    url,
    provider: providerName,
  });
  return row;
}
