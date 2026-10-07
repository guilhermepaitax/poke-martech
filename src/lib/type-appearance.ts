import type { LucideIcon } from "lucide-react";
import {
  Astroid,
  Cog,
  Droplet,
  Flame,
  Moon,
  Skull,
  Sparkles,
  Swords,
  UserRound,
  Zap,
} from "lucide-react";
import type { CSSProperties } from "react";

type CardTexture =
  | "grass"
  | "fire"
  | "water"
  | "lightning"
  | "psychic"
  | "fighting"
  | "darkness"
  | "metal"
  | "dragon"
  | "colorless";

type TypeAppearance = {
  icon: LucideIcon;
  color: `var(--energy-${string})`;
  texture: CardTexture;
  plate: `var(--card-plate-${CardTexture})`;
  textOutline: boolean;
};

const TYPE_APPEARANCE = {
  careca: {
    icon: UserRound,
    color: "var(--energy-grass)",
    texture: "grass",
    plate: "var(--card-plate-grass)",
    textOutline: false,
  },
  devops: {
    icon: Flame,
    color: "var(--energy-fire)",
    texture: "fire",
    plate: "var(--card-plate-fire)",
    textOutline: false,
  },
  "ux-ui": {
    icon: Droplet,
    color: "var(--energy-water)",
    texture: "water",
    plate: "var(--card-plate-water)",
    textOutline: false,
  },
  "full-stack": {
    icon: Zap,
    color: "var(--energy-lightning)",
    texture: "lightning",
    plate: "var(--card-plate-lightning)",
    textOutline: false,
  },
  frontend: {
    icon: Sparkles,
    color: "var(--energy-psychic)",
    texture: "psychic",
    plate: "var(--card-plate-psychic)",
    textOutline: false,
  },
  qa: {
    icon: Swords,
    color: "var(--energy-fighting)",
    texture: "fighting",
    plate: "var(--card-plate-fighting)",
    textOutline: false,
  },
  backend: {
    icon: Moon,
    color: "var(--energy-darkness)",
    texture: "darkness",
    plate: "var(--card-plate-darkness)",
    textOutline: true,
  },
  "testes-automatizados": {
    icon: Cog,
    color: "var(--energy-metal)",
    texture: "metal",
    plate: "var(--card-plate-metal)",
    textOutline: true,
  },
  "admin-generico": {
    icon: Skull,
    color: "var(--energy-dragon)",
    texture: "dragon",
    plate: "var(--card-plate-dragon)",
    textOutline: true,
  },
  ia: {
    icon: Astroid,
    color: "var(--energy-colorless)",
    texture: "colorless",
    plate: "var(--card-plate-colorless)",
    textOutline: false,
  },
} as const satisfies Record<string, TypeAppearance>;

type EnergyType = keyof typeof TYPE_APPEARANCE;

const ENERGY_TYPES = Object.keys(TYPE_APPEARANCE) as [
  EnergyType,
  ...EnergyType[],
];

function isEnergyType(value: string): value is EnergyType {
  return Object.hasOwn(TYPE_APPEARANCE, value);
}

function energyStyle(type: EnergyType): CSSProperties {
  return { "--energy": TYPE_APPEARANCE[type].color } as CSSProperties;
}

function cardTexturePath(type: EnergyType) {
  return `/card-layers/basic/${TYPE_APPEARANCE[type].texture}.png`;
}

export {
  cardTexturePath,
  ENERGY_TYPES,
  energyStyle,
  isEnergyType,
  TYPE_APPEARANCE,
};
export type { CardTexture, EnergyType };
