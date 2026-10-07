import type { EnergyType, Stage } from "@/lib/value-objects/card";
import type { CardEvolutionOrigin } from "@/types/catalog";
import type { ReactNode } from "react";
import { CardEnergySymbol } from "./card-energy-symbol";
import { CardEvolutionThumb } from "./card-evolution-thumb";
import { CardStagePill } from "./card-stage-pill";

function CardHeader({
  stage,
  name,
  hp,
  energyType,
  evolvesFrom,
  mark,
}: {
  stage: Stage;
  name: string;
  hp: number;
  energyType: EnergyType;
  evolvesFrom?: CardEvolutionOrigin | null;
  mark?: ReactNode;
}) {
  const origin = stage === "basic" ? null : evolvesFrom;
  return (
    <div
      data-slot="card-header"
      className="relative z-[1] flex items-center gap-[0.35em] px-[0.55em] pt-[0.45em] pb-[0.28em]"
    >
      <div className="relative shrink-0">
        <CardStagePill stage={stage} />
        {origin ? <CardEvolutionThumb origin={origin} /> : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="flex min-w-0 flex-wrap items-baseline gap-x-[0.2em] text-[1.15em] leading-tight font-bold wrap-break-word text-(--card-ink)">
          <span className="card-text-outline min-w-0">{name}</span>
          {mark}
        </p>
        {origin ? (
          <p className="card-text-outline truncate text-[0.45em] leading-tight italic text-(--card-label)">
            Evolui de {origin.name}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-[0.2em]">
        <p className="card-text-outline leading-none text-(--card-ink)">
          <span className="text-[0.55em] font-bold">HP</span>
          <span className="text-[1.55em] font-medium -tracking-widest">
            {hp}
          </span>
        </p>
        <CardEnergySymbol type={energyType} className="size-[1.55em]" />
      </div>
    </div>
  );
}

export { CardHeader };
