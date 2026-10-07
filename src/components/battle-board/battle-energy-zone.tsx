"use client";

import { TYPE_APPEARANCE } from "@/lib/type-appearance";
import { cn } from "@/lib/utils";
import type { EnergyType } from "@/lib/value-objects/card";

function BattleEnergyZone({
  energy,
  selected,
  onSelect,
}: {
  energy: EnergyType | null;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const appearance = energy ? TYPE_APPEARANCE[energy] : null;
  const Icon = appearance?.icon;
  return (
    <button
      type="button"
      data-slot="battle-energy-zone"
      data-selected={selected ? "" : undefined}
      disabled={!energy || !onSelect}
      onClick={onSelect}
      aria-label="Energia do turno"
      className={cn(
        "flex size-16 items-center justify-center rounded-full bg-white/70 shadow-lg ring-2 ring-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        selected && "ring-primary",
      )}
    >
      {Icon ? <Icon className="size-8" style={{ color: appearance?.color }} /> : null}
    </button>
  );
}

export { BattleEnergyZone };
