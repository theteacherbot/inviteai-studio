import { useEffect, useRef, useState } from "react";
import { generateAndSaveImage } from "@/lib/image-service";
import type { GeneratedImageDB } from "@/lib/invitations-service";

type Status = "idle" | "loading" | "ready" | "error";

interface Args {
  projectId: string | null;
  promptId?: string | null;
  prompt: string;
  providerId?: string;
  metadata?: Record<string, unknown>;
}

export function useGeneratedImage({ projectId, promptId, prompt, providerId, metadata }: Args) {
  const [status, setStatus] = useState<Status>("idle");
  const [image, setImage] = useState<GeneratedImageDB | null>(null);
  const [error, setError] = useState<Error | null>(null);
  // Guard against duplicate inserts from StrictMode double-mount or remounts.
  // Tracks which projectIds have already been requested in this browser session.
  const requestedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    console.log("[useGeneratedImage] effect fired", { projectId, promptId, providerId, promptLen: prompt?.length });
    if (!projectId) {
      console.log("[useGeneratedImage] skip: no projectId");
      return;
    }
    if (requestedRef.current.has(projectId)) {
      console.log("[useGeneratedImage] skip: already requested", projectId);
      return;
    }
    requestedRef.current.add(projectId);

    let cancelled = false;
    setStatus("loading");
    console.log("[useGeneratedImage] calling generateAndSaveImage", { projectId, promptId });
    generateAndSaveImage({ projectId, promptId, prompt, providerId, metadata })
      .then((row) => {
        console.log("[useGeneratedImage] success", { cancelled, row });
        if (cancelled) return;
        setImage(row);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        console.error("[useGeneratedImage] generateAndSaveImage failed", err);
        if (cancelled) return;
        requestedRef.current.delete(projectId);
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return { status, image, error };
}
