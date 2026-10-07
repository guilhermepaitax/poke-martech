"use client";

import { HoloCard } from "@/components/holo-card/holo-card";
import { Button } from "@/components/ui/button";
import { pokemonTypeName, usePokemonTypes } from "@/hooks/use-pokemon-types";
import { RARITY_LABELS } from "@/lib/value-objects/card";
import type { OpeningCard } from "@/types/catalog";
import { openingCardView } from "./opening-card-view";

interface PackOpeningSummaryProps {
  cards: OpeningCard[];
  onSelect: (index: number) => void;
  onStoreAll: () => void;
}

function PackOpeningSummary({ cards, onSelect, onStoreAll }: PackOpeningSummaryProps) {
  const types = usePokemonTypes();

  return (
    <div data-slot="pack-opening-summary" className="flex w-full flex-col items-center gap-8">
      <div className="flex w-full flex-wrap justify-center gap-4">
        {cards.map((card, index) => (
          <button
            key={`${card.cardId}-${card.slot}`}
            type="button"
            className="card-deal w-[calc((100%-1rem)/2)] cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)]"
            style={{ animationDelay: `${index * 80}ms` }}
            onClick={() => onSelect(index)}
            aria-label={`Ampliar ${card.name}`}
          >
            <HoloCard {...openingCardView(card)} />
            <span className="mt-3 flex flex-col gap-0.5 text-sm">
              <span className="font-semibold">{card.name}</span>
              <span className="text-foreground-subtle">{pokemonTypeName(types.data, card.energyType)}</span>
              <span className="text-foreground-subtle">{RARITY_LABELS[card.rarity]}</span>
            </span>
          </button>
        ))}
      </div>
      <Button className="w-56" size="lg" onClick={onStoreAll}>
        Guardar todas
      </Button>
    </div>
  );
}

export { PackOpeningSummary };
