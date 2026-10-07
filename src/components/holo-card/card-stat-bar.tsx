import type { EnergyType } from "@/lib/value-objects/card";
import type { ReactNode } from "react";
import { CardEnergySymbol } from "./card-energy-symbol";

function CardStatPill({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      data-slot="card-stat-pill"
      className="flex min-h-[1.45em] min-w-0 items-center justify-center gap-[0.35em] rounded-[0.55em] px-[0.5em] py-[0.1em] shadow-[inset_0_-0.08em_0_var(--card-silver-dark),inset_0_0_0_1px_var(--card-silver-edge)]"
      style={{ background: "var(--card-silver)" }}
    >
      <span className="text-[0.56em] leading-none text-(--card-ink)">
        {label}
      </span>
      {children}
    </div>
  );
}

function CardStatBar({
  weaknessType,
  weaknessModifier,
  retreatCost,
}: {
  weaknessType: EnergyType | null;
  weaknessModifier: number;
  retreatCost: number;
}) {
  return (
    <div data-slot="card-stat-bar" className="grid grid-cols-2 gap-[0.6em]">
      <CardStatPill label="fraqueza">
        {weaknessType ? (
          <span className="flex items-center gap-[0.15em]">
            <CardEnergySymbol type={weaknessType} className="size-[0.95em]" />
            <span className="text-[0.82em] leading-none font-bold text-(--card-ink) tabular-nums">
              +{weaknessModifier}
            </span>
          </span>
        ) : null}
      </CardStatPill>
      <CardStatPill label="recuo">
        {retreatCost > 0 ? (
          <span className="flex flex-wrap gap-[0.12em]">
            {Array.from({ length: retreatCost }, (_, index) => (
              <CardEnergySymbol
                key={index}
                type="ia"
                className="size-[0.95em]"
              />
            ))}
          </span>
        ) : null}
      </CardStatPill>
    </div>
  );
}

export { CardStatBar };
