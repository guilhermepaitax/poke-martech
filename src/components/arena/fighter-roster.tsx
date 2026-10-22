"use client";

import type { ArenaFighter } from "@/lib/arena/fighter";
import type { ArenaSide } from "@/lib/arena/selection";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

import { fighterAppearance } from "./fighter-appearance";
import { FighterPortrait } from "./fighter-portrait";

const SIDE_LABEL: Record<ArenaSide, string> = {
  player: "Você",
  opponent: "CPU",
};

function energyStyle(fighter: ArenaFighter | null) {
  if (!fighter) return undefined;
  return { "--energy": fighterAppearance(fighter.energy).color } as CSSProperties;
}

function ArenaSideSlot({
  side,
  fighter,
  active,
  onActivate,
}: {
  side: ArenaSide;
  fighter: ArenaFighter | null;
  active: boolean;
  onActivate: () => void;
}) {
  const label = SIDE_LABEL[side];

  return (
    <button
      type="button"
      data-slot="arena-side-slot"
      data-side={side}
      data-active={active ? "" : undefined}
      aria-pressed={active}
      aria-label={fighter ? `${label}: ${fighter.name}` : `Escolher ${label}`}
      onClick={onActivate}
      style={energyStyle(fighter)}
      className={cn(
        "arena-side-slot flex min-w-0 flex-1 items-center gap-2.5 p-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--picker-cta)",
        side === "opponent" && "flex-row-reverse text-right",
      )}
    >
      <span className="size-9 shrink-0 bg-(--picker-line) max-[420px]:hidden">
        {fighter ? <FighterPortrait fighter={fighter} className="block size-full" /> : null}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[10px] font-semibold tracking-widest text-(--picker-ink-subtle) uppercase">
          {label}
        </span>
        <span className="truncate font-arena-title text-[11px] leading-tight uppercase">
          {fighter?.name ?? "Escolher"}
        </span>
      </span>
    </button>
  );
}

function ArenaMatchupSlots({
  player,
  opponent,
  active,
  onActivate,
}: {
  player: ArenaFighter | null;
  opponent: ArenaFighter | null;
  active: ArenaSide;
  onActivate: (side: ArenaSide) => void;
}) {
  return (
    <div data-slot="arena-matchup-slots" className="flex items-center gap-2">
      <ArenaSideSlot
        side="player"
        fighter={player}
        active={active === "player"}
        onActivate={() => onActivate("player")}
      />
      <span aria-hidden className="font-arena-title text-lg text-(--picker-cta)">
        VS
      </span>
      <ArenaSideSlot
        side="opponent"
        fighter={opponent}
        active={active === "opponent"}
        onActivate={() => onActivate("opponent")}
      />
    </div>
  );
}

function FighterRoster({
  fighters,
  player,
  opponent,
  active,
  onChoose,
}: {
  fighters: readonly ArenaFighter[];
  player: ArenaFighter | null;
  opponent: ArenaFighter | null;
  active: ArenaSide;
  onChoose: (id: string) => void;
}) {
  return (
    <ul data-slot="fighter-roster" className="grid grid-cols-4 gap-2.5">
      {fighters.map((fighter) => {
        const sides: ArenaSide[] = [];
        if (fighter.id === player?.id) sides.push("player");
        if (fighter.id === opponent?.id) sides.push("opponent");
        const current = sides.includes(active);
        const appearance = fighterAppearance(fighter.energy);

        return (
          <li key={fighter.id}>
            <button
              type="button"
              data-slot="fighter-tile"
              data-current={current ? "" : undefined}
              aria-pressed={current}
              aria-label={`${fighter.name}, ${appearance.label}`}
              onClick={() => onChoose(fighter.id)}
              style={energyStyle(fighter)}
              className="arena-roster-tile group relative block aspect-square w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--picker-cta)"
            >
              <FighterPortrait
                fighter={fighter}
                className="absolute inset-0 transition-transform duration-300 group-hover:scale-110"
              />
              <span className="absolute inset-x-1 top-1 flex justify-end gap-1">
                {sides.map((side) => (
                  <span
                    key={side}
                    data-side={side}
                    className="arena-roster-badge px-1 font-arena-title text-[10px] leading-4 uppercase"
                  >
                    {side === "player" ? "P1" : "CPU"}
                  </span>
                ))}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export { ArenaMatchupSlots, FighterRoster };
