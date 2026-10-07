import { and, asc, eq, inArray } from "drizzle-orm";
import type { BattleCardData, BattleState } from "@/lib/battle/battle-state";
import { isBattleStatus, type BattleStatus } from "@/lib/value-objects/battle";
import type { BattleRepository } from "@/server/application/contracts/repositories/battle-repository";
import { Battle } from "@/server/application/entities/battle-match";
import { db } from "@/server/infrastructure/db/drizzle/client";
import {
  battleOpponents,
  battles,
  cardAttacks,
  cards,
  coinLedger,
  wallets,
} from "@/server/infrastructure/db/drizzle/schema";
import { evolutionOriginsFor, toCardFace } from "@/server/infrastructure/db/drizzle/to-card-face";
import type { ActiveBattleSummary } from "@/types/battle";

class DrizzleBattleRepository implements BattleRepository {
  async findById(id: string, userId: string): Promise<Battle | null> {
    const rows = await db
      .select()
      .from(battles)
      .where(and(eq(battles.id, id), eq(battles.userId, userId)))
      .limit(1);
    const row = rows[0];
    if (!row || !isBattleStatus(row.status)) return null;
    return new Battle(
      row.id,
      row.userId,
      row.opponentId,
      row.deckId,
      row.status,
      row.state,
      row.version,
      row.rewardCoins,
    );
  }

  async findActiveByUser(userId: string): Promise<ActiveBattleSummary | null> {
    const rows = await db
      .select({
        id: battles.id,
        createdAt: battles.createdAt,
        opponentName: battleOpponents.name,
        opponentAvatarUrl: battleOpponents.avatarUrl,
      })
      .from(battles)
      .innerJoin(battleOpponents, eq(battleOpponents.id, battles.opponentId))
      .where(and(eq(battles.userId, userId), eq(battles.status, "active")))
      .orderBy(battles.createdAt)
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      opponentName: row.opponentName,
      opponentAvatarUrl: row.opponentAvatarUrl,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async create(input: {
    userId: string;
    opponentId: string;
    deckId: string;
    state: BattleState;
    rewardCoins: number;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await db.insert(battles).values({
      id,
      userId: input.userId,
      opponentId: input.opponentId,
      deckId: input.deckId,
      status: "active",
      state: input.state,
      version: 0,
      rewardCoins: input.rewardCoins,
    });
    return id;
  }

  async update(input: {
    id: string;
    userId: string;
    expectedVersion: number;
    state: BattleState;
    status: BattleStatus;
    rewardCoins?: number;
  }) {
    return db.transaction(async (tx) => {
      const finishedAt = input.status === "active" ? null : new Date();
      const updated = await tx
        .update(battles)
        .set({
          state: input.state,
          status: input.status,
          version: input.expectedVersion + 1,
          finishedAt,
        })
        .where(
          and(
            eq(battles.id, input.id),
            eq(battles.userId, input.userId),
            eq(battles.version, input.expectedVersion),
          ),
        )
        .returning({ id: battles.id });
      if (updated.length === 0) {
        const exists = await tx
          .select({ id: battles.id })
          .from(battles)
          .where(and(eq(battles.id, input.id), eq(battles.userId, input.userId)))
          .limit(1);
        return { ok: false as const, reason: exists.length ? ("conflict" as const) : ("not_found" as const) };
      }
      if (input.status === "won" && (input.rewardCoins ?? 0) > 0) {
        await creditWin(tx, input.userId, input.id, input.rewardCoins ?? 0);
      }
      return { ok: true as const };
    });
  }

  async loadCards(cardIds: string[]): Promise<BattleCardData[]> {
    const ids = [...new Set(cardIds)];
    if (ids.length === 0) return [];
    const rows = await db.select().from(cards).where(inArray(cards.id, ids));
    const attacks = await db
      .select()
      .from(cardAttacks)
      .where(inArray(cardAttacks.cardId, ids))
      .orderBy(asc(cardAttacks.sortOrder));
    const origins = await evolutionOriginsFor(db, rows);
    return rows.flatMap((row) => {
      const face = toCardFace(row, attacks, origins);
      if (!face) return [];
      return [{ ...face, cardId: row.id, evolvesFromId: row.evolvesFromId }];
    });
  }
}

async function creditWin(
  tx: Pick<typeof db, "select" | "insert" | "update">,
  userId: string,
  battleId: string,
  amount: number,
) {
  const existing = await tx
    .select({ id: coinLedger.id })
    .from(coinLedger)
    .where(and(eq(coinLedger.reason, "battle_win"), eq(coinLedger.referenceId, battleId)))
    .limit(1);
  if (existing.length > 0) return;
  const walletRows = await tx.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  const coins = (walletRows[0]?.coins ?? 0) + amount;
  if (walletRows[0]) {
    await tx.update(wallets).set({ coins }).where(eq(wallets.userId, userId));
  } else {
    await tx.insert(wallets).values({ userId, coins });
  }
  await tx.insert(coinLedger).values({
    userId,
    amount,
    reason: "battle_win",
    balanceAfter: coins,
    referenceId: battleId,
  });
}

export { DrizzleBattleRepository };
