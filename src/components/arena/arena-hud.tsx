"use client";

import { CHARGE_LEVEL_MS } from "@/lib/arena/charge";
import type { ArenaFighter } from "@/lib/arena/fighter";
import type { ArenaSnapshot, FighterSnapshot, HudCharge } from "@/lib/arena/snapshot";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

import { fighterAppearance } from "./fighter-appearance";
import { FighterPortrait } from "./fighter-portrait";

function hpTone(ratio: number) {
  if (ratio > 0.5) return "high";
  if (ratio > 0.25) return "mid";
  return "low";
}

// Um segmento por nível. O nível vem do relógio do jogo; a animação só
// preenche o segmento em curso, então a barra nunca adianta o nível real.
function ArenaChargeSegment({ index, charge }: { index: 0 | 1; charge: HudCharge | null }) {
  const level = charge?.level ?? 0;
  const startMs = index === 0 ? 0 : CHARGE_LEVEL_MS[0];
  const durationMs = CHARGE_LEVEL_MS[index] - startMs;

  return (
    <div
      data-segment={index + 1}
      className="arena-meter relative h-2.5 min-w-0 flex-1 overflow-hidden sm:h-3"
    >
      {charge && level > index ? <span className="arena-meter-fill absolute inset-0" /> : null}
      {charge && level === index ? (
        <span
          key={`${charge.cycle}-${level}`}
          className="arena-meter-fill arena-charge-fill absolute inset-0"
          style={
            {
              "--charge-duration": `${durationMs}ms`,
              "--charge-delay": `${-Math.max(charge.heldMs - startMs, 0)}ms`,
            } as CSSProperties
          }
        />
      ) : null}
    </div>
  );
}

function ArenaChargeMeter({ charge }: { charge: HudCharge | null }) {
  return (
    <div className="relative flex min-w-0 flex-1 items-center gap-1">
      <ArenaChargeSegment index={0} charge={charge} />
      <ArenaChargeSegment index={1} charge={charge} />
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

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
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
      style={{ "--energy": appearance.color } as CSSProperties}
      className={cn(
        "arena-plate flex min-w-0 max-w-[24rem] flex-1 items-center gap-2 py-1.5 sm:gap-3 sm:py-2",
        opponent ? "flex-row-reverse pr-2 pl-5 text-right sm:pr-2.5 sm:pl-7" : "pr-5 pl-2 sm:pr-7 sm:pl-2.5",
      )}
    >
      <div
        className={cn(
          "arena-portrait relative size-12 shrink-0 sm:size-16",
          opponent && "hidden sm:block",
        )}
      >
        <FighterPortrait
          fighter={fighter}
          className={cn("arena-portrait-art absolute inset-0", opponent && "-scale-x-100")}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className={cn("flex items-baseline gap-2", opponent && "flex-row-reverse")}>
          <span className="truncate font-arena-title text-sm leading-none uppercase sm:text-lg">
            {fighter.name}
          </span>
          <span className="arena-side-tag hidden shrink-0 px-1.5 font-arena-title text-[10px] leading-4 uppercase sm:inline">
            {opponent ? "CPU" : "P1"}
          </span>
        </div>
        <div
          role="meter"
          aria-label={`HP de ${fighter.name}`}
          aria-valuemin={0}
          aria-valuemax={state.maxHp}
          aria-valuenow={state.hp}
          className="arena-hp-track relative h-3.5 w-full overflow-hidden sm:h-4"
        >
          <div
            className={cn(
              "arena-hp-lag absolute inset-y-0 transition-[width] delay-300 duration-700 ease-out",
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
          <span className="shrink-0 text-[11px] font-semibold leading-none text-(--arena-ink-subtle) tabular-nums">
            <span className="text-(--arena-ink)">{state.hp}</span>/{state.maxHp}
          </span>
          {opponent ? null : <ArenaChargeMeter charge={charge} />}
        </div>
      </div>
    </div>
  );
}

function ArenaHudClock({ seconds }: { seconds: number }) {
  const clock = formatClock(seconds);

  return (
    <div
      data-slot="arena-hud-clock"
      role="timer"
      aria-label={`Tempo de luta ${clock}`}
      className="flex shrink-0 flex-col items-center"
    >
      <span className="arena-tab px-2 font-arena-title text-[9px] leading-4 tracking-widest uppercase sm:text-[10px]">
        Tempo
      </span>
      <span className="arena-clock px-3 py-1 font-arena-title text-xl leading-none tabular-nums sm:px-4 sm:text-3xl">
        {clock}
      </span>
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
      className="pointer-events-none absolute inset-x-0 top-0 z-[5] flex items-start justify-between gap-1.5 p-2 text-(--arena-ink) sm:gap-3 sm:p-3"
    >
      <ArenaHudFighter fighter={player} state={snapshot.player} side="player" charge={charge} />
      <ArenaHudClock seconds={snapshot.elapsedSeconds} />
      <ArenaHudFighter fighter={opponent} state={snapshot.opponent} side="opponent" charge={null} />
    </div>
  );
}

export { ArenaHud };
