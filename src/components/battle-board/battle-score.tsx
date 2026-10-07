"use client";

import { POINTS_TO_WIN } from "@/lib/battle/battle-state";
import { cn } from "@/lib/utils";

function BattleScore({
  name,
  points,
  align,
}: {
  name: string;
  points: number;
  align: "left" | "right";
}) {
  return (
    <div data-slot="battle-score" className={cn("flex items-center gap-2", align === "right" && "flex-row-reverse")}>
      <p className="text-sm font-semibold">{name}</p>
      <span className="flex gap-1">
        {Array.from({ length: POINTS_TO_WIN }, (_, index) => (
          <span
            key={index}
            data-filled={index < points ? "" : undefined}
            className="size-3 rounded-full bg-white/70 data-filled:bg-primary"
          />
        ))}
      </span>
    </div>
  );
}

export { BattleScore };
