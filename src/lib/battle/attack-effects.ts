import type { BattleEvent } from "@/lib/battle/battle-event";
import { otherSide, type BattleState, type PokemonInPlay, type Side } from "@/lib/battle/battle-state";
import { flipCoin, pickRandom } from "@/lib/battle/rng";
import { applyStatus } from "@/lib/battle/status-conditions";
import type { AttackEffect } from "@/lib/value-objects/attack-effect";

function applyAttackEffects(input: {
  state: BattleState;
  side: Side;
  attacker: PokemonInPlay;
  defender: PokemonInPlay | null;
  effects: AttackEffect[];
  events: BattleEvent[];
}) {
  const { state, side, attacker, defender, events } = input;
  const foe = otherSide(side);
  for (const effect of input.effects) {
    switch (effect.kind) {
      case "heal_self": {
        const amount = Math.min(effect.amount, attacker.damage);
        attacker.damage -= amount;
        events.push({ type: "heal", side, uid: attacker.uid, amount });
        break;
      }
      case "status": {
        const target = effect.target === "self" ? attacker : defender;
        const targetSide = effect.target === "self" ? side : foe;
        if (!target) break;
        if (effect.coinFlip) {
          const heads = flipCoin(state);
          events.push({ type: "coin_flip", side, heads });
          if (!heads) break;
        }
        applyStatus(target, targetSide, effect.condition, events);
        break;
      }
      case "bench_damage": {
        const bench = state.sides[foe].bench;
        if (bench.length === 0) break;
        const targets = effect.scope === "all" ? bench : [pickRandom(state, bench)].filter((item) => item !== undefined);
        for (const pokemon of targets) {
          pokemon.damage += effect.amount;
          events.push({ type: "damage", side: foe, uid: pokemon.uid, amount: effect.amount, weakness: false });
        }
        break;
      }
      case "self_damage": {
        attacker.damage += effect.amount;
        events.push({ type: "damage", side, uid: attacker.uid, amount: effect.amount, weakness: false });
        break;
      }
      case "discard_energy": {
        const target = effect.target === "self" ? attacker : defender;
        const targetSide = effect.target === "self" ? side : foe;
        if (!target) break;
        const count = Math.min(effect.count, target.energies.length);
        target.energies.splice(target.energies.length - count, count);
        events.push({ type: "energy_discarded", side: targetSide, uid: target.uid, count });
        break;
      }
      case "draw_cards":
        drawCards(state, side, effect.count, events);
        break;
      case "attach_energy_self": {
        const energy = state.sides[side].currentEnergy ?? pickRandom(state, state.sides[side].energyTypes);
        if (!energy) break;
        for (let index = 0; index < effect.count; index += 1) attacker.energies.push(energy);
        events.push({ type: "energy_attached", side, uid: attacker.uid, energy });
        break;
      }
      case "prevent_damage_next_turn": {
        if (effect.coinFlip) {
          const heads = flipCoin(state);
          events.push({ type: "coin_flip", side, heads });
          if (!heads) break;
        }
        attacker.preventDamage = true;
        break;
      }
      case "coin_bonus":
      case "coin_or_nothing":
      case "bonus_if_damaged":
        break;
    }
  }
}

function extraDamage(
  state: BattleState,
  attacker: PokemonInPlay,
  effects: AttackEffect[],
  events: BattleEvent[],
  side: Side,
): number {
  let extra = 0;
  for (const effect of effects) {
    if (effect.kind === "coin_bonus") {
      for (let index = 0; index < effect.coins; index += 1) {
        const heads = flipCoin(state);
        events.push({ type: "coin_flip", side, heads });
        extra += heads ? effect.amountPerHeads : 0;
      }
    }
    if (effect.kind === "bonus_if_damaged" && attacker.damage > 0) extra += effect.amount;
  }
  return extra;
}

function attackSucceeds(state: BattleState, effects: AttackEffect[], events: BattleEvent[], side: Side): boolean {
  if (!effects.some((effect) => effect.kind === "coin_or_nothing")) return true;
  const heads = flipCoin(state);
  events.push({ type: "coin_flip", side, heads });
  return heads;
}

function drawCards(state: BattleState, side: Side, count: number, events: BattleEvent[]) {
  const mine = state.sides[side];
  let drawn = 0;
  for (let index = 0; index < count; index += 1) {
    const next = mine.deck.shift();
    if (!next) break;
    mine.hand.push(next);
    drawn += 1;
  }
  if (drawn > 0) events.push({ type: "draw", side, count: drawn });
}

function dealDamage(input: {
  state: BattleState;
  attacker: PokemonInPlay;
  defender: PokemonInPlay;
  side: Side;
  amount: number;
  weakness: boolean;
  events: BattleEvent[];
}) {
  const foe = otherSide(input.side);
  if (input.defender.preventDamage) {
    input.events.push({ type: "damage_prevented", side: foe, uid: input.defender.uid });
    return;
  }
  input.defender.damage += input.amount;
  input.events.push({
    type: "damage",
    side: foe,
    uid: input.defender.uid,
    amount: input.amount,
    weakness: input.weakness,
  });
}

export { applyAttackEffects, attackSucceeds, dealDamage, drawCards, extraDamage };
