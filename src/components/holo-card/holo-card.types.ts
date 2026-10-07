import type { EnergyType, Rarity, Stage } from "@/lib/value-objects/card";
import type { Attack, CardArtwork, CardEvolutionOrigin } from "@/types/catalog";

type HoloCardFaceProps = CardArtwork & {
  name: string;
  imageUrl: string | null;
  rarity: Rarity;
  hp: number;
  energyType: EnergyType;
  stage: Stage;
  evolvesFrom: CardEvolutionOrigin | null;
  attacks: Attack[];
  retreatCost: number;
  weaknessType: EnergyType | null;
  weaknessModifier: number;
  flavorText: string;
};

export type { HoloCardFaceProps };
