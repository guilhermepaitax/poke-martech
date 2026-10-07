import type { BattleEvent } from "@/lib/battle/battle-event";
import {
  OPENING_HAND,
  type BattleCardData,
  type BattleState,
  type CardInstance,
  type Side,
  type SideState,
} from "@/lib/battle/battle-state";
import { flipCoin, randomInt, shuffle } from "@/lib/battle/rng";
import type { EnergyType } from "@/lib/value-objects/card";

type BattleDeckInput = {
  cards: { card: BattleCardData; copies: number }[];
  energyTypes: EnergyType[];
};

type CreateBattleInput = {
  seed: number;
  player: BattleDeckInput;
  cpu: BattleDeckInput;
};

function createBattle(input: CreateBattleInput): { state: BattleState; events: BattleEvent[] } {
  const cards: Record<string, BattleCardData> = {};
  for (const deck of [input.player, input.cpu]) {
    for (const entry of deck.cards) cards[entry.card.cardId] = entry.card;
  }
  const state: BattleState = {
    rng: input.seed | 0,
    turn: 0,
    firstSide: "player",
    current: "player",
    phase: "setup",
    pendingPromotion: [],
    awaitingTurnAdvance: false,
    checkupDone: false,
    winner: null,
    cards,
    sides: {
      player: emptySide(input.player.energyTypes),
      cpu: emptySide(input.cpu.energyTypes),
    },
  };
  dealSide(state, "player", input.player);
  dealSide(state, "cpu", input.cpu);
  state.firstSide = flipCoin(state) ? "player" : "cpu";
  state.current = state.firstSide;
  return { state, events: [{ type: "battle_start", firstSide: state.firstSide }] };
}

function emptySide(energyTypes: EnergyType[]): SideState {
  return {
    deck: [],
    hand: [],
    discard: [],
    active: null,
    bench: [],
    points: 0,
    energyTypes,
    currentEnergy: null,
    retreated: false,
    setupDone: false,
  };
}

function dealSide(state: BattleState, side: Side, deck: BattleDeckInput) {
  const prefix = side === "player" ? "p" : "c";
  const instances: CardInstance[] = deck.cards.flatMap((entry) =>
    Array.from({ length: entry.copies }, () => ({ uid: "", cardId: entry.card.cardId })),
  );
  const numbered = instances.map((instance, index) => ({ ...instance, uid: `${prefix}${index}` }));
  const basics = numbered.filter((instance) => state.cards[instance.cardId]?.stage === "basic");
  const guaranteed = basics[randomInt(state, basics.length)];
  const rest = shuffle(
    state,
    numbered.filter((instance) => instance.uid !== guaranteed?.uid),
  );
  const hand = guaranteed ? [guaranteed, ...rest.slice(0, OPENING_HAND - 1)] : rest.slice(0, OPENING_HAND);
  state.sides[side].hand = hand;
  state.sides[side].deck = rest.slice(hand.length - (guaranteed ? 1 : 0));
}

export { createBattle };
export type { BattleDeckInput, CreateBattleInput };
