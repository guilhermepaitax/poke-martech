"use client";

import { HoloCard } from "@/components/holo-card/holo-card";
import { cn } from "@/lib/utils";
import type { CardFace } from "@/types/catalog";

function BattleHand({
  cards,
  selectedUid,
  onSelect,
}: {
  cards: (CardFace & { uid: string; cardId: string })[];
  selectedUid?: string;
  onSelect: (uid: string) => void;
}) {
  return (
    <ul data-slot="battle-hand" className="flex items-end justify-center px-8">
      {cards.map((card, index) => {
        const offset = index - (cards.length - 1) / 2;
        return (
          <li
            key={card.uid}
            className="relative -ml-10 first:ml-0"
            style={{ transform: `translateY(${Math.abs(offset) * 6}px) rotate(${offset * 4}deg)` }}
          >
            <button
              type="button"
              data-selected={selectedUid === card.uid ? "" : undefined}
              onClick={() => onSelect(card.uid)}
              className={cn(
                "block w-[4.6rem] rounded-[10%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-20",
                selectedUid === card.uid && "-translate-y-4 ring-2 ring-primary",
              )}
            >
              <HoloCard {...card} effects={false} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export { BattleHand };
