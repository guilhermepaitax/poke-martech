import { useTypeName } from "@/hooks/use-pokemon-types";
import { TYPE_APPEARANCE, energyStyle } from "@/lib/type-appearance";
import { cn } from "@/lib/utils";
import type { EnergyType } from "@/lib/value-objects/card";
import type { ComponentProps } from "react";

function EnergyMark({
  type,
  className,
}: {
  type: EnergyType;
  className?: string;
}) {
  const appearance = TYPE_APPEARANCE[type];
  const Icon = appearance.icon;
  const name = useTypeName(type);
  return (
    <span
      data-slot="energy-mark"
      data-energy={type}
      data-selected=""
      style={energyStyle(type)}
      className={cn(
        "energy-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {name}
    </span>
  );
}

interface EnergyChipProps extends Omit<ComponentProps<"button">, "type"> {
  energy: EnergyType;
  selected?: boolean;
}

function EnergyChip({
  energy,
  selected = false,
  className,
  ...props
}: EnergyChipProps) {
  const appearance = TYPE_APPEARANCE[energy];
  const Icon = appearance.icon;
  const name = useTypeName(energy);
  return (
    <button
      data-slot="energy-chip"
      data-energy={energy}
      data-selected={selected ? "" : undefined}
      type="button"
      style={energyStyle(energy)}
      className={cn(
        "energy-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
        className,
      )}
      {...props}
    >
      <Icon className="size-3.5" />
      {name}
    </button>
  );
}

export { EnergyChip, EnergyMark };
