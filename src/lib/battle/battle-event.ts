import type { BattleWinner, Side } from "@/lib/battle/battle-state";
import type { StatusCondition } from "@/lib/value-objects/attack-effect";
import type { EnergyType } from "@/lib/value-objects/card";

type BattleEvent =
  | { type: "battle_start"; firstSide: Side }
  | { type: "turn_start"; side: Side; turn: number }
  | { type: "draw"; side: Side; count: number }
  | { type: "energy_generated"; side: Side; energy: EnergyType }
  | { type: "energy_attached"; side: Side; uid: string; energy: EnergyType }
  | { type: "pokemon_played"; side: Side; uid: string; cardId: string; zone: "active" | "bench" }
  | { type: "evolved"; side: Side; uid: string; fromCardId: string; toCardId: string }
  | { type: "retreated"; side: Side; fromUid: string; toUid: string }
  | { type: "attack"; side: Side; uid: string; attackName: string }
  | { type: "attack_failed"; side: Side; uid: string; reason: "coin" | "confused" }
  | { type: "coin_flip"; side: Side; heads: boolean }
  | { type: "damage"; side: Side; uid: string; amount: number; weakness: boolean }
  | { type: "damage_prevented"; side: Side; uid: string }
  | { type: "heal"; side: Side; uid: string; amount: number }
  | { type: "status_applied"; side: Side; uid: string; condition: StatusCondition }
  | { type: "status_removed"; side: Side; uid: string; condition: StatusCondition }
  | { type: "energy_discarded"; side: Side; uid: string; count: number }
  | { type: "knocked_out"; side: Side; uid: string; cardId: string; points: number }
  | { type: "promoted"; side: Side; uid: string }
  | { type: "game_over"; winner: BattleWinner };

type BattleEventType = BattleEvent["type"];

export type { BattleEvent, BattleEventType };
