"use client";

import { RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useListLocation, useReturnTo } from "@/hooks/use-list-location";
import { withReturnTo } from "@/lib/return-path";
import { Button, buttonVariants } from "@/components/ui/button";
import { CardGridSkeleton, LoadingScreen, Skeleton } from "@/components/ui/skeleton";
import { CardGenerationItem } from "./card-generation-item";
import { CardGenerationStatus } from "./card-generation-status";
import { useCardGenerationProgress } from "./use-card-generation-progress";

function CardGenerationProgress({ generationId }: { generationId: string }) {
  const progress = useCardGenerationProgress(generationId);
  const here = useListLocation();
  const listHref = useReturnTo("/admin/cartas");
  if (progress.isLoading) {
    return (
      <LoadingScreen label="Carregando geração" className="flex flex-col gap-6">
        <div className="glass flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center">
          <Skeleton className="size-20 shrink-0 rounded-2xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <CardGridSkeleton count={4} />
      </LoadingScreen>
    );
  }
  if (progress.isMissing || !progress.detail) return <p className="text-destructive">Geração não encontrada.</p>;
  const detail = progress.detail;

  return (
    <div data-slot="card-generation-progress" className="flex flex-col gap-6">
      <div className="glass flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center">
        <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
          <Image src={detail.personImageUrl} alt={detail.personName} fill className="object-cover" sizes="80px" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{detail.personName}</h2>
            <CardGenerationStatus status={detail.status} />
          </div>
          <p className="text-sm text-foreground-subtle">{detail.personDescription}</p>
          <p className="text-sm text-foreground-subtle">
            {detail.doneCount} de {detail.requestedCount} cartas prontas
            {detail.failedCount > 0 ? ` · ${detail.failedCount} com falha` : ""}
          </p>
          {detail.error ? <p className="text-sm text-destructive">{detail.error}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {detail.canRetry ? (
            <Button type="button" variant="outline" onClick={progress.retry} disabled={progress.isRetrying}>
              <RotateCcw className="size-4" />
              Tentar novamente
            </Button>
          ) : null}
          <Link href={withReturnTo("/admin/cartas/gerar", listHref)} className={buttonVariants({ variant: "outline" })}>
            Nova geração
          </Link>
        </div>
      </div>
      {progress.active ? (
        <p className="text-sm text-foreground-subtle">
          A IA está criando as cartas. Isso pode levar alguns minutos; você pode sair desta página.
        </p>
      ) : null}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {detail.items.map((item) => (
          <CardGenerationItem key={item.id} item={item} active={progress.active} returnTo={here} />
        ))}
      </ul>
      {detail.doneCount > 0 ? (
        <p className="text-sm text-foreground-subtle">
          As cartas foram salvas como rascunho. Revise cada uma e publique quando estiver pronta.
        </p>
      ) : null}
    </div>
  );
}

export { CardGenerationProgress };
