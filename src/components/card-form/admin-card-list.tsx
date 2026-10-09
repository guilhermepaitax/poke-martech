"use client";

import Link from "next/link";
import Image from "next/image";
import { Layers, Search, Sparkles } from "lucide-react";
import { pokemonTypeName } from "@/hooks/use-pokemon-types";
import { formatCardNumber } from "@/lib/card-number";
import { RARITY_LABELS } from "@/lib/value-objects/card";
import { useFeatureFlag } from "@/components/feature-flags/use-feature-flags";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ListSkeleton, LoadingScreen, Skeleton } from "@/components/ui/skeleton";
import { useListLocation } from "@/hooks/use-list-location";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { withReturnTo } from "@/lib/return-path";
import { cn } from "@/lib/utils";
import { AdminCardFilters } from "./admin-card-filters";
import { useAdminCardList } from "./use-admin-card-list";

function AdminCardList() {
  const list = useAdminCardList();
  const here = useListLocation();
  const aiGenerationEnabled = useFeatureFlag(FEATURE_FLAGS.aiCardGeneration);
  if (list.cards.isLoading) {
    return (
      <LoadingScreen label="Carregando cartas" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        <ListSkeleton count={6} />
      </LoadingScreen>
    );
  }
  if (list.cards.isError) return <p className="text-destructive">Não foi possível carregar as cartas.</p>;
  const catalog = list.cards.data ?? [];
  return (
    <div
      data-slot="admin-card-list"
      className={cn(
        "flex flex-col gap-4",
        catalog.length === 0 && "min-h-[calc(100dvh-16rem)] md:min-h-[calc(100dvh-13rem)]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Cartas</h1>
        <div className="flex flex-wrap gap-2">
          {aiGenerationEnabled ? (
            <Link href={withReturnTo("/admin/cartas/gerar", here)} className={buttonVariants({ variant: "outline" })}>
              <Sparkles className="size-4" />
              Gerar com IA
            </Link>
          ) : null}
          <Link href={withReturnTo("/admin/cartas/nova", here)} className={buttonVariants()}>Nova carta</Link>
        </div>
      </div>
      {catalog.length ? (
        <AdminCardFilters
          filters={list.filters}
          typeOptions={list.typeOptions}
          rarityOptions={list.rarityOptions}
          hasActiveFilters={list.hasActiveFilters}
          onNameChange={list.setName}
          onStatusChange={list.setStatus}
          onEnergyTypeChange={list.setEnergyType}
          onRarityChange={list.setRarity}
          onClear={list.clearFilters}
        />
      ) : null}
      {catalog.length ? <p className="text-sm text-foreground-subtle">{list.countLabel}</p> : null}
      {list.filtered.length ? (
        <ul className="flex flex-col gap-2">
          {list.pageItems.map((card) => (
            <li key={card.id}>
              <Link href={withReturnTo(`/admin/cartas/${card.id}`, here)} className="glass flex items-center gap-3 rounded-3xl px-3 py-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
                  {card.imageUrl ? <Image src={card.imageUrl} alt="" fill className="object-cover" sizes="56px" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">
                    <span className="mr-2 tabular-nums text-foreground-subtle">{formatCardNumber(card.number)}</span>
                    {card.name}
                  </span>
                  <span className="block text-sm text-foreground-subtle">{pokemonTypeName(list.types.data, card.energyType)}</span>
                  <span className="block text-sm text-foreground-subtle">{RARITY_LABELS[card.rarity]}</span>
                </span>
                <span className="text-sm text-foreground-subtle">{card.published ? "Publicada" : "Rascunho"}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : catalog.length ? (
        <EmptyState
          placement="section"
          icon={Search}
          title="Nenhuma carta com esses filtros"
          description="Limpe a busca ou escolha outro tipo, raridade ou status."
        />
      ) : (
        <EmptyState
          placement="fill"
          icon={Layers}
          title="Nenhuma carta cadastrada"
          description="Crie a primeira carta do catálogo para ela aparecer na loja e na Pokédex."
          action={
            <Link href={withReturnTo("/admin/cartas/nova", here)} className={buttonVariants()}>
              Nova carta
            </Link>
          }
        />
      )}
      <Pagination page={list.page} pageCount={list.pageCount} onPageChange={list.setPage} />
    </div>
  );
}

export { AdminCardList };
