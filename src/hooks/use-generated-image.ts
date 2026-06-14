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
    if (!projectId) return;
    if (requestedRef.current.has(projectId)) return;
    requestedRef.current.add(projectId);

    let cancelled = false;
    setStatus("loading");
    generateAndSaveImage({ projectId, promptId, prompt, providerId, metadata })
      .then((row) => {
        if (cancelled) return;
        setImage(row);
        setStatus("ready");
      })
      .catch((err: unknown) => {
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
