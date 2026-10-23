import type { FighterEnergy } from "@/lib/arena/fighter";
import type { LucideIcon } from "lucide-react";
import { Bone, Droplet, Flame, Leaf, Sparkles, Star, Sun, Waves } from "lucide-react";

type FighterAppearance = {
  label: string;
  icon: LucideIcon;
  // Ícone do slot de ataque à distância na barra de ataques.
  rangedIcon: LucideIcon;
  color: `var(--energy-${FighterEnergy})`;
};

const FIGHTER_APPEARANCE: Record<FighterEnergy, FighterAppearance> = {
  fire: {
    label: "Fogo",
    icon: Flame,
    rangedIcon: Flame,
    color: "var(--energy-fire)",
  },
  grass: {
    label: "Planta",
    icon: Leaf,
    rangedIcon: Sun,
    color: "var(--energy-grass)",
  },
  ground: {
    label: "Terra",
    icon: Bone,
    rangedIcon: Bone,
    color: "var(--energy-ground)",
  },
  colorless: {
    label: "Normal",
    icon: Star,
    rangedIcon: Sparkles,
    color: "var(--energy-colorless)",
  },
  water: {
    label: "Água",
    icon: Droplet,
    rangedIcon: Waves,
    color: "var(--energy-water)",
  },
};

function fighterAppearance(energy: FighterEnergy) {
  return FIGHTER_APPEARANCE[energy];
}

export { fighterAppearance };
export type { FighterAppearance };
