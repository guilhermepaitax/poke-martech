import { and, count, eq, gt, gte, isNull, sql } from "drizzle-orm";
import { isArenaDifficulty, type ArenaDifficulty } from "@/lib/arena/cpu";
import type {
  ArenaDefeatResult,
  ArenaMatchRepository,
  ArenaWinClaim,
  ArenaWinClaimResult,
} from "@/server/application/contracts/repositories/arena-match-repository";
import { db } from "@/server/infrastructure/db/drizzle/client";
import { arenaMatches, coinLedger, wallets } from "@/server/infrastructure/db/drizzle/schema";

type Executor = Pick<typeof db, "select">;

async function countRewarded(executor: Executor, userId: string, since: Date) {
  const [rewarded] = await executor
    .select({ value: count() })
    .from(arenaMatches)
    .where(
      and(
        eq(arenaMatches.userId, userId),
        gte(arenaMatches.finishedAt, since),
        gt(arenaMatches.reward, 0),
      ),
    );
  return rewarded?.value ?? 0;
}

class DrizzleArenaMatchRepository implements ArenaMatchRepository {
  async countRewardedSince(userId: string, since: Date): Promise<number> {
    return countRewarded(db, userId, since);
  }

  async start(userId: string, difficulty: ArenaDifficulty): Promise<{ id: string }> {
    const [match] = await db
      .insert(arenaMatches)
      .values({ userId, difficulty })
      .returning({ id: arenaMatches.id });
    return match;
  }

  async claimWin(input: ArenaWinClaim): Promise<ArenaWinClaimResult> {
    return db.transaction(async (tx) => {
      const [match] = await tx
        .select()
        .from(arenaMatches)
        .where(and(eq(arenaMatches.id, input.matchId), eq(arenaMatches.userId, input.userId)))
        .for("update")
        .limit(1);
      if (!match || !isArenaDifficulty(match.difficulty)) return { status: "not_found" as const };
      if (match.finishedAt) return { status: "already_finished" as const };
      if (match.startedAt > input.startedBefore) return { status: "too_fast" as const };

      const [wallet] = await tx
        .select({ coins: wallets.coins })
        .from(wallets)
        .where(eq(wallets.userId, input.userId))
        .for("update")
        .limit(1);
      if (!wallet) return { status: "no_wallet" as const };

      const previous = await countRewarded(tx, input.userId, input.dayStart);
      const reward = previous < input.dailyLimit ? input.rewardFor(match.difficulty) : 0;

      await tx
        .update(arenaMatches)
        .set({ finishedAt: new Date(), outcome: "victory", reward })
        .where(eq(arenaMatches.id, match.id));

      if (reward === 0) {
        return {
          status: "ok" as const,
          reward,
          coins: wallet.coins,
          rewardedToday: previous,
        };
      }

      const [credited] = await tx
        .update(wallets)
        .set({ coins: sql`${wallets.coins} + ${reward}` })
        .where(eq(wallets.userId, input.userId))
        .returning({ coins: wallets.coins });
      await tx.insert(coinLedger).values({
        userId: input.userId,
        amount: reward,
        reason: "arena_win",
        balanceAfter: credited.coins,
        referenceId: match.id,
      });
      return {
        status: "ok" as const,
        reward,
        coins: credited.coins,
        rewardedToday: previous + 1,
      };
    });
  }

  async recordDefeat(input: { matchId: string; userId: string }): Promise<ArenaDefeatResult> {
    const owned = and(eq(arenaMatches.id, input.matchId), eq(arenaMatches.userId, input.userId));
    const finished = await db
      .update(arenaMatches)
      .set({ finishedAt: new Date(), outcome: "defeat", reward: 0 })
      .where(and(owned, isNull(arenaMatches.finishedAt)))
      .returning({ id: arenaMatches.id });
    if (finished.length > 0) return { status: "ok" };
    const existing = await db
      .select({ id: arenaMatches.id })
      .from(arenaMatches)
      .where(owned)
      .limit(1);
    return { status: existing.length > 0 ? "already_finished" : "not_found" };
  }
}

export { DrizzleArenaMatchRepository };
