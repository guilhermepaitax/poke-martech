import { TYPE_APPEARANCE } from "@/lib/type-appearance";
import { cn } from "@/lib/utils";
import type { EnergyType } from "@/lib/value-objects/card";

function CardEnergySymbol({
  type,
  className,
}: {
  type: EnergyType;
  className?: string;
}) {
  const appearance = TYPE_APPEARANCE[type];
  const Icon = appearance.icon;
  return (
    <span
      data-slot="card-energy-symbol"
      data-energy={type}
      style={{ background: appearance.color }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-(--card-paper) shadow-[inset_0_0_0_1px_var(--card-paper),0_0_0_1px_var(--card-ink)]",
        className,
      )}
    >
      <Icon
        className="size-[62%] mr-[-0.03em] mt-[-0.03em]"
        strokeWidth={2.5}
      />
    </span>
  );
}

export { CardEnergySymbol };
