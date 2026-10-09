"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useCardGenerations } from "@/hooks/use-admin";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CardGenerationStatus } from "./card-generation-status";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function CardGenerationHistory() {
  const generations = useCardGenerations();

  return (
    <aside data-slot="card-generation-history" className="glass flex flex-col gap-3 rounded-3xl p-4 lg:sticky lg:top-28">
      <p className="font-semibold">Gerações recentes</p>
      {generations.isLoading ? (
        <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-2">
          <span className="sr-only">Carregando gerações</span>
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 px-2 py-2">
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {generations.isError ? <p className="text-sm text-destructive">Não foi possível carregar o histórico.</p> : null}
      {generations.data?.length === 0 ? (
        <EmptyState
          placement="section"
          icon={Sparkles}
          title="Nenhuma geração ainda"
          description="Envie uma foto para a IA criar um lote de cartas a partir dessa pessoa."
        />
      ) : null}
      <ul className="flex flex-col gap-2">
        {generations.data?.map((generation) => (
          <li key={generation.id}>
            <Link
              href={`/admin/cartas/gerar/${generation.id}`}
              className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-muted">
                <Image src={generation.personImageUrl} alt="" fill className="object-cover" sizes="40px" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{generation.personName}</span>
                <span className="block text-xs text-foreground-subtle">
                  {generation.doneCount}/{generation.requestedCount} cartas · {dateFormat.format(new Date(generation.createdAt))}
                </span>
              </span>
              <CardGenerationStatus status={generation.status} />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export { CardGenerationHistory };
