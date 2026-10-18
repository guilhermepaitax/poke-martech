"use client";

import { HoloCard } from "@/components/holo-card/holo-card";
import type { ArenaRosterEntry } from "@/lib/arena/fighter";
import type { ArenaSide } from "@/lib/arena/selection";
import { cn } from "@/lib/utils";

const HOLO_EFFECTS = { holo: true, borderShine: true } as const;

function ArenaPickerCard({
  entry,
  side,
  onChoose,
}: {
  entry: ArenaRosterEntry;
  side: ArenaSide | null;
  onChoose: (id: string) => void;
}) {
  const label =
    side === "player"
      ? `Você, ${entry.face.name}`
      : side === "opponent"
        ? `Oponente, ${entry.face.name}`
        : entry.face.name;

  return (
    <button
      type="button"
      data-slot="arena-picker-card"
      data-side={side ?? undefined}
      aria-pressed={side !== null}
      aria-label={label}
      onClick={() => onChoose(entry.id)}
      className={cn(
        "flex w-full flex-col gap-2 rounded-[4%] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        side === "player" && "ring-2 ring-primary",
        side === "opponent" && "ring-2 ring-foreground",
      )}
    >
      <HoloCard {...entry.face} effects={HOLO_EFFECTS} />
      <span className="min-h-5 text-center text-sm font-semibold text-foreground">
        {side === "player" ? "Você" : side === "opponent" ? "Oponente" : null}
      </span>
    </button>
  );
}

export { ArenaPickerCard, HOLO_EFFECTS };
