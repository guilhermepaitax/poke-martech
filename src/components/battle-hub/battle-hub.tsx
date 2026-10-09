"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton, LoadingScreen, Skeleton } from "@/components/ui/skeleton";
import { useBattleDecks } from "@/hooks/use-battle-decks";
import { useBattleHub, useStartBattle } from "@/hooks/use-battle";
import { DIFFICULTY_LABELS } from "@/lib/value-objects/battle";
import { cn } from "@/lib/utils";
import { Layers, Swords } from "lucide-react";

function BattleHub() {
  const hub = useBattleHub();
  const decks = useBattleDecks();
  const start = useStartBattle();
  const router = useRouter();
  const [deckId, setDeckId] = useState<string>("");
  const [opponentId, setOpponentId] = useState<string>("");
  const selectedDeck = deckId || decks.data?.[0]?.id || "";
  const selectedOpponent = opponentId || hub.data?.opponents[0]?.id || "";

  if (hub.isLoading || decks.isLoading) {
    return (
      <LoadingScreen label="Carregando o ginásio" className="flex flex-col gap-6">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-56" />
          </div>
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="glass flex items-center gap-3 rounded-3xl p-3">
              <Skeleton className="size-14 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-6 w-24" />
        <ListSkeleton count={3} thumb="none" lines={1} />
        <Skeleton className="h-10 w-28 rounded-full" />
      </LoadingScreen>
    );
  }
  if (hub.isError) return <p className="text-destructive">Não foi possível carregar as batalhas.</p>;

  return (
    <div data-slot="battle-hub" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-accent-foreground">Ginásio</p>
          <h1 className="text-3xl font-semibold tracking-tight">Batalhas casuais</h1>
        </div>
        <Link href="/batalha/decks" className={buttonVariants({ variant: "outline" })}>
          Meus decks
        </Link>
      </div>
      {hub.data?.active ? (
        <Link
          href={`/batalha/${hub.data.active.id}`}
          className="glass flex items-center gap-4 rounded-3xl p-4"
        >
          <Swords className="size-8 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Batalha em andamento</span>
            <span className="block text-sm text-foreground-subtle">vs {hub.data.active.opponentName}</span>
          </span>
          <span className="text-sm font-semibold text-primary">Continuar</span>
        </Link>
      ) : null}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Escolha o adversário</h2>
        {hub.data?.opponents.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {hub.data.opponents.map((opponent) => (
              <li key={opponent.id}>
                <button
                  type="button"
                  data-selected={selectedOpponent === opponent.id ? "" : undefined}
                  onClick={() => setOpponentId(opponent.id)}
                  className={cn(
                    "glass flex w-full items-center gap-3 rounded-3xl p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedOpponent === opponent.id && "ring-2 ring-primary",
                  )}
                >
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-muted">
                    {opponent.avatarUrl ? (
                      <Image src={opponent.avatarUrl} alt="" fill className="object-cover" sizes="56px" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{opponent.name}</span>
                    <span className="block text-sm text-foreground-subtle">
                      {DIFFICULTY_LABELS[opponent.difficulty]} · {opponent.rewardCoins} moedas
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            placement="section"
            icon={Swords}
            title="Nenhum adversário no ginásio"
            description="Os treinadores ativos cadastrados no admin aparecem aqui para uma batalha casual."
          />
        )}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Seu deck</h2>
        {decks.data?.length ? (
          <ul className="flex flex-col gap-2">
            {decks.data.map((deck) => (
              <li key={deck.id}>
                <button
                  type="button"
                  data-selected={selectedDeck === deck.id ? "" : undefined}
                  onClick={() => setDeckId(deck.id)}
                  className={cn(
                    "glass flex w-full items-center justify-between rounded-3xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedDeck === deck.id && "ring-2 ring-primary",
                  )}
                >
                  <span className="font-semibold">{deck.name}</span>
                  <span className="text-sm text-foreground-subtle">{deck.cardCount} cartas</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            placement="section"
            icon={Layers}
            title="Nenhum deck pronto"
            description="Monte um deck de 20 cartas da sua coleção para começar uma batalha."
            action={
              <Link href="/batalha/decks/novo" className={buttonVariants()}>
                Novo deck
              </Link>
            }
          />
        )}
      </section>
      {start.error ? <p className="text-sm text-destructive">{start.error.message}</p> : null}
      <Button
        disabled={start.isPending || !selectedDeck || !selectedOpponent || Boolean(hub.data?.active)}
        onClick={() => {
          start.mutate(
            { deckId: selectedDeck, opponentId: selectedOpponent },
            { onSuccess: (result) => router.push(`/batalha/${result.battle.id}`) },
          );
        }}
      >
        Batalhar
      </Button>
    </div>
  );
}

export { BattleHub };
