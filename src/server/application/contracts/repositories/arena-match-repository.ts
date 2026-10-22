import type { ArenaDifficulty } from "@/lib/arena/cpu";

type ArenaWinClaim = {
  matchId: string;
  userId: string;
  startedBefore: Date;
  dayStart: Date;
  rewardFor: (difficulty: ArenaDifficulty) => number;
  dailyLimit: number;
};

type ArenaWinClaimResult =
  | { status: "ok"; reward: number; coins: number; rewardedToday: number }
  | { status: "not_found" | "already_finished" | "too_fast" | "no_wallet" };

type ArenaDefeatResult = { status: "ok" | "not_found" | "already_finished" };

interface ArenaMatchRepository {
  countRewardedSince(userId: string, since: Date): Promise<number>;
  start(userId: string, difficulty: ArenaDifficulty): Promise<{ id: string }>;
  claimWin(input: ArenaWinClaim): Promise<ArenaWinClaimResult>;
  recordDefeat(input: { matchId: string; userId: string }): Promise<ArenaDefeatResult>;
}

export type { ArenaDefeatResult, ArenaMatchRepository, ArenaWinClaim, ArenaWinClaimResult };
