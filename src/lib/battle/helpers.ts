import type { BattleState, PokemonInPlay, Side } from "@/lib/battle/battle-state";
import type { BattleCardData } from "@/lib/battle/battle-state";

function cloneState(state: BattleState): BattleState {
  return structuredClone(state);
}

function cardOf(state: BattleState, pokemon: PokemonInPlay): BattleCardData {
  return state.cards[pokemon.cardId];
}

function remainingHp(state: BattleState, pokemon: PokemonInPlay): number {
  return Math.max(0, cardOf(state, pokemon).hp - pokemon.damage);
}

function isKnockedOut(state: BattleState, pokemon: PokemonInPlay): boolean {
  return remainingHp(state, pokemon) <= 0;
}

function allInPlay(side: BattleState["sides"][Side]): PokemonInPlay[] {
  return [...(side.active ? [side.active] : []), ...side.bench];
}

function findPokemon(side: BattleState["sides"][Side], uid: string): PokemonInPlay | undefined {
  if (side.active?.uid === uid) return side.active;
  return side.bench.find((pokemon) => pokemon.uid === uid);
}

function isPlayersFirstTurn(state: BattleState): boolean {
  return state.turn === 1 || (state.turn === 2 && state.current !== state.firstSide);
}

function isOpeningTurn(state: BattleState): boolean {
  return state.turn === 1 && state.current === state.firstSide;
}

function prizePoints(card: BattleCardData): number {
  return card.frame === "ex" ? 2 : 1;
}

export {
  allInPlay,
  cardOf,
  cloneState,
  findPokemon,
  isKnockedOut,
  isOpeningTurn,
  isPlayersFirstTurn,
  prizePoints,
  remainingHp,
};
