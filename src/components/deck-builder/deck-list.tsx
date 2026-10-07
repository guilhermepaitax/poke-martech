"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useBattleDecks } from "@/hooks/use-battle-decks";

function DeckList() {
  const decks = useBattleDecks();
  if (decks.isLoading) return <p className="text-foreground-subtle">Carregando decks...</p>;
  if (decks.isError) return <p className="text-destructive">Não foi possível carregar os decks.</p>;
  return (
    <div data-slot="deck-list" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Decks</h1>
        <Link href="/batalha/decks/novo" className={buttonVariants()}>Novo deck</Link>
      </div>
      {decks.data?.length ? (
        <ul className="flex flex-col gap-2">
          {decks.data.map((deck) => (
            <li key={deck.id}>
              <Link href={`/batalha/decks/${deck.id}`} className="glass flex items-center justify-between rounded-3xl px-4 py-3">
                <span className="font-semibold">{deck.name}</span>
                <span className="text-sm text-foreground-subtle">{deck.cardCount} cartas</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-foreground-subtle">Você ainda não montou um deck.</p>
      )}
    </div>
  );
}

export { DeckList };
