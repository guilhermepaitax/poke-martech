"use client";

import { HoloCard } from "@/components/holo-card/holo-card";
import { useHoloTilt } from "@/components/holo-card/use-holo-tilt";
import { Button } from "@/components/ui/button";
import { pokemonTypeName, usePokemonTypes } from "@/hooks/use-pokemon-types";
import { energyStyle } from "@/lib/type-appearance";
import { RARITY_LABELS, RARITY_RANK } from "@/lib/value-objects/card";
import type { OpeningCard } from "@/types/catalog";
import type { AnimationEvent, CSSProperties, RefObject } from "react";
import { openingCardView } from "./opening-card-view";
import { useStackDrag } from "./use-stack-drag";

const STACK_SIZE = 5;

const TOP_CARD_EFFECTS = {
  tilt: false,
  holo: true,
  popOut: false,
  borderShine: true,
} as const;

interface PackOpeningStackProps {
  cards: OpeningCard[];
  current: number;
  sending: boolean;
  topCardRef: RefObject<HTMLDivElement | null>;
  onPass: () => void;
  onSendEnd: (event: AnimationEvent<HTMLDivElement>) => void;
}

function PackOpeningStack({
  cards,
  current,
  sending,
  topCardRef,
  onPass,
  onSendEnd,
}: PackOpeningStackProps) {
  const types = usePokemonTypes();
  const tiltRef = useHoloTilt();
  const drag = useStackDrag(onPass, !sending);
  const top = cards[current];
  const visible = cards.slice(current, current + STACK_SIZE);

  return (
    <div
      data-slot="pack-opening-stack"
      className="flex w-full flex-col items-center gap-6"
    >
      <div
        ref={tiltRef}
        className="perspective-[1200px] w-[min(22rem,calc(100%-2rem),calc((100dvh-22rem)*63/88))]"
        style={top ? energyStyle(top.energyType) : undefined}
      >
        <div className="pack-opening-deck relative aspect-63/88 w-full">
          {visible
            .map((card, offset) => {
              const isTop = offset === 0;
              const depth = isTop ? 0 : offset - (sending ? 1 : 0);
              const spread = depth === 0 ? 0 : depth % 2 === 1 ? -8 : 8;
              const flourish =
                isTop && RARITY_RANK[card.rarity] >= RARITY_RANK.super_rare;
              return (
                <div
                  key={`${card.cardId}-${card.slot}`}
                  ref={isTop ? topCardRef : undefined}
                  className="card-stack-item absolute inset-0"
                  style={
                    {
                      "--depth": depth,
                      "--spread": `${spread}px`,
                    } as CSSProperties
                  }
                  data-top={isTop ? "" : undefined}
                  data-sending={isTop && sending ? "" : undefined}
                  data-hidden={depth >= STACK_SIZE - 1 ? "" : undefined}
                  aria-hidden={isTop ? undefined : true}
                  onAnimationEnd={isTop ? onSendEnd : undefined}
                  onPointerDown={isTop ? drag.onPointerDown : undefined}
                  onPointerMove={isTop ? drag.onPointerMove : undefined}
                  onPointerUp={isTop ? drag.onPointerUp : undefined}
                  onPointerCancel={isTop ? drag.onPointerCancel : undefined}
                  onDragStart={isTop ? drag.onDragStart : undefined}
                >
                  <HoloCard
                    {...openingCardView(card)}
                    effects={isTop ? TOP_CARD_EFFECTS : false}
                    flourish={flourish}
                  />
                </div>
              );
            })
            .reverse()}
        </div>
      </div>
      {top ? (
        <div className="flex flex-col items-center gap-0.5 text-center text-sm">
          <span className="text-base font-semibold">{top.name}</span>
          <div className="flex items-center gap-1">
            <span className="text-foreground-subtle">
              {pokemonTypeName(types.data, top.energyType)}
            </span>
            <span className="text-foreground-subtle">•</span>
            <span className="text-foreground-subtle">
              {RARITY_LABELS[top.rarity]}
            </span>
          </div>
        </div>
      ) : null}
      <p
        id="pack-opening-pass-hint"
        className={
          drag.armed ? "text-sm font-medium" : "text-sm text-foreground-subtle"
        }
      >
        {drag.armed ? "Solte para passar" : "Segure e arraste para passar"}
      </p>
      <Button
        className="w-56"
        size="lg"
        onClick={onPass}
        disabled={sending}
        aria-describedby="pack-opening-pass-hint"
      >
        Passar
      </Button>
    </div>
  );
}

export { PackOpeningStack };
