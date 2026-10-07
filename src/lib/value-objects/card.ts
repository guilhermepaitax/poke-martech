import {
  ENERGY_TYPES,
  isEnergyType,
  type EnergyType,
} from "@/lib/type-appearance";

const STAGES = ["basic", "stage1", "stage2"] as const;

const FRAMES = ["basic", "ex"] as const;

const RARITIES = [
  "common",
  "uncommon",
  "rare",
  "double_rare",
  "art_rare",
  "super_rare",
  "immersive",
  "crown",
] as const;

const RARITY_RANK = {
  common: 0,
  uncommon: 1,
  rare: 2,
  double_rare: 3,
  art_rare: 4,
  super_rare: 5,
  immersive: 6,
  crown: 7,
} as const;

const STAGE_LABELS: Record<(typeof STAGES)[number], string> = {
  basic: "BASIC",
  stage1: "STAGE 1",
  stage2: "STAGE 2",
};

const FRAME_LABELS: Record<(typeof FRAMES)[number], string> = {
  basic: "Basic",
  ex: "ex",
};

const RARITY_LABELS: Record<(typeof RARITIES)[number], string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  double_rare: "Raro Duplo",
  art_rare: "Arte Rara",
  super_rare: "Super Raro",
  immersive: "Imersivo",
  crown: "Coroa",
};

const FINISHES = ["matte", "satin", "mirror", "prism"] as const;

const FINISH_LABELS: Record<(typeof FINISHES)[number], string> = {
  matte: "Fosco",
  satin: "Acetinado",
  mirror: "Espelhado",
  prism: "Prisma",
};

const SIGNUP_BONUS = 100;

type Stage = (typeof STAGES)[number];
type CardFrame = (typeof FRAMES)[number];
type Rarity = (typeof RARITIES)[number];
type Finish = (typeof FINISHES)[number];

function isStage(value: string): value is Stage {
  return STAGES.some((stage) => stage === value);
}

function isFrame(value: string): value is CardFrame {
  return FRAMES.some((frame) => frame === value);
}

function isRarity(value: string): value is Rarity {
  return RARITIES.some((rarity) => rarity === value);
}

function isFinish(value: string): value is Finish {
  return FINISHES.some((finish) => finish === value);
}

export {
  ENERGY_TYPES,
  FINISH_LABELS,
  FINISHES,
  FRAME_LABELS,
  FRAMES,
  isEnergyType,
  isFinish,
  isFrame,
  isRarity,
  isStage,
  RARITIES,
  RARITY_LABELS,
  RARITY_RANK,
  SIGNUP_BONUS,
  STAGE_LABELS,
  STAGES,
};
export type { CardFrame, EnergyType, Finish, Rarity, Stage };
