import type { CardFrame, EnergyType, Rarity } from "@/lib/value-objects/card";
import type { CardInspiration } from "@/server/application/entities/source-pokemon";
import type { EnergyCost } from "@/types/catalog";

type CardIdeaRequest = {
  person: { name: string; description: string; imageUrl: string };
  inspirations: (CardInspiration | null)[];
  allowedTypes: { code: EnergyType; name: string }[];
};

type CardIdea = {
  name: string;
  hp: number;
  energyType: EnergyType;
  weaknessType: EnergyType | null;
  retreatCost: number;
  rarity: Rarity;
  frame: CardFrame;
  flavorText: string;
  attacks: {
    name: string;
    damage: number | null;
    effectText: string;
    energyCost: EnergyCost[];
  }[];
  imagePrompt: string;
};

interface CardIdeaGenerator {
  isConfigured(): boolean;
  generate(request: CardIdeaRequest): Promise<CardIdea[]>;
}

export type { CardIdea, CardIdeaGenerator, CardIdeaRequest };
