import type { BattleAction } from "@/lib/battle/battle-action";
import { canPay } from "@/lib/battle/energy-cost";
import { cardOf, isOpeningTurn, isPlayersFirstTurn } from "@/lib/battle/helpers";
import { MAX_BENCH, type BattleState, type Side } from "@/lib/battle/battle-state";
import { canAttack, canRetreat } from "@/lib/battle/status-conditions";

function legalActions(state: BattleState, side: Side): BattleAction[] {
  if (state.winner || state.phase === "finished") return [];
  if (state.phase === "setup") return legalSetup(state, side);
  if (state.phase === "promote") return legalPromote(state, side);
  if (state.phase !== "main" || state.current !== side) return [];
  const mine = state.sides[side];
  const actions: BattleAction[] = [{ type: "end_turn" }];
  if (mine.currentEnergy) {
    for (const pokemon of [...(mine.active ? [mine.active] : []), ...mine.bench]) {
      actions.push({ type: "attach_energy", targetUid: pokemon.uid });
    }
  }
  if (mine.bench.length < MAX_BENCH) {
    for (const card of mine.hand) {
      if (state.cards[card.cardId]?.stage === "basic") {
        actions.push({ type: "play_basic", handUid: card.uid });
      }
    }
  }
  if (!isPlayersFirstTurn(state)) {
    for (const card of mine.hand) {
      const data = state.cards[card.cardId];
      if (!data?.evolvesFromId) continue;
      for (const pokemon of [...(mine.active ? [mine.active] : []), ...mine.bench]) {
        if (pokemon.cardId === data.evolvesFromId && pokemon.playedTurn !== state.turn) {
          actions.push({ type: "evolve", handUid: card.uid, targetUid: pokemon.uid });
        }
      }
    }
  }
  const active = mine.active;
  if (active && !mine.retreated && canRetreat(active) && active.energies.length >= cardOf(state, active).retreatCost) {
    for (const pokemon of mine.bench) {
      actions.push({ type: "retreat", benchUid: pokemon.uid });
    }
  }
  if (active && !isOpeningTurn(state) && canAttack(active) && state.sides[side === "player" ? "cpu" : "player"].active) {
    cardOf(state, active).attacks.forEach((attack, attackIndex) => {
      if (canPay(active.energies, attack.energyCost)) {
        actions.push({ type: "attack", attackIndex });
      }
    });
  }
  return actions;
}

function legalSetup(state: BattleState, side: Side): BattleAction[] {
  if (state.sides[side].setupDone) return [];
  const basics = state.sides[side].hand.filter((card) => state.cards[card.cardId]?.stage === "basic");
  if (basics.length === 0) return [];
  const actions: BattleAction[] = [];
  for (const active of basics) {
    const rest = basics.filter((card) => card.uid !== active.uid).slice(0, MAX_BENCH);
    actions.push({ type: "setup", activeUid: active.uid, benchUids: rest.map((card) => card.uid) });
  }
  return actions;
}

function legalPromote(state: BattleState, side: Side): BattleAction[] {
  if (!state.pendingPromotion.includes(side)) return [];
  return state.sides[side].bench.map((pokemon) => ({ type: "promote" as const, benchUid: pokemon.uid }));
}

function isLegal(state: BattleState, side: Side, action: BattleAction): boolean {
  return legalActions(state, side).some((item) => sameAction(item, action));
}

function sameAction(left: BattleAction, right: BattleAction): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export { isLegal, legalActions };
