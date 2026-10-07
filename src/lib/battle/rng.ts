import type { BattleState } from "@/lib/battle/battle-state";

function nextRandom(state: BattleState): number {
  state.rng = (state.rng + 0x6d2b79f5) | 0;
  let t = state.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function randomInt(state: BattleState, max: number): number {
  return Math.floor(nextRandom(state) * max);
}

function flipCoin(state: BattleState): boolean {
  return nextRandom(state) < 0.5;
}

function pickRandom<T>(state: BattleState, items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[randomInt(state, items.length)];
}

function shuffle<T>(state: BattleState, items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = randomInt(state, index + 1);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export { flipCoin, nextRandom, pickRandom, randomInt, shuffle };
