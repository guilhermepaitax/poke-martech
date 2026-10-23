"use client";

import type { ArenaFighter } from "@/lib/arena/fighter";
import { RANDOM_FIGHTER_ID, type ArenaSide } from "@/lib/arena/selection";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

import { fighterAppearance } from "./fighter-appearance";
import { FighterPortrait } from "./fighter-portrait";
import { RANDOM_FIGHTER } from "./random-fighter";

const SIDE_LABEL: Record<ArenaSide, string> = {
  player: "Você",
  opponent: "CPU",
};

function energyStyle(fighter: ArenaFighter | null, random = false) {
  if (random) return { "--energy": RANDOM_FIGHTER.color } as CSSProperties;
  if (!fighter) return undefined;
  return { "--energy": fighterAppearance(fighter.energy).color } as CSSProperties;
}

function SideBadges({ sides }: { sides: readonly ArenaSide[] }) {
  return (
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
  );
}

function ArenaSideSlot({
  side,
  fighter,
  random,
  active,
  onActivate,
}: {
  side: ArenaSide;
  fighter: ArenaFighter | null;
  random: boolean;
  active: boolean;
  onActivate: () => void;
}) {
  const label = SIDE_LABEL[side];
  const name = random ? RANDOM_FIGHTER.name : fighter?.name;
  const banner = random ? RANDOM_FIGHTER.banner : fighter?.banner;

  return (
    <button
      type="button"
      data-slot="arena-side-slot"
      data-side={side}
      data-active={active ? "" : undefined}
      aria-pressed={active}
      aria-label={name ? `${label}: ${name}` : `Escolher ${label}`}
      onClick={onActivate}
      style={energyStyle(fighter, random)}
      className={cn(
        "arena-side-slot flex min-w-0 flex-1 items-center gap-2.5 p-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arena-cta)",
        side === "opponent" && "flex-row-reverse text-right",
      )}
    >
      <span className="size-9 shrink-0 bg-(--arena-line) max-[420px]:hidden">
        {banner ? <FighterPortrait banner={banner} className="block size-full" /> : null}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[10px] font-semibold tracking-widest text-(--arena-ink-subtle) uppercase">
          {label}
        </span>
        <span className="truncate font-arena-title text-[11px] leading-tight uppercase">
          {name ?? "Escolher"}
        </span>
      </span>
    </button>
  );
}

function ArenaMatchupSlots({
  player,
  opponent,
  random,
  active,
  onActivate,
}: {
  player: ArenaFighter | null;
  opponent: ArenaFighter | null;
  random: Record<ArenaSide, boolean>;
  active: ArenaSide;
  onActivate: (side: ArenaSide) => void;
}) {
  return (
    <div data-slot="arena-matchup-slots" className="flex items-center gap-2">
      <ArenaSideSlot
        side="player"
        fighter={player}
        random={random.player}
        active={active === "player"}
        onActivate={() => onActivate("player")}
      />
      <span aria-hidden className="font-arena-title text-lg text-(--arena-cta)">
        VS
      </span>
      <ArenaSideSlot
        side="opponent"
        fighter={opponent}
        random={random.opponent}
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
  random,
  active,
  onChoose,
}: {
  fighters: readonly ArenaFighter[];
  player: ArenaFighter | null;
  opponent: ArenaFighter | null;
  random: Record<ArenaSide, boolean>;
  active: ArenaSide;
  onChoose: (id: string) => void;
}) {
  const randomSides = (["player", "opponent"] as const).filter((side) => random[side]);
  const randomCurrent = random[active];

  return (
    <ul data-slot="fighter-roster" className="grid grid-cols-5 gap-2.5">
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
              className="arena-roster-tile group relative block aspect-square w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arena-cta)"
            >
              <FighterPortrait
                banner={fighter.banner}
                className="absolute inset-0 transition-transform duration-300 group-hover:scale-110"
              />
              <SideBadges sides={sides} />
            </button>
          </li>
        );
      })}
      <li>
        <button
          type="button"
          data-slot="fighter-tile"
          data-current={randomCurrent ? "" : undefined}
          aria-pressed={randomCurrent}
          aria-label={RANDOM_FIGHTER.name}
          onClick={() => onChoose(RANDOM_FIGHTER_ID)}
          style={energyStyle(null, true)}
          className="arena-roster-tile group relative block aspect-square w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arena-cta)"
        >
          <FighterPortrait
            banner={RANDOM_FIGHTER.banner}
            className="absolute inset-0 transition-transform duration-300 group-hover:scale-110"
          />
          <SideBadges sides={randomSides} />
        </button>
      </li>
    </ul>
  );
}

export { ArenaMatchupSlots, FighterRoster };
