import type { CardRepository } from "@/server/application/contracts/repositories/card-repository";
import { Card, CardAttack } from "@/server/application/entities/card";
import { NotFoundError, ValidationError, type AppError } from "@/server/shared/app-error";
import type { CardDetail, CardInput } from "@/types/catalog";

async function findEvolutionOrigin(
  card: Card,
  find: (id: string) => Promise<Card | null>,
): Promise<Card | null> {
  if (card.stage === "basic" || !card.evolvesFromId) return null;
  return find(card.evolvesFromId);
}

function toCardDetail(card: Card, origin: Card | null, ownedCount = 0): CardDetail {
  return {
    id: card.id,
    number: card.number,
    name: card.name,
    slug: card.slug,
    imageUrl: card.imageUrl,
    imageX: card.imageX,
    imageY: card.imageY,
    imageScale: card.imageScale,
    overlayImageUrl: card.overlayImageUrl,
    overlayX: card.overlayX,
    overlayY: card.overlayY,
    overlayScale: card.overlayScale,
    decorationAsset: card.decorationAsset,
    decorationImageUrl: card.decorationImageUrl,
    hp: card.hp,
    energyType: card.energyType,
    stage: card.stage,
    frame: card.frame,
    rarity: card.rarity,
    published: card.published,
    evolvesFromId: card.evolvesFromId,
    evolvesFrom: origin ? { name: origin.name, imageUrl: origin.imageUrl } : null,
    retreatCost: card.retreatCost,
    weaknessType: card.weaknessType,
    weaknessModifier: card.weaknessModifier,
    flavorText: card.flavorText,
    attacks: card.attacks.map((attack) => ({
      name: attack.name,
      damage: attack.damage,
      effectText: attack.effectText,
      effects: attack.effects,
      energyCost: attack.energyCost,
      sortOrder: attack.sortOrder,
    })),
    ownedCount,
  };
}

function toCardEntity(id: string, input: CardInput) {
  return new Card(
    id,
    0,
    input.name,
    input.slug,
    input.imageUrl,
    input.imageX,
    input.imageY,
    input.imageScale,
    input.overlayImageUrl,
    input.overlayX,
    input.overlayY,
    input.overlayScale,
    input.decorationAsset,
    input.decorationImageUrl,
    input.hp,
    input.energyType,
    input.stage,
    input.frame,
    input.evolvesFromId,
    input.retreatCost,
    input.weaknessType,
    input.weaknessModifier,
    input.rarity,
    input.flavorText,
    input.published,
    input.attacks.map(
      (attack) =>
        new CardAttack(
          attack.name,
          attack.damage,
          attack.effectText,
          attack.energyCost,
          attack.sortOrder,
          attack.effects,
        ),
    ),
  );
}

async function assertCardEvolution(
  cards: CardRepository,
  input: CardInput,
  selfId?: string,
): Promise<AppError | null> {
  if (input.stage === "basic") return null;
  if (!input.evolvesFromId) {
    return new ValidationError("Cartas evoluídas precisam de uma carta de origem.");
  }
  if (selfId && input.evolvesFromId === selfId) {
    return new ValidationError("Uma carta não pode evoluir de si mesma.");
  }
  const origin = await cards.findById(input.evolvesFromId);
  if (!origin) return new NotFoundError("Carta de origem");
  return null;
}

export { assertCardEvolution, findEvolutionOrigin, toCardDetail, toCardEntity };
