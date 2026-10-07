import type { BattleState } from "@/lib/battle/battle-state";
import type { BattleStatus } from "@/lib/value-objects/battle";

class Battle {
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly opponentId: string,
    readonly deckId: string | null,
    readonly status: BattleStatus,
    readonly state: BattleState,
    readonly version: number,
    readonly rewardCoins: number,
  ) {}
}

export { Battle };
