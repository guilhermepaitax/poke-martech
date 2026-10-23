import type { ChargeLevel } from "./charge";
import type { ResolvedHit } from "./combat";

// Defesa no Shift: corta o dano e não deixa o lutador em hurt. Cada bloqueio
// gasta guarda; se zerar, a guarda quebra e o golpe atordoa normalmente.
const DEFEND_DAMAGE_RATIO = 0.3;
const DEFEND_MOVE_SCALE = 0.35;
const GUARD_MAX = 100;
const GUARD_COST_BASE = 22;
const GUARD_COST_PER_CHARGE = 18;
const GUARD_REGEN_PER_S = 45;
const GUARD_REGEN_DELAY_MS = 500;
const GUARD_BREAK_MS = 1200;

type GuardState = {
  meter: number;
  brokenUntil: number;
  // Último instante em que a guarda foi usada (defendendo ou bloqueando).
  usedAt: number;
};

type GuardSpend = {
  guard: GuardState;
  broke: boolean;
};

function freshGuard(): GuardState {
  return { meter: GUARD_MAX, brokenUntil: 0, usedAt: -Infinity };
}

function canDefend(now: number, guard: GuardState) {
  return now >= guard.brokenUntil && guard.meter > 0;
}

function defendHit(hit: ResolvedHit): ResolvedHit {
  if (hit.damage <= 0) return hit;
  return {
    damage: Math.max(1, Math.round(hit.damage * DEFEND_DAMAGE_RATIO)),
    tags: [...hit.tags.filter((tag) => tag !== "resisted"), "blocked"],
  };
}

function guardCost(charge: ChargeLevel) {
  return GUARD_COST_BASE + charge * GUARD_COST_PER_CHARGE;
}

function spendGuard(guard: GuardState, charge: ChargeLevel, now: number): GuardSpend {
  const meter = Math.max(0, guard.meter - guardCost(charge));
  if (meter > 0) return { guard: { meter, brokenUntil: guard.brokenUntil, usedAt: now }, broke: false };
  return { guard: { meter: 0, brokenUntil: now + GUARD_BREAK_MS, usedAt: now }, broke: true };
}

// Só recarrega depois de um tempo sem defender; quebrada, volta cheia ao fim da pausa.
function regenGuard(guard: GuardState, deltaMs: number, now: number): GuardState {
  if (guard.meter >= GUARD_MAX || deltaMs <= 0) return guard;
  if (guard.brokenUntil > 0 && now >= guard.brokenUntil && guard.meter === 0) {
    return { ...guard, meter: GUARD_MAX, brokenUntil: 0 };
  }
  if (now < guard.brokenUntil || now - guard.usedAt < GUARD_REGEN_DELAY_MS) return guard;
  return { ...guard, meter: Math.min(GUARD_MAX, guard.meter + (GUARD_REGEN_PER_S * deltaMs) / 1000) };
}

export {
  canDefend,
  DEFEND_DAMAGE_RATIO,
  DEFEND_MOVE_SCALE,
  defendHit,
  freshGuard,
  GUARD_BREAK_MS,
  GUARD_COST_BASE,
  GUARD_COST_PER_CHARGE,
  GUARD_MAX,
  GUARD_REGEN_DELAY_MS,
  GUARD_REGEN_PER_S,
  guardCost,
  regenGuard,
  spendGuard,
};
export type { GuardSpend, GuardState };
