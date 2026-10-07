"use client";

import { HoloCard } from "@/components/holo-card/holo-card";
import { TYPE_APPEARANCE } from "@/lib/type-appearance";
import { STATUS_LABELS, type StatusCondition } from "@/lib/value-objects/attack-effect";
import { cn } from "@/lib/utils";
import type { BattlePokemonView } from "@/types/battle";
import { Flame, Moon, Sparkles, Swords, Zap } from "lucide-react";

const STATUS_ICONS: Record<StatusCondition, typeof Flame> = {
  poisoned: Sparkles,
  burned: Flame,
  asleep: Moon,
  paralyzed: Zap,
  confused: Swords,
};

function BattlePokemonSlot({
  pokemon,
  active,
  selected,
  faint,
  onClick,
}: {
  pokemon: BattlePokemonView;
  active?: boolean;
  selected?: boolean;
  faint?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      data-slot="battle-pokemon-slot"
      data-active={active ? "" : undefined}
      data-selected={selected ? "" : undefined}
      disabled={!onClick}
      onClick={onClick}
      className={cn(
        "relative w-[5.6rem] shrink-0 rounded-[12%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-24",
        active && "w-[7.2rem] sm:w-32",
        selected && "ring-2 ring-primary",
        faint && "opacity-40",
        onClick && "cursor-pointer",
      )}
    >
      {active ? <span className="pointer-events-none absolute -inset-2 rounded-[18%] bg-primary/20 blur-md" /> : null}
      <HoloCard {...pokemon.card} effects={false} className="relative" />
      <span className="absolute -top-2 right-0 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold tabular-nums text-foreground shadow">
        {pokemon.remainingHp}
      </span>
      {pokemon.energies.length > 0 ? (
        <span className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
          {pokemon.energies.map((energy, index) => {
            const Icon = TYPE_APPEARANCE[energy].icon;
            return (
              <span
                key={`${energy}-${index}`}
                className="flex size-4 items-center justify-center rounded-full bg-white/90 text-[10px] shadow"
                style={{ color: TYPE_APPEARANCE[energy].color }}
              >
                <Icon className="size-3" />
              </span>
            );
          })}
        </span>
      ) : null}
      {pokemon.status.length > 0 ? (
        <span className="absolute top-1 left-1 flex flex-col gap-0.5">
          {pokemon.status.map((condition) => {
            const Icon = STATUS_ICONS[condition];
            return (
              <span key={condition} title={STATUS_LABELS[condition]} className="rounded-full bg-white/90 p-0.5 shadow">
                <Icon className="size-3" />
              </span>
            );
          })}
        </span>
      ) : null}
    </button>
  );
}

export { BattlePokemonSlot };
