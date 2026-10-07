import { and, asc, eq } from "drizzle-orm";
import { isEnergyType, type EnergyType } from "@/lib/value-objects/card";
import { isBattleDifficulty } from "@/lib/value-objects/battle";
import type { BattleOpponentRepository } from "@/server/application/contracts/repositories/battle-opponent-repository";
import { BattleOpponent } from "@/server/application/entities/battle";
import { db } from "@/server/infrastructure/db/drizzle/client";
import { isUniqueViolation } from "@/server/infrastructure/db/drizzle/repositories/drizzle-card-repository";
import { battleOpponentCards, battleOpponents } from "@/server/infrastructure/db/drizzle/schema";
import type { BattleOpponentSummary } from "@/types/battle";

class DrizzleBattleOpponentRepository implements BattleOpponentRepository {
  async listActive(): Promise<BattleOpponentSummary[]> {
    const rows = await db
      .select()
      .from(battleOpponents)
      .where(eq(battleOpponents.active, true))
      .orderBy(asc(battleOpponents.sortOrder), asc(battleOpponents.name));
    return rows.map(toSummary);
  }

  async listAll(): Promise<BattleOpponentSummary[]> {
    const rows = await db
      .select()
      .from(battleOpponents)
      .orderBy(asc(battleOpponents.sortOrder), asc(battleOpponents.name));
    return rows.map(toSummary);
  }

  async findById(id: string): Promise<BattleOpponent | null> {
    const rows = await db.select().from(battleOpponents).where(eq(battleOpponents.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.hydrate(row);
  }

  async findActiveById(id: string): Promise<BattleOpponent | null> {
    const rows = await db
      .select()
      .from(battleOpponents)
      .where(and(eq(battleOpponents.id, id), eq(battleOpponents.active, true)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.hydrate(row);
  }

  async create(opponent: BattleOpponent) {
    try {
      const id = crypto.randomUUID();
      await db.transaction(async (tx) => {
        await tx.insert(battleOpponents).values(toInsert(id, opponent));
        if (opponent.cards.length > 0) {
          await tx.insert(battleOpponentCards).values(
            opponent.cards.map((card) => ({
              opponentId: id,
              cardId: card.cardId,
              copies: card.copies,
            })),
          );
        }
      });
      return { ok: true as const, id };
    } catch (error) {
      if (isUniqueViolation(error)) return { ok: false as const, reason: "conflict" as const };
      throw error;
    }
  }

  async update(opponent: BattleOpponent) {
    try {
      return await db.transaction(async (tx) => {
        const updated = await tx
          .update(battleOpponents)
          .set({ ...toInsert(opponent.id, opponent), updatedAt: new Date() })
          .where(eq(battleOpponents.id, opponent.id))
          .returning({ id: battleOpponents.id });
        if (updated.length === 0) return { ok: false as const, reason: "not_found" as const };
        await tx.delete(battleOpponentCards).where(eq(battleOpponentCards.opponentId, opponent.id));
        if (opponent.cards.length > 0) {
          await tx.insert(battleOpponentCards).values(
            opponent.cards.map((card) => ({
              opponentId: opponent.id,
              cardId: card.cardId,
              copies: card.copies,
            })),
          );
        }
        return { ok: true as const };
      });
    } catch (error) {
      if (isUniqueViolation(error)) return { ok: false as const, reason: "conflict" as const };
      throw error;
    }
  }

  private async hydrate(row: typeof battleOpponents.$inferSelect): Promise<BattleOpponent> {
    const links = await db
      .select()
      .from(battleOpponentCards)
      .where(eq(battleOpponentCards.opponentId, row.id));
    if (!isBattleDifficulty(row.difficulty)) throw new Error("Dificuldade inválida.");
    return new BattleOpponent(
      row.id,
      row.name,
      row.slug,
      row.avatarUrl,
      row.description,
      row.difficulty,
      row.rewardCoins,
      asEnergyList(row.energyTypes),
      row.active,
      row.sortOrder,
      links.map((link) => ({ cardId: link.cardId, copies: link.copies })),
    );
  }
}

function toSummary(row: typeof battleOpponents.$inferSelect): BattleOpponentSummary {
  if (!isBattleDifficulty(row.difficulty)) throw new Error("Dificuldade inválida.");
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    avatarUrl: row.avatarUrl,
    description: row.description,
    difficulty: row.difficulty,
    rewardCoins: row.rewardCoins,
    active: row.active,
  };
}

function toInsert(id: string, opponent: BattleOpponent) {
  return {
    id,
    name: opponent.name,
    slug: opponent.slug,
    avatarUrl: opponent.avatarUrl,
    description: opponent.description,
    difficulty: opponent.difficulty,
    rewardCoins: opponent.rewardCoins,
    energyTypes: opponent.energyTypes,
    active: opponent.active,
    sortOrder: opponent.sortOrder,
  };
}

function asEnergyList(value: EnergyType[]): EnergyType[] {
  return value.filter(isEnergyType);
}

export { DrizzleBattleOpponentRepository };
