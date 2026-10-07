import type { BattleDifficulty } from "@/lib/value-objects/battle";
import type { EnergyType } from "@/lib/value-objects/card";
import type { DeckCardInput } from "@/types/battle";

class BattleDeck {
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly name: string,
    readonly energyTypes: EnergyType[],
    readonly cards: DeckCardInput[],
  ) {}
}

class BattleOpponent {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly slug: string,
    readonly avatarUrl: string | null,
    readonly description: string,
    readonly difficulty: BattleDifficulty,
    readonly rewardCoins: number,
    readonly energyTypes: EnergyType[],
    readonly active: boolean,
    readonly sortOrder: number,
    readonly cards: DeckCardInput[],
  ) {}
}

export { BattleDeck, BattleOpponent };
