import type { FighterEnergy } from "@/lib/arena/fighter";
import type { LucideIcon } from "lucide-react";
import { Flame, Leaf } from "lucide-react";

type FighterAppearance = {
  label: string;
  icon: LucideIcon;
  color: `var(--energy-${FighterEnergy})`;
};

const FIGHTER_APPEARANCE: Record<FighterEnergy, FighterAppearance> = {
  fire: {
    label: "Fogo",
    icon: Flame,
    color: "var(--energy-fire)",
  },
  grass: {
    label: "Planta",
    icon: Leaf,
    color: "var(--energy-grass)",
  },
};

function fighterAppearance(energy: FighterEnergy) {
  return FIGHTER_APPEARANCE[energy];
}

export { fighterAppearance };
export type { FighterAppearance };
