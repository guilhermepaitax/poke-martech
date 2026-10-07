"use client";

import { Button } from "@/components/ui/button";
import { useCaptureException } from "./use-capture-exception";

function AppErrorFallback({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useCaptureException(error);

  return (
    <main
      data-slot="app-error"
      className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-4 px-6"
    >
      <h1 className="text-2xl font-semibold tracking-tight">Algo deu errado</h1>
      <p className="text-foreground-subtle">
        Não foi possível concluir esta ação. O erro já foi registrado.
      </p>
      {error.digest ? (
        <p className="text-sm text-muted-foreground">Código: {error.digest}</p>
      ) : null}
      <Button className="w-fit" onClick={() => retry()}>
        Tentar de novo
      </Button>
    </main>
  );
}

export { AppErrorFallback };
