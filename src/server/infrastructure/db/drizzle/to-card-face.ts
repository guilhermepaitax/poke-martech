import { inArray } from "drizzle-orm";
import { isCardDecorationId } from "@/lib/card-decorations";
import { parseAttackEffects } from "@/lib/value-objects/attack-effect";
import { isEnergyType, isFrame, isRarity, isStage } from "@/lib/value-objects/card";
import type { db } from "@/server/infrastructure/db/drizzle/client";
import { cardAttacks, cards } from "@/server/infrastructure/db/drizzle/schema";
import type { Attack, CardEvolutionOrigin, CardFace } from "@/types/catalog";

type EvolutionOrigins = Map<string, CardEvolutionOrigin>;

async function evolutionOriginsFor(
  executor: Pick<typeof db, "select">,
  cardRows: (typeof cards.$inferSelect)[],
): Promise<EvolutionOrigins> {
  const ids = [
    ...new Set(
      cardRows.flatMap((card) =>
        card.stage !== "basic" && card.evolvesFromId ? [card.evolvesFromId] : [],
      ),
    ),
  ];
  if (ids.length === 0) return new Map();
  const rows = await executor
    .select({ id: cards.id, name: cards.name, imageUrl: cards.imageUrl })
    .from(cards)
    .where(inArray(cards.id, ids));
  return new Map(rows.map((row) => [row.id, { name: row.name, imageUrl: row.imageUrl }]));
}

function toCardFace(
  card: typeof cards.$inferSelect,
  attackRows: (typeof cardAttacks.$inferSelect)[],
  origins: EvolutionOrigins,
): CardFace | null {
  if (
    !isRarity(card.rarity) ||
    !isEnergyType(card.energyType) ||
    !isStage(card.stage) ||
    !isFrame(card.frame)
  ) {
    return null;
  }

  const attacks: Attack[] = attackRows
    .filter((attack) => attack.cardId === card.id)
    .map((attack) => ({
      name: attack.name,
      damage: attack.damage,
      effectText: attack.effectText,
      effects: parseAttackEffects(attack.effects),
      sortOrder: attack.sortOrder,
      energyCost: attack.energyCost.flatMap((cost) =>
        isEnergyType(cost.type) ? [{ type: cost.type, count: cost.count }] : [],
      ),
    }));

  return {
    name: card.name,
    imageUrl: card.imageUrl,
    imageX: card.imageX,
    imageY: card.imageY,
    imageScale: card.imageScale,
    overlayImageUrl: card.overlayImageUrl,
    overlayX: card.overlayX,
    overlayY: card.overlayY,
    overlayScale: card.overlayScale,
    decorationAsset:
      card.decorationAsset && isCardDecorationId(card.decorationAsset)
        ? card.decorationAsset
        : null,
    decorationImageUrl: card.decorationImageUrl,
    rarity: card.rarity,
    hp: card.hp,
    energyType: card.energyType,
    frame: card.frame,
    stage: card.stage,
    evolvesFrom:
      card.stage !== "basic" && card.evolvesFromId
        ? (origins.get(card.evolvesFromId) ?? null)
        : null,
    retreatCost: card.retreatCost,
    weaknessType:
      card.weaknessType && isEnergyType(card.weaknessType) ? card.weaknessType : null,
    weaknessModifier: card.weaknessModifier,
    flavorText: card.flavorText,
    attacks,
  };
}

export { evolutionOriginsFor, toCardFace };
export type { EvolutionOrigins };
