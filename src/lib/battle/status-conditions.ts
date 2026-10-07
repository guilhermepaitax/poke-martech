import type { BattleEvent } from "@/lib/battle/battle-event";
import {
  BURN_DAMAGE,
  POISON_DAMAGE,
  SIDES,
  type BattleState,
  type PokemonInPlay,
  type Side,
} from "@/lib/battle/battle-state";
import { flipCoin } from "@/lib/battle/rng";
import type { StatusCondition } from "@/lib/value-objects/attack-effect";

const EXCLUSIVE_CONDITIONS: StatusCondition[] = ["asleep", "paralyzed", "confused"];

function hasStatus(pokemon: PokemonInPlay, condition: StatusCondition): boolean {
  return pokemon.status.includes(condition);
}

function canAttack(pokemon: PokemonInPlay): boolean {
  return !hasStatus(pokemon, "asleep") && !hasStatus(pokemon, "paralyzed");
}

function canRetreat(pokemon: PokemonInPlay): boolean {
  return canAttack(pokemon);
}

function applyStatus(
  pokemon: PokemonInPlay,
  side: Side,
  condition: StatusCondition,
  events: BattleEvent[],
) {
  if (hasStatus(pokemon, condition)) return;
  if (EXCLUSIVE_CONDITIONS.includes(condition)) {
    for (const existing of pokemon.status.filter((item) => EXCLUSIVE_CONDITIONS.includes(item))) {
      removeStatus(pokemon, side, existing, events);
    }
  }
  pokemon.status.push(condition);
  events.push({ type: "status_applied", side, uid: pokemon.uid, condition });
}

function removeStatus(
  pokemon: PokemonInPlay,
  side: Side,
  condition: StatusCondition,
  events: BattleEvent[],
) {
  if (!hasStatus(pokemon, condition)) return;
  pokemon.status = pokemon.status.filter((item) => item !== condition);
  events.push({ type: "status_removed", side, uid: pokemon.uid, condition });
}

function clearStatus(pokemon: PokemonInPlay, side: Side, events: BattleEvent[]) {
  for (const condition of [...pokemon.status]) removeStatus(pokemon, side, condition, events);
}

function checkup(state: BattleState, endedSide: Side, events: BattleEvent[]) {
  for (const side of SIDES) {
    const active = state.sides[side].active;
    if (!active) continue;
    if (hasStatus(active, "poisoned")) {
      active.damage += POISON_DAMAGE;
      events.push({ type: "damage", side, uid: active.uid, amount: POISON_DAMAGE, weakness: false });
    }
    if (hasStatus(active, "burned")) {
      active.damage += BURN_DAMAGE;
      events.push({ type: "damage", side, uid: active.uid, amount: BURN_DAMAGE, weakness: false });
      const heads = flipCoin(state);
      events.push({ type: "coin_flip", side, heads });
      if (heads) removeStatus(active, side, "burned", events);
    }
    if (hasStatus(active, "asleep")) {
      const heads = flipCoin(state);
      events.push({ type: "coin_flip", side, heads });
      if (heads) removeStatus(active, side, "asleep", events);
    }
    if (side === endedSide && hasStatus(active, "paralyzed")) {
      removeStatus(active, side, "paralyzed", events);
    }
  }
}

export { applyStatus, canAttack, canRetreat, checkup, clearStatus, hasStatus, removeStatus };
