"use client";

import type { ArenaFighter } from "@/lib/arena/fighter";
import type { ArenaSnapshot, FighterSnapshot, HudCharge } from "@/lib/arena/snapshot";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

import { fighterAppearance } from "./fighter-appearance";
import { FighterSprite } from "./fighter-sprite";

function hpTone(ratio: number) {
  if (ratio > 0.5) return "high";
  if (ratio > 0.25) return "mid";
  return "low";
}

function ArenaChargeMeter({ charge }: { charge: HudCharge | null }) {
  return (
    <div className="relative flex min-w-0 flex-1 items-center">
      <div
        data-level={charge?.level ?? 0}
        className="arena-meter relative h-2.5 w-full overflow-hidden sm:h-3"
      >
        {charge ? (
          <span
            key={charge.cycle}
            className="arena-charge-fill absolute inset-0 bg-accent"
            style={{ "--charge-delay": `${-charge.heldMs}ms` } as CSSProperties}
          />
        ) : null}
        <span aria-hidden className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-foreground" />
      </div>
      {charge?.level === 2 ? (
        <span
          key={`stamp-${charge.cycle}`}
          className="arena-stamp absolute -top-4 right-1 font-arena-title text-lg leading-none sm:-top-5 sm:text-2xl"
        >
          CHARGE!
        </span>
      ) : null}
    </div>
  );
}

function ArenaHudFighter({
  fighter,
  state,
  side,
  charge,
}: {
  fighter: ArenaFighter;
  state: FighterSnapshot;
  side: "player" | "opponent";
  charge: HudCharge | null;
}) {
  const ratio = state.maxHp > 0 ? Math.min(Math.max(state.hp / state.maxHp, 0), 1) : 0;
  const width = `${ratio * 100}%`;
  const opponent = side === "opponent";
  const appearance = fighterAppearance(fighter.energy);

  return (
    <div
      data-slot="arena-hud-fighter"
      data-side={side}
      className={cn(
        "arena-plate flex w-[min(24rem,calc(50%-0.75rem))] min-w-0 items-center gap-2 py-1.5 text-background sm:gap-3 sm:py-2",
        opponent ? "flex-row-reverse pr-2 pl-6 text-right sm:pr-3" : "pr-6 pl-2 sm:pl-3",
      )}
    >
      <div
        className={cn(
          "arena-portrait flex h-12 w-16 shrink-0 items-end justify-center overflow-hidden sm:h-14 sm:w-20",
          opponent && "hidden sm:flex",
        )}
        style={{ "--portrait": appearance.color } as CSSProperties}
      >
        <FighterSprite fighter={fighter} size={56} className={cn(opponent && "-scale-x-100")} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-arena-title text-sm leading-none tracking-wide uppercase sm:text-base">
          {fighter.name}
        </span>
        <div
          role="meter"
          aria-label={`HP de ${fighter.name}`}
          aria-valuemin={0}
          aria-valuemax={state.maxHp}
          aria-valuenow={state.hp}
          className="arena-hp-track relative h-4 w-full overflow-hidden sm:h-5"
        >
          <div
            className={cn(
              "absolute inset-y-0 bg-background/75 transition-[width] delay-300 duration-700 ease-out",
              opponent ? "right-0" : "left-0",
            )}
            style={{ width }}
          />
          <div
            data-tone={hpTone(ratio)}
            className={cn(
              "arena-hp-fill absolute inset-y-0 transition-[width] duration-200 ease-out",
              opponent ? "right-0" : "left-0",
            )}
            style={{ width }}
          />
        </div>
        <div className={cn("flex items-center gap-2", opponent && "flex-row-reverse")}>
          <span className="shrink-0 text-xs font-semibold leading-none tabular-nums">
            {state.hp}/{state.maxHp}
          </span>
          {opponent ? null : <ArenaChargeMeter charge={charge} />}
        </div>
      </div>
    </div>
  );
}

function ArenaHud({
  player,
  opponent,
  snapshot,
  charge,
}: {
  player: ArenaFighter;
  opponent: ArenaFighter;
  snapshot: ArenaSnapshot | null;
  charge: HudCharge | null;
}) {
  if (!snapshot) return null;

  return (
    <div
      data-slot="arena-hud"
      className="pointer-events-none absolute inset-x-0 top-0 z-[5] flex items-start justify-between gap-2 p-2 sm:p-3"
    >
      <ArenaHudFighter fighter={player} state={snapshot.player} side="player" charge={charge} />
      <ArenaHudFighter fighter={opponent} state={snapshot.opponent} side="opponent" charge={null} />
    </div>
  );
}

export { ArenaHud };
