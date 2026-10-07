import { applyAction } from "@/lib/battle/apply-action";
import type { BattleAction } from "@/lib/battle/battle-action";
import type { BattleEvent } from "@/lib/battle/battle-event";
import { canPay, missingEnergy } from "@/lib/battle/energy-cost";
import { cardOf, remainingHp } from "@/lib/battle/helpers";
import { legalActions } from "@/lib/battle/legal-actions";
import type { BattleState, PokemonInPlay } from "@/lib/battle/battle-state";
import type { BattleDifficulty } from "@/lib/value-objects/battle";

const CPU_ACTION_LIMIT = 80;

function playCpuTurn(
  state: BattleState,
  difficulty: BattleDifficulty,
): { state: BattleState; events: BattleEvent[] } {
  return playAuto(state, "cpu", difficulty);
}

function playAuto(
  state: BattleState,
  side: "player" | "cpu",
  difficulty: BattleDifficulty,
): { state: BattleState; events: BattleEvent[] } {
  const events: BattleEvent[] = [];
  let current = state;
  for (let step = 0; step < CPU_ACTION_LIMIT; step += 1) {
    if (!shouldAct(current, side)) break;
    const action = chooseAction(current, side, difficulty);
    if (!action) break;
    const result = applyAction(current, side, action);
    if (!result.ok) {
      if (action.type === "end_turn") break;
      const fallback = applyAction(current, side, { type: "end_turn" });
      if (!fallback.ok) break;
      current = fallback.state;
      events.push(...fallback.events);
      continue;
    }
    current = result.state;
    events.push(...result.events);
  }
  return { state: current, events };
}

function cpuShouldAct(state: BattleState): boolean {
  return shouldAct(state, "cpu");
}

function shouldAct(state: BattleState, side: "player" | "cpu"): boolean {
  if (state.winner) return false;
  if (state.phase === "setup" && !state.sides[side].setupDone) return true;
  if (state.phase === "promote" && state.pendingPromotion.includes(side)) return true;
  return state.phase === "main" && state.current === side;
}

function chooseCpuAction(state: BattleState, difficulty: BattleDifficulty): BattleAction | null {
  return chooseAction(state, "cpu", difficulty);
}

function chooseAction(
  state: BattleState,
  side: "player" | "cpu",
  difficulty: BattleDifficulty,
): BattleAction | null {
  const actions = legalActions(state, side);
  if (actions.length === 0) return null;
  if (difficulty === "easy") return pickEasy(actions);
  return pickBest(state, side, actions);
}

function pickEasy(actions: BattleAction[]): BattleAction {
  const productive = actions.filter((action) => action.type !== "end_turn");
  const pool = productive.length > 0 ? productive : actions;
  return pool[Math.floor(Math.random() * pool.length)] ?? actions[0];
}

function pickBest(state: BattleState, side: "player" | "cpu", actions: BattleAction[]): BattleAction {
  let best = actions[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const action of actions) {
    const score = scoreAction(state, side, action);
    if (score > bestScore) {
      best = action;
      bestScore = score;
    }
  }
  return best;
}

function scoreAction(state: BattleState, side: "player" | "cpu", action: BattleAction): number {
  const mine = state.sides[side];
  const foe = state.sides[side === "cpu" ? "player" : "cpu"];
  switch (action.type) {
    case "setup":
      return 1000 + action.benchUids.length;
    case "promote": {
      const pokemon = mine.bench.find((item) => item.uid === action.benchUid);
      return pokemon ? remainingHp(state, pokemon) + pokemon.energies.length * 10 : 0;
    }
    case "evolve":
      return 80;
    case "play_basic":
      return 50;
    case "attach_energy": {
      const energy = mine.currentEnergy;
      const pokemon = [...(mine.active ? [mine.active] : []), ...mine.bench].find(
        (item) => item.uid === action.targetUid,
      );
      if (!energy || !pokemon) return 0;
      const next = [...pokemon.energies, energy];
      const attacks = cardOf(state, pokemon).attacks;
      const ready = attacks.some((attack) => canPay(next, attack.energyCost));
      const closest = Math.min(...attacks.map((attack) => missingEnergy(next, attack.energyCost)), 9);
      const activeBonus = mine.active?.uid === pokemon.uid ? 8 : 0;
      return 40 + activeBonus + (ready ? 20 : 0) - closest;
    }
    case "retreat": {
      const active = mine.active;
      const incoming = mine.bench.find((item) => item.uid === action.benchUid);
      if (!active || !incoming || !foe.active) return 0;
      const threat = estimatedDamage(state, foe.active, active);
      const desperate = remainingHp(state, active) <= threat;
      const incomingReady = cardOf(state, incoming).attacks.some((attack) =>
        canPay(incoming.energies, attack.energyCost),
      );
      return (desperate ? 35 : -5) + (incomingReady ? 10 : 0);
    }
    case "attack": {
      if (!mine.active || !foe.active) return 0;
      const damage = estimatedDamage(state, mine.active, foe.active, action.attackIndex);
      const ko = remainingHp(state, foe.active) <= damage;
      return 70 + damage + (ko ? 40 : 0);
    }
    case "end_turn":
      return 1;
  }
}

function estimatedDamage(
  state: BattleState,
  attacker: PokemonInPlay,
  defender: PokemonInPlay,
  attackIndex = 0,
): number {
  const attack = cardOf(state, attacker).attacks[attackIndex];
  if (!attack) return 0;
  const weakness =
    cardOf(state, defender).weaknessType === cardOf(state, attacker).energyType
      ? cardOf(state, defender).weaknessModifier
      : 0;
  const damagedBonus = attack.effects
    .filter((effect) => effect.kind === "bonus_if_damaged")
    .reduce((sum, effect) => sum + (attacker.damage > 0 ? effect.amount : 0), 0);
  return (attack.damage ?? 0) + weakness + damagedBonus;
}

export { chooseAction, chooseCpuAction, cpuShouldAct, playAuto, playCpuTurn };
