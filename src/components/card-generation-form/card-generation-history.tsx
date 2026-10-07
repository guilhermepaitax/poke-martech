"use client";

import Image from "next/image";
import Link from "next/link";
import { useCardGenerations } from "@/hooks/use-admin";
import { CardGenerationStatus } from "./card-generation-status";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function CardGenerationHistory() {
  const generations = useCardGenerations();

  return (
    <aside data-slot="card-generation-history" className="glass flex flex-col gap-3 rounded-3xl p-4 lg:sticky lg:top-28">
      <p className="font-semibold">Gerações recentes</p>
      {generations.isLoading ? <p className="text-sm text-foreground-subtle">Carregando...</p> : null}
      {generations.isError ? <p className="text-sm text-destructive">Não foi possível carregar o histórico.</p> : null}
      {generations.data?.length === 0 ? <p className="text-sm text-foreground-subtle">Nenhuma geração ainda.</p> : null}
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
