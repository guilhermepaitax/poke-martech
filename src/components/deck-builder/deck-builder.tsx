"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { EnergyChip } from "@/components/ui/energy-chip";
import { Input } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePokedex } from "@/hooks/use-pokedex";
import { useBattleDeck, useDeleteDeck, useSaveDeck } from "@/hooks/use-battle-decks";
import { DECK_SIZE, deriveEnergyTypes, MAX_COPIES, MAX_ENERGY_TYPES, validateDeck } from "@/lib/battle/deck-rules";
import { cn } from "@/lib/utils";
import type { EnergyType } from "@/lib/value-objects/card";
import type { DeckCardInput } from "@/types/battle";

function DeckBuilder({ deckId }: { deckId?: string }) {
  const router = useRouter();
  const pokedex = usePokedex();
  const existing = useBattleDeck(deckId ?? "");
  const save = useSaveDeck(deckId);
  const remove = useDeleteDeck();
  const [name, setName] = useState<string | null>(null);
  const [cards, setCards] = useState<DeckCardInput[] | null>(null);
  const [energyTypes, setEnergyTypes] = useState<EnergyType[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const owned = (pokedex.data ?? []).filter((entry) => entry.ownedCount > 0 && entry.card);
  const selected = cards ?? existing.data?.cards.map((item) => ({ cardId: item.cardId, copies: item.copies })) ?? [];
  const deckName = name ?? existing.data?.name ?? "Meu deck";
  const copies = new Map(selected.map((item) => [item.cardId, item.copies]));
  const total = selected.reduce((sum, item) => sum + item.copies, 0);
  const entries = selected.flatMap((item) => {
    const ownedCard = owned.find((entry) => entry.id === item.cardId);
    if (!ownedCard?.card) return [];
    return [
      {
        cardId: item.cardId,
        name: ownedCard.card.name,
        stage: ownedCard.card.stage,
        energyType: ownedCard.card.energyType,
        copies: item.copies,
        owned: ownedCard.ownedCount,
      },
    ];
  });
  const availableEnergy = deriveEnergyTypes(entries);
  const chosenEnergy = energyTypes ?? existing.data?.energyTypes ?? availableEnergy;
  const errors = validateDeck(entries, chosenEnergy);

  function setCopies(cardId: string, nextCopies: number, ownedCount: number) {
    setCards((current) => {
      const base = current ?? selected;
      const others = base.filter((item) => item.cardId !== cardId);
      const copiesCount = Math.min(MAX_COPIES, ownedCount, Math.max(0, nextCopies));
      return copiesCount < 1 ? others : [...others, { cardId, copies: copiesCount }];
    });
  }

  if (pokedex.isLoading || (deckId && existing.isLoading)) {
    return <p className="text-foreground-subtle">Carregando deck...</p>;
  }
  if (deckId && existing.isError) return <p className="text-destructive">Deck não encontrado.</p>;

  return (
    <div data-slot="deck-builder" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input aria-label="Nome do deck" value={deckName} onChange={(event) => setName(event.target.value)} />
          <p className="text-sm text-foreground-subtle">{total} / {DECK_SIZE} cartas</p>
        </div>
        <Link href="/batalha" className={buttonVariants({ variant: "outline" })}>
          Voltar
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableEnergy.map((energy) => (
          <EnergyChip
            key={energy}
            energy={energy}
            selected={chosenEnergy.includes(energy)}
            onClick={() => {
              const on = chosenEnergy.includes(energy);
              const next = on
                ? chosenEnergy.filter((item) => item !== energy)
                : [...chosenEnergy, energy].slice(0, MAX_ENERGY_TYPES);
              setEnergyTypes(next);
            }}
          />
        ))}
      </div>
      {errors.length > 0 ? <p className="text-sm text-destructive">{errors[0]}</p> : null}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {owned.map((entry) => {
          const count = copies.get(entry.id) ?? 0;
          return (
            <li
              key={entry.id}
              data-selected={count > 0 ? "" : undefined}
              className={cn("flex flex-col gap-2 rounded-3xl border border-white/70 bg-white/40 p-2", count > 0 && "ring-2 ring-primary")}
            >
              <button
                type="button"
                onClick={() => setCopies(entry.id, count > 0 ? 0 : 1, entry.ownedCount)}
                className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="relative block aspect-[63/88] overflow-hidden rounded-2xl bg-muted">
                  {entry.card?.imageUrl ? (
                    <Image src={entry.card.imageUrl} alt="" fill className="object-cover" sizes="160px" />
                  ) : null}
                </span>
                <span className="mt-2 block text-sm font-semibold">{entry.card?.name}</span>
                <span className="text-xs text-foreground-subtle">Você tem {entry.ownedCount}</span>
              </button>
              {count > 0 ? (
                <Stepper
                  ariaLabel={`Cópias de ${entry.card?.name ?? "carta"}`}
                  value={count}
                  min={1}
                  max={Math.min(MAX_COPIES, entry.ownedCount)}
                  onValueChange={(value) => setCopies(entry.id, value, entry.ownedCount)}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
      {save.error ? <p className="text-sm text-destructive">{save.error.message}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={save.isPending || errors.length > 0}
          onClick={() => {
            save.mutate(
              { name: deckName, energyTypes: chosenEnergy, cards: selected },
              { onSuccess: (result) => router.push(`/batalha/decks/${result.id}`) },
            );
          }}
        >
          Salvar deck
        </Button>
        {deckId ? (
          <ConfirmDialog
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            title="Excluir deck"
            description="Essa ação não pode ser desfeita."
            confirmLabel="Excluir"
            pending={remove.isPending}
            onConfirm={() => {
              remove.mutate(deckId, { onSuccess: () => router.push("/batalha/decks") });
            }}
          >
            <Button variant="outline" onClick={() => setConfirmDelete(true)}>
              Excluir
            </Button>
          </ConfirmDialog>
        ) : null}
      </div>
    </div>
  );
}

export { DeckBuilder };
