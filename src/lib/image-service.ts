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
  console.log("[generateAndSaveImage] input", {
    projectId: input.projectId,
    promptId: input.promptId,
    providerId: input.providerId,
    promptPreview: input.prompt?.slice(0, 80),
  });
  const provider = getImageProvider(input.providerId);
  console.log("[generateAndSaveImage] resolved provider", provider?.id);
  const { url, provider: providerName } = await provider.generate(input.prompt, {
    metadata: input.metadata,
  });
  console.log("[generateAndSaveImage] provider returned", { url, providerName });
  const row = await saveGeneratedImage({
    projectId: input.projectId,
    promptId: input.promptId ?? null,
    url,
    provider: providerName,
  });
  console.log("[generateAndSaveImage] saved row", row);
  return row;
}
