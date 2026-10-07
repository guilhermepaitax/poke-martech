import type { CardDecorationId } from "@/lib/card-decorations";
import type { AttackEffect } from "@/lib/value-objects/attack-effect";
import type { CardFrame, EnergyType, Rarity, Stage } from "@/lib/value-objects/card";
import type { Attack } from "@/types/catalog";

class CardAttack {
  constructor(
    readonly name: string,
    readonly damage: number | null,
    readonly effectText: string,
    readonly energyCost: Attack["energyCost"],
    readonly sortOrder: number,
    readonly effects: AttackEffect[] = [],
  ) {}
}

class Card {
  constructor(
    readonly id: string,
    readonly number: number,
    readonly name: string,
    readonly slug: string,
    readonly imageUrl: string | null,
    readonly imageX: number,
    readonly imageY: number,
    readonly imageScale: number,
    readonly overlayImageUrl: string | null,
    readonly overlayX: number,
    readonly overlayY: number,
    readonly overlayScale: number,
    readonly decorationAsset: CardDecorationId | null,
    readonly decorationImageUrl: string | null,
    readonly hp: number,
    readonly energyType: EnergyType,
    readonly stage: Stage,
    readonly frame: CardFrame,
    readonly evolvesFromId: string | null,
    readonly retreatCost: number,
    readonly weaknessType: EnergyType | null,
    readonly weaknessModifier: number,
    readonly rarity: Rarity,
    readonly flavorText: string,
    readonly published: boolean,
    readonly attacks: CardAttack[],
  ) {}
}

export { Card, CardAttack };
