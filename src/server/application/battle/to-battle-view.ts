import { legalActions } from "@/lib/battle/legal-actions";
import { cardOf, remainingHp } from "@/lib/battle/helpers";
import type { BattleState, PokemonInPlay, Side } from "@/lib/battle/battle-state";
import type { BattleStatus } from "@/lib/value-objects/battle";
import type {
  BattleOpponentSummary,
  BattlePokemonView,
  BattleSideView,
  BattleView,
} from "@/types/battle";

function toBattleView(input: {
  id: string;
  version: number;
  status: BattleStatus;
  rewardCoins: number;
  opponent: BattleOpponentSummary;
  state: BattleState;
}): BattleView {
  const { state } = input;
  return {
    id: input.id,
    version: input.version,
    status: input.status,
    phase: state.phase,
    current: state.current,
    turn: state.turn,
    firstSide: state.firstSide,
    winner: state.winner,
    pendingPromotion: state.pendingPromotion,
    rewardCoins: input.rewardCoins,
    opponent: input.opponent,
    player: toSideView(state, "player", true),
    cpu: toSideView(state, "cpu", false),
    legalActions: legalActions(state, "player"),
  };
}

function toSideView(state: BattleState, side: Side, revealHand: boolean): BattleSideView {
  const mine = state.sides[side];
  return {
    active: mine.active ? toPokemonView(state, mine.active) : null,
    bench: mine.bench.map((pokemon) => toPokemonView(state, pokemon)),
    hand: revealHand
      ? mine.hand.flatMap((item) => {
          const card = state.cards[item.cardId];
          return card ? [{ ...card, uid: item.uid, cardId: item.cardId }] : [];
        })
      : null,
    handCount: mine.hand.length,
    deckCount: mine.deck.length,
    discardCount: mine.discard.length,
    points: mine.points,
    currentEnergy: mine.currentEnergy,
    energyTypes: mine.energyTypes,
  };
}

function toPokemonView(state: BattleState, pokemon: PokemonInPlay): BattlePokemonView {
  const card = cardOf(state, pokemon);
  return {
    uid: pokemon.uid,
    cardId: pokemon.cardId,
    card,
    damage: pokemon.damage,
    remainingHp: remainingHp(state, pokemon),
    energies: pokemon.energies,
    status: pokemon.status,
  };
}

function statusFromWinner(winner: BattleState["winner"]): BattleStatus {
  if (winner === "player") return "won";
  if (winner === "cpu") return "lost";
  if (winner === "draw") return "lost";
  return "active";
}

export { statusFromWinner, toBattleView };
