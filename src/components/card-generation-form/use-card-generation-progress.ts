"use client";

import { errorDescription, useToast } from "@/components/ui/toaster";
import { useCardGeneration, useRetryCardGeneration } from "@/hooks/use-admin";

function useCardGenerationProgress(id: string) {
  const generation = useCardGeneration(id);
  const retry = useRetryCardGeneration(id);
  const { pushToast } = useToast();
  const detail = generation.data;
  const active = detail?.status === "pending" || detail?.status === "running";

  return {
    detail,
    active,
    isLoading: generation.isLoading,
    isMissing: generation.isError && !detail,
    retry: () =>
      retry.mutate(undefined, {
        onSuccess: () => pushToast({ tone: "success", title: "Geração reiniciada" }),
        onError: (error) => {
          pushToast({
            tone: "error",
            title: "Não foi possível tentar de novo",
            description: errorDescription(error),
          });
        },
      }),
    isRetrying: retry.isPending,
  };
}

export { useCardGenerationProgress };
