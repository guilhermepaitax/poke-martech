"use client";

import { useCardGeneration, useRetryCardGeneration } from "@/hooks/use-admin";

function useCardGenerationProgress(id: string) {
  const generation = useCardGeneration(id);
  const retry = useRetryCardGeneration(id);
  const detail = generation.data;
  const active = detail?.status === "pending" || detail?.status === "running";

  return {
    detail,
    active,
    isLoading: generation.isLoading,
    isMissing: generation.isError && !detail,
    retry: () => retry.mutate(),
    isRetrying: retry.isPending,
    retryError: retry.error,
  };
}

export { useCardGenerationProgress };
