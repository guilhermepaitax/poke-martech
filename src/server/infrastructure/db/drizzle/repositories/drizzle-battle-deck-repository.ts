import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { isEnergyType, isRarity, isStage, type EnergyType } from "@/lib/value-objects/card";
import type { BattleDeckRepository } from "@/server/application/contracts/repositories/battle-deck-repository";
import { BattleDeck } from "@/server/application/entities/battle";
import { db } from "@/server/infrastructure/db/drizzle/client";
import { battleDeckCards, battleDecks, cards, userCards } from "@/server/infrastructure/db/drizzle/schema";
import type { BattleDeckDetail, BattleDeckSummary } from "@/types/battle";

class DrizzleBattleDeckRepository implements BattleDeckRepository {
  async listByUser(userId: string): Promise<BattleDeckSummary[]> {
    const rows = await db
      .select({
        id: battleDecks.id,
        name: battleDecks.name,
        energyTypes: battleDecks.energyTypes,
        cardCount: sql<number>`coalesce(sum(${battleDeckCards.copies}), 0)::int`,
      })
      .from(battleDecks)
      .leftJoin(battleDeckCards, eq(battleDeckCards.deckId, battleDecks.id))
      .where(eq(battleDecks.userId, userId))
      .groupBy(battleDecks.id)
      .orderBy(asc(battleDecks.createdAt));
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      energyTypes: asEnergyList(row.energyTypes),
      cardCount: row.cardCount,
    }));
  }

  async findById(id: string, userId: string): Promise<BattleDeckDetail | null> {
    const rows = await db
      .select()
      .from(battleDecks)
      .where(and(eq(battleDecks.id, id), eq(battleDecks.userId, userId)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const links = await db
      .select({
        cardId: battleDeckCards.cardId,
        copies: battleDeckCards.copies,
        card: cards,
      })
      .from(battleDeckCards)
      .innerJoin(cards, eq(cards.id, battleDeckCards.cardId))
      .where(eq(battleDeckCards.deckId, id));
    return {
      id: row.id,
      name: row.name,
      energyTypes: asEnergyList(row.energyTypes),
      cardCount: links.reduce((sum, item) => sum + item.copies, 0),
      cards: links.flatMap((item) => {
        if (!isEnergyType(item.card.energyType) || !isStage(item.card.stage) || !isRarity(item.card.rarity)) return [];
        return [
          {
            cardId: item.cardId,
            copies: item.copies,
            card: {
              id: item.card.id,
              number: item.card.number,
              name: item.card.name,
              slug: item.card.slug,
              imageUrl: item.card.imageUrl,
              hp: item.card.hp,
              energyType: item.card.energyType,
              stage: item.card.stage,
              rarity: item.card.rarity,
              published: item.card.published,
            },
          },
        ];
      }),
    };
  }

  async save(deck: BattleDeck) {
    return db.transaction(async (tx) => {
      const id = deck.id || crypto.randomUUID();
      if (deck.id) {
        const updated = await tx
          .update(battleDecks)
          .set({
            name: deck.name,
            energyTypes: deck.energyTypes,
            updatedAt: new Date(),
          })
          .where(and(eq(battleDecks.id, deck.id), eq(battleDecks.userId, deck.userId)))
          .returning({ id: battleDecks.id });
        if (updated.length === 0) return { ok: false as const, reason: "not_found" as const };
        await tx.delete(battleDeckCards).where(eq(battleDeckCards.deckId, deck.id));
      } else {
        await tx.insert(battleDecks).values({
          id,
          userId: deck.userId,
          name: deck.name,
          energyTypes: deck.energyTypes,
        });
      }
      if (deck.cards.length > 0) {
        await tx.insert(battleDeckCards).values(
          deck.cards.map((item) => ({ deckId: id, cardId: item.cardId, copies: item.copies })),
        );
      }
      return { ok: true as const, id };
    });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const deleted = await db
      .delete(battleDecks)
      .where(and(eq(battleDecks.id, id), eq(battleDecks.userId, userId)))
      .returning({ id: battleDecks.id });
    return deleted.length > 0;
  }

  async ownedCounts(userId: string, cardIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (cardIds.length === 0) return counts;
    const rows = await db
      .select({
        cardId: userCards.cardId,
        count: sql<number>`count(*)::int`,
      })
      .from(userCards)
      .where(and(eq(userCards.userId, userId), inArray(userCards.cardId, cardIds)))
      .groupBy(userCards.cardId);
    for (const row of rows) counts.set(row.cardId, row.count);
    return counts;
  }
}

function asEnergyList(value: EnergyType[]): EnergyType[] {
  return value.filter(isEnergyType);
}

export { DrizzleBattleDeckRepository };
