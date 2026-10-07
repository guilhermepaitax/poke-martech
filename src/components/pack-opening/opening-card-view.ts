import type { OpeningCard } from "@/types/catalog";

function openingCardView(card: OpeningCard) {
  return {
    name: card.name,
    imageUrl: card.imageUrl,
    rarity: card.rarity,
    hp: card.hp,
    energyType: card.energyType,
    frame: card.frame,
    stage: card.stage,
    evolvesFrom: card.evolvesFrom,
    attacks: card.attacks,
    retreatCost: card.retreatCost,
    weaknessType: card.weaknessType,
    weaknessModifier: card.weaknessModifier,
    flavorText: card.flavorText,
    imageX: card.imageX,
    imageY: card.imageY,
    imageScale: card.imageScale,
    overlayImageUrl: card.overlayImageUrl,
    overlayX: card.overlayX,
    overlayY: card.overlayY,
    overlayScale: card.overlayScale,
    decorationAsset: card.decorationAsset,
    decorationImageUrl: card.decorationImageUrl,
  };
}

export { openingCardView };
