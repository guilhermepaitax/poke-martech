import { attackDescription } from "@/lib/value-objects/attack-effect";
import type { Attack } from "@/types/catalog";
import { CardEnergySymbol } from "./card-energy-symbol";

function CardAttackRow({ attack }: { attack: Attack }) {
  const description = attackDescription(attack.effectText, attack.effects);
  const symbols = attack.energyCost.flatMap((cost) =>
    Array.from({ length: cost.count }, () => cost.type),
  );
  return (
    <div data-slot="card-attack-row" className="flex flex-col gap-[0.15em]">
      <div className="flex items-center gap-[0.5em]">
        <div className="flex min-w-[24%] shrink-0 flex-wrap content-center gap-[0.1em]">
          {symbols.map((type, index) => (
            <CardEnergySymbol
              key={`${type}-${index}`}
              type={type}
              className="size-[1.15em]"
            />
          ))}
        </div>
        <p className="card-text-outline min-w-0 flex-1 text-[1.15em] leading-tight font-bold wrap-break-word text-(--card-ink)">
          {attack.name}
        </p>
        <p className="card-text-outline shrink-0 text-right text-[1.35em] leading-tight font-bold tabular-nums text-(--card-ink)">
          {attack.damage ?? ""}
        </p>
      </div>
      {description ? (
        <p className="card-text-outline text-[0.7em] leading-tight wrap-break-word font-medium text-(--card-ink)">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export { CardAttackRow };
