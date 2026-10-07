import { and, asc, eq, sql } from "drizzle-orm";
import {
  isCardDecorationId,
  type CardDecorationId,
} from "@/lib/card-decorations";
import { parseAttackEffects } from "@/lib/value-objects/attack-effect";
import {
  isEnergyType,
  isFrame,
  isRarity,
  isStage,
  type CardFrame,
  type EnergyType,
  type Rarity,
  type Stage,
} from "@/lib/value-objects/card";
import type { CardRepository } from "@/server/application/contracts/repositories/card-repository";
import { Card, CardAttack } from "@/server/application/entities/card";
import { db } from "@/server/infrastructure/db/drizzle/client";
import {
  cardAttacks,
  cards,
  userCards,
} from "@/server/infrastructure/db/drizzle/schema";
import type { CardSummary } from "@/types/catalog";

class DrizzleCardRepository implements CardRepository {
  async listAll(): Promise<CardSummary[]> {
    const rows = await db.select().from(cards).orderBy(asc(cards.number));
    return rows.map(toSummary);
  }

  async listPublished(): Promise<CardSummary[]> {
    const rows = await db
      .select()
      .from(cards)
      .where(eq(cards.published, true))
      .orderBy(asc(cards.number));
    return rows.map(toSummary);
  }

  async findById(id: string): Promise<Card | null> {
    const rows = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.hydrate(row);
  }

  async findPublishedById(id: string): Promise<Card | null> {
    const rows = await db
      .select()
      .from(cards)
      .where(and(eq(cards.id, id), eq(cards.published, true)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.hydrate(row);
  }

  async ownedCount(userId: string, cardId: string): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userCards)
      .where(and(eq(userCards.userId, userId), eq(userCards.cardId, cardId)));
    return rows[0]?.count ?? 0;
  }

  async create(card: Card) {
    try {
      const id = crypto.randomUUID();
      await db.transaction(async (tx) => {
        await tx.insert(cards).values(toInsert(id, card));
        if (card.attacks.length > 0) {
          await tx.insert(cardAttacks).values(card.attacks.map((attack) => toAttackInsert(id, attack)));
        }
      });
      return { ok: true as const, id };
    } catch (error) {
      if (isUniqueViolation(error)) return { ok: false as const, reason: "conflict" as const };
      throw error;
    }
  }

  async update(card: Card) {
    try {
      return await db.transaction(async (tx) => {
        const updated = await tx
          .update(cards)
          .set({ ...toInsert(card.id, card), updatedAt: new Date() })
          .where(eq(cards.id, card.id))
          .returning({ id: cards.id });
        if (updated.length === 0) return { ok: false as const, reason: "not_found" as const };
        await tx.delete(cardAttacks).where(eq(cardAttacks.cardId, card.id));
        if (card.attacks.length > 0) {
          await tx
            .insert(cardAttacks)
            .values(card.attacks.map((attack) => toAttackInsert(card.id, attack)));
        }
        return { ok: true as const };
      });
    } catch (error) {
      if (isUniqueViolation(error)) return { ok: false as const, reason: "conflict" as const };
      throw error;
    }
  }

  private async hydrate(row: typeof cards.$inferSelect): Promise<Card> {
    const attacks = await db
      .select()
      .from(cardAttacks)
      .where(eq(cardAttacks.cardId, row.id))
      .orderBy(asc(cardAttacks.sortOrder));
    return toCard(row, attacks);
  }
}

function toSummary(row: typeof cards.$inferSelect): CardSummary {
  return {
    id: row.id,
    number: row.number,
    name: row.name,
    slug: row.slug,
    imageUrl: row.imageUrl,
    hp: row.hp,
    energyType: asEnergy(row.energyType),
    stage: asStage(row.stage),
    rarity: asRarity(row.rarity),
    published: row.published,
  };
}

function toCard(
  row: typeof cards.$inferSelect,
  attacks: (typeof cardAttacks.$inferSelect)[],
): Card {
  return new Card(
    row.id,
    row.number,
    row.name,
    row.slug,
    row.imageUrl,
    row.imageX,
    row.imageY,
    row.imageScale,
    row.overlayImageUrl,
    row.overlayX,
    row.overlayY,
    row.overlayScale,
    asDecoration(row.decorationAsset),
    row.decorationImageUrl,
    row.hp,
    asEnergy(row.energyType),
    asStage(row.stage),
    asFrame(row.frame),
    row.evolvesFromId,
    row.retreatCost,
    row.weaknessType ? asEnergy(row.weaknessType) : null,
    row.weaknessModifier,
    asRarity(row.rarity),
    row.flavorText,
    row.published,
    attacks.map(
      (attack) =>
        new CardAttack(
          attack.name,
          attack.damage,
          attack.effectText,
          attack.energyCost.map((cost) => ({
            type: asEnergy(cost.type),
            count: cost.count,
          })),
          attack.sortOrder,
          parseAttackEffects(attack.effects),
        ),
    ),
  );
}

function toInsert(id: string, card: Card) {
  return {
    id,
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
    evolvesFromId: card.evolvesFromId,
    retreatCost: card.retreatCost,
    weaknessType: card.weaknessType,
    weaknessModifier: card.weaknessModifier,
    rarity: card.rarity,
    flavorText: card.flavorText,
    published: card.published,
  };
}

function toAttackInsert(cardId: string, attack: CardAttack) {
  return {
    id: crypto.randomUUID(),
    cardId,
    name: attack.name,
    damage: attack.damage,
    effectText: attack.effectText,
    effects: attack.effects,
    energyCost: attack.energyCost,
    sortOrder: attack.sortOrder,
  };
}

function asEnergy(value: string): EnergyType {
  if (!isEnergyType(value)) throw new Error("Tipo de energia inválido.");
  return value;
}

function asStage(value: string): Stage {
  if (!isStage(value)) throw new Error("Estágio inválido.");
  return value;
}

function asDecoration(value: string | null): CardDecorationId | null {
  if (!value || !isCardDecorationId(value)) return null;
  return value;
}

function asFrame(value: string): CardFrame {
  if (!isFrame(value)) throw new Error("Moldura inválida.");
  return value;
}

function asRarity(value: string): Rarity {
  if (!isRarity(value)) throw new Error("Raridade inválida.");
  return value;
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export { DrizzleCardRepository, isUniqueViolation };
