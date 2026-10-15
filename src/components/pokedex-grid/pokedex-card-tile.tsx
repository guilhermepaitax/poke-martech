"use client";

import { HoloCard } from "@/components/holo-card/holo-card";
import { Button } from "@/components/ui/button";
import { formatCardNumber } from "@/lib/card-number";
import { cn } from "@/lib/utils";
import type { CardFace } from "@/types/catalog";
import Link from "next/link";

function PokedexCardTile({
  href,
  card,
  number,
  ownedCount,
  missing,
  onZoom,
}: {
  href: string;
  card: CardFace;
  number: number;
  ownedCount: number;
  missing: boolean;
  onZoom: () => void;
}) {
  return (
    <div data-slot="pokedex-card-tile" className="flex flex-col gap-2">
      <div className="group/card relative">
        <Link
          href={href}
          className="block rounded-[4%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className={cn(missing && "opacity-20 grayscale")}>
            <HoloCard {...card} />
          </div>
        </Link>
        <Button
          size="sm"
          variant="outline"
          aria-label={`Ampliar ${card.name}`}
          onClick={onZoom}
          className={cn(
            "absolute inset-x-3 bottom-4 z-10 bg-white/85 shadow-sm transition-opacity",
            "pointer-events-none opacity-0",
            "group-hover/card:pointer-events-auto group-hover/card:opacity-100",
            "group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100",
            "[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100",
          )}
        >
          Ampliar
        </Button>
      </div>
      <Link
        href={href}
        tabIndex={-1}
        className="flex flex-col gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <p className="text-center text-sm font-semibold tabular-nums text-foreground-subtle">
          {formatCardNumber(number)}
        </p>
        <p className="text-center text-sm text-foreground-subtle">
          {ownedCount} {ownedCount === 1 ? "cópia" : "cópias"}
        </p>
      </Link>
    </div>
  );
}

export { PokedexCardTile };
