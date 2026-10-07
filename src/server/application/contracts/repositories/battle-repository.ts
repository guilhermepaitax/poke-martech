import type { BattleCardData, BattleState } from "@/lib/battle/battle-state";
import type { BattleStatus } from "@/lib/value-objects/battle";
import type { Battle } from "@/server/application/entities/battle-match";
import type { ActiveBattleSummary } from "@/types/battle";

interface BattleRepository {
  findById(id: string, userId: string): Promise<Battle | null>;
  findActiveByUser(userId: string): Promise<ActiveBattleSummary | null>;
  create(input: {
    userId: string;
    opponentId: string;
    deckId: string;
    state: BattleState;
    rewardCoins: number;
  }): Promise<string>;
  update(input: {
    id: string;
    userId: string;
    expectedVersion: number;
    state: BattleState;
    status: BattleStatus;
    rewardCoins?: number;
  }): Promise<{ ok: true } | { ok: false; reason: "conflict" | "not_found" }>;
  loadCards(cardIds: string[]): Promise<BattleCardData[]>;
}

export type { BattleRepository };
