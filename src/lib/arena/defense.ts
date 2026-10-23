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
// Parry: golpe que chega logo depois de levantar a guarda é anulado e
// devolvido. Baixar a guarda fecha a janela por um tempo (sem spam de Shift).
const PARRY_WINDOW_MS = 100;
const PARRY_COOLDOWN_MS = 500;

type GuardState = {
  meter: number;
  brokenUntil: number;
  // Último instante em que a guarda foi usada (defendendo ou bloqueando).
  usedAt: number;
  // Quando a guarda subiu e se esse levantar ainda vale parry.
  raisedAt: number;
  parryOpen: boolean;
  // Duração da janela desse levantar (a CPU usa uma janela própria).
  parryWindowMs: number;
  parryReadyAt: number;
  // Último contra-ataque: um só por levantar.
  counteredAt: number;
};

type GuardSpend = {
  guard: GuardState;
  broke: boolean;
};

function freshGuard(): GuardState {
  return {
    meter: GUARD_MAX,
    brokenUntil: 0,
    usedAt: -Infinity,
    raisedAt: -Infinity,
    parryOpen: false,
    parryWindowMs: PARRY_WINDOW_MS,
    parryReadyAt: 0,
    counteredAt: -Infinity,
  };
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
  if (meter > 0) return { guard: { ...guard, meter, usedAt: now }, broke: false };
  return { guard: { ...guard, meter: 0, brokenUntil: now + GUARD_BREAK_MS, usedAt: now }, broke: true };
}

function raiseGuard(guard: GuardState, now: number, windowMs = PARRY_WINDOW_MS): GuardState {
  return {
    ...guard,
    usedAt: now,
    raisedAt: now,
    parryOpen: now >= guard.parryReadyAt,
    parryWindowMs: windowMs,
  };
}

function lowerGuard(guard: GuardState, now: number): GuardState {
  return { ...guard, parryOpen: false, parryReadyAt: now + PARRY_COOLDOWN_MS };
}

function isParry(guard: GuardState, now: number) {
  return guard.parryOpen && now - guard.raisedAt <= guard.parryWindowMs;
}

function canCounter(guard: GuardState) {
  return guard.counteredAt < guard.raisedAt;
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
  canCounter,
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
  isParry,
  lowerGuard,
  PARRY_COOLDOWN_MS,
  PARRY_WINDOW_MS,
  raiseGuard,
  regenGuard,
  spendGuard,
};
export type { GuardSpend, GuardState };
