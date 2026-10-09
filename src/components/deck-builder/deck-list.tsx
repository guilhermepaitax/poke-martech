"use client";

import Link from "next/link";
import { Layers } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, screenColumnClass } from "@/components/ui/empty-state";
import { ListSkeleton, LoadingScreen, Skeleton } from "@/components/ui/skeleton";
import { useBattleDecks } from "@/hooks/use-battle-decks";
import { useListLocation } from "@/hooks/use-list-location";
import { withReturnTo } from "@/lib/return-path";
import { cn } from "@/lib/utils";

function DeckList() {
  const decks = useBattleDecks();
  const here = useListLocation();
  if (decks.isLoading) {
    return (
      <LoadingScreen label="Carregando decks" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
        <ListSkeleton count={4} thumb="none" lines={1} />
      </LoadingScreen>
    );
  }
  if (decks.isError) return <p className="text-destructive">Não foi possível carregar os decks.</p>;
  const items = decks.data ?? [];
  return (
    <div data-slot="deck-list" className={cn("flex flex-col gap-4", items.length === 0 && screenColumnClass)}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Decks</h1>
        <Link href={withReturnTo("/batalha/decks/novo", here)} className={buttonVariants()}>Novo deck</Link>
      </div>
      {items.length ? (
        <ul className="flex flex-col gap-2">
          {items.map((deck) => (
            <li key={deck.id}>
              <Link href={withReturnTo(`/batalha/decks/${deck.id}`, here)} className="glass flex items-center justify-between rounded-3xl px-4 py-3">
                <span className="font-semibold">{deck.name}</span>
                <span className="text-sm text-foreground-subtle">{deck.cardCount} cartas</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          placement="fill"
          icon={Layers}
          title="Nenhum deck montado"
          description="Junte 20 cartas da sua coleção para desafiar os treinadores do ginásio."
          action={
            <Link href={withReturnTo("/batalha/decks/novo", here)} className={buttonVariants()}>
              Novo deck
            </Link>
          }
        />
      )}
    </div>
  );
}

export { DeckList };
