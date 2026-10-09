import type {
  CardFrame,
  EnergyType,
  Rarity,
  Stage,
} from "@/lib/value-objects/card";
import type { Attack, CardEvolutionOrigin } from "@/types/catalog";
import { LANDING_PIECE_IDS, type LandingPieceId } from "./landing.types";

type LandingCardFace = {
  name: string;
  imageUrl: string | null;
  rarity: Rarity;
  hp: number;
  energyType: EnergyType;
  frame: CardFrame;
  stage: Stage;
  evolvesFrom: CardEvolutionOrigin | null;
  attacks: Attack[];
  retreatCost: number;
  weaknessType: EnergyType | null;
  weaknessModifier: number;
  flavorText: string;
  imageX: number;
  imageY: number;
  imageScale: number;
  overlayImageUrl: null;
  overlayX: number;
  overlayY: number;
  overlayScale: number;
  decorationAsset: null;
  decorationImageUrl: null;
};

const LANDING_ART = {
  imageUrl:
    "https://pub-483a38a51c8a43cdbfaba81c156677da.r2.dev/uploads/e11f81b3-64bf-4079-beb8-ad0ff3dd70d2-NEeVBFZlcSS8UiVG9b2Dm_EnZETCrd.webp",
  imageX: 50,
  imageY: 50,
  imageScale: 100,
} as const;

const LANDING_EVOLUTION = {
  name: "Magooke",
  imageUrl:
    "https://pub-483a38a51c8a43cdbfaba81c156677da.r2.dev/uploads/c3a8cd53-1d33-47a8-9186-47406aa4aaf8-carta.webp",
} as const;

const LANDING_ATTACK: Attack = {
  name: "Brincadeira de Arremesso Sísmico",
  damage: 100,
  effectText: "",
  effects: [],
  energyCost: [{ type: "qa", count: 3 }],
  sortOrder: 0,
};

const LANDING_FLAVOR =
  "No lugar de Machamp, Mago deixou Antonioamp no repositório. Sem um fio de cabelo, sobra espaço para mais um import. Recuar Antonioamp custa 3, e Mago reclama de cada energia.";

const LANDING_CARD = {
  name: "Antonioamp",
  number: 333,
  rarity: "rare",
  hp: 150,
  energyType: "qa",
  frame: "basic",
  stage: "stage2",
  weaknessType: "frontend",
  weaknessModifier: 20,
  retreatCost: 3,
} as const;

function landingCardFace(placed: readonly LandingPieceId[]): LandingCardFace {
  const has = (id: LandingPieceId) => placed.includes(id);
  return {
    name: LANDING_CARD.name,
    imageUrl: has("art") ? LANDING_ART.imageUrl : null,
    rarity: LANDING_CARD.rarity,
    hp: LANDING_CARD.hp,
    energyType: LANDING_CARD.energyType,
    frame: LANDING_CARD.frame,
    stage: LANDING_CARD.stage,
    evolvesFrom: has("evolution") ? LANDING_EVOLUTION : null,
    attacks: has("attack") ? [LANDING_ATTACK] : [],
    retreatCost: has("stats") ? LANDING_CARD.retreatCost : 0,
    weaknessType: has("stats") ? LANDING_CARD.weaknessType : null,
    weaknessModifier: has("stats") ? LANDING_CARD.weaknessModifier : 0,
    flavorText: has("flavor") ? LANDING_FLAVOR : "",
    imageX: LANDING_ART.imageX,
    imageY: LANDING_ART.imageY,
    imageScale: LANDING_ART.imageScale,
    overlayImageUrl: null,
    overlayX: 50,
    overlayY: 50,
    overlayScale: 100,
    decorationAsset: null,
    decorationImageUrl: null,
  };
}

function landingShowcaseFace() {
  return landingCardFace(LANDING_PIECE_IDS);
}

export {
  LANDING_ART,
  LANDING_ATTACK,
  LANDING_CARD,
  LANDING_EVOLUTION,
  LANDING_FLAVOR,
  landingCardFace,
  landingShowcaseFace,
};
export type { LandingCardFace };
