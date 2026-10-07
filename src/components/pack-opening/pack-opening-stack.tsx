"use client";

import { HoloCard } from "@/components/holo-card/holo-card";
import { Button } from "@/components/ui/button";
import { pokemonTypeName, usePokemonTypes } from "@/hooks/use-pokemon-types";
import { RARITY_LABELS, RARITY_RANK } from "@/lib/value-objects/card";
import type { OpeningCard } from "@/types/catalog";
import type { AnimationEvent, CSSProperties, RefObject } from "react";
import { openingCardView } from "./opening-card-view";

const STACK_SIZE = 4;

interface PackOpeningStackProps {
  cards: OpeningCard[];
  current: number;
  sending: boolean;
  topCardRef: RefObject<HTMLDivElement | null>;
  onPass: () => void;
  onSendEnd: (event: AnimationEvent<HTMLDivElement>) => void;
}

function PackOpeningStack({ cards, current, sending, topCardRef, onPass, onSendEnd }: PackOpeningStackProps) {
  const types = usePokemonTypes();
  const top = cards[current];
  const visible = cards.slice(current, current + STACK_SIZE);
  const lastIndex = cards.length - 1;

  return (
    <div data-slot="pack-opening-stack" className="flex w-full flex-col items-center gap-6">
      <div className="relative aspect-63/88 w-[min(22rem,calc(100%-2rem),calc((100dvh-22rem)*63/88))]">
        {visible
          .map((card, offset) => {
            const index = current + offset;
            const isTop = offset === 0;
            const depth = isTop ? 0 : offset - (sending ? 1 : 0);
            const flourish = isTop && index === lastIndex && RARITY_RANK[card.rarity] >= RARITY_RANK.super_rare;
            return (
              <div
                key={`${card.cardId}-${card.slot}`}
                ref={isTop ? topCardRef : undefined}
                className="card-stack-item absolute inset-0"
                style={{ "--depth": depth } as CSSProperties}
                data-top={isTop ? "" : undefined}
                data-sending={isTop && sending ? "" : undefined}
                data-hidden={depth >= STACK_SIZE - 1 ? "" : undefined}
                aria-hidden={isTop ? undefined : true}
                onAnimationEnd={isTop ? onSendEnd : undefined}
              >
                <HoloCard {...openingCardView(card)} effects={isTop} flourish={flourish} />
              </div>
            );
          })
          .reverse()}
      </div>
      {top ? (
        <div className="flex flex-col items-center gap-0.5 text-center text-sm">
          <span className="text-base font-semibold">{top.name}</span>
          <span className="text-foreground-subtle">
            {pokemonTypeName(types.data, top.energyType)} · {RARITY_LABELS[top.rarity]}
          </span>
        </div>
      ) : null}
      <Button className="w-56" size="lg" onClick={onPass} disabled={sending}>
        Passar
      </Button>
    </div>
  );
}

export { PackOpeningStack };
