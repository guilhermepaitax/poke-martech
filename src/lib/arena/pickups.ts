import type { Point, Rect } from "./combat";

type PickupEffect = "haste" | "fury" | "heal" | "rapid" | "vulnerable";

// Caixa tipada já mostra o efeito; a misteriosa só revela na coleta.
type PickupLook = PickupEffect | "mystery";

type PickupSpec = {
  label: string;
  color: number;
  durationMs: number;
  scale: number;
};

type Buff = {
  effect: PickupEffect;
  until: number;
};

type PickupBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

const PICKUP_SPAWN_MIN_MS = 6000;
const PICKUP_SPAWN_MAX_MS = 10000;
const PICKUP_MAX_ON_MAP = 3;
const PICKUP_LIFETIME_MS = 15000;
const PICKUP_RADIUS = 34;
const PICKUP_FIGHTER_GAP = 160;
const PICKUP_SPOT_TRIES = 20;
const MYSTERY_CHANCE = 0.3;
const HEAL_RATIO = 0.2;
const MYSTERY_COLOR = 0x8a5cff;

const PICKUP_EFFECTS: Record<PickupEffect, PickupSpec> = {
  haste: { label: "VELOCIDADE+", color: 0x4fd8ff, durationMs: 6000, scale: 1.4 },
  fury: { label: "DANO+", color: 0xff5a3a, durationMs: 6000, scale: 1.35 },
  heal: { label: "CURA", color: 0x5dff7a, durationMs: 0, scale: 1 },
  // Multiplica a recarga de ataques e dash: 0 = sem recarga.
  rapid: { label: "SEM RECARGA!", color: 0xffe14a, durationMs: 5000, scale: 0 },
  vulnerable: { label: "VULNERÁVEL!", color: 0xb06bff, durationMs: 5000, scale: 1.4 },
};

const EFFECT_ORDER: readonly PickupEffect[] = ["haste", "fury", "heal", "rapid", "vulnerable"];

// Peso das caixas tipadas: armadilha visível é rara.
const TYPED_WEIGHT: Record<PickupEffect, number> = {
  haste: 3,
  fury: 3,
  heal: 3,
  rapid: 2,
  vulnerable: 1,
};

function pickWeighted(rng: () => number): PickupEffect {
  const total = EFFECT_ORDER.reduce((sum, effect) => sum + TYPED_WEIGHT[effect], 0);
  let roll = rng() * total;
  for (const effect of EFFECT_ORDER) {
    roll -= TYPED_WEIGHT[effect];
    if (roll < 0) return effect;
  }
  return EFFECT_ORDER[EFFECT_ORDER.length - 1] ?? "heal";
}

function rollPickup(rng: () => number): PickupLook {
  if (rng() < MYSTERY_CHANCE) return "mystery";
  return pickWeighted(rng);
}

function revealPickup(look: PickupLook, rng: () => number): PickupEffect {
  if (look !== "mystery") return look;
  const index = Math.min(EFFECT_ORDER.length - 1, Math.floor(rng() * EFFECT_ORDER.length));
  return EFFECT_ORDER[index] ?? "heal";
}

function pickupDelay(rng: () => number) {
  return PICKUP_SPAWN_MIN_MS + rng() * (PICKUP_SPAWN_MAX_MS - PICKUP_SPAWN_MIN_MS);
}

function insideBlock(spot: Point, block: Rect, pad: number) {
  return (
    Math.abs(spot.x - block.x) <= block.width / 2 + pad &&
    Math.abs(spot.y - block.y) <= block.height / 2 + pad
  );
}

function pickupSpot(
  rng: () => number,
  bounds: PickupBounds,
  blocks: Rect[],
  avoid: Point[],
  tries = PICKUP_SPOT_TRIES,
): Point | null {
  const left = bounds.left + PICKUP_RADIUS;
  const top = bounds.top + PICKUP_RADIUS;
  const width = bounds.right - bounds.left - PICKUP_RADIUS * 2;
  const height = bounds.bottom - bounds.top - PICKUP_RADIUS * 2;
  if (width <= 0 || height <= 0) return null;
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const spot = { x: left + rng() * width, y: top + rng() * height };
    if (blocks.some((block) => insideBlock(spot, block, PICKUP_RADIUS))) continue;
    if (avoid.some((point) => Math.hypot(point.x - spot.x, point.y - spot.y) < PICKUP_FIGHTER_GAP)) {
      continue;
    }
    return spot;
  }
  return null;
}

function activeBuffs(buffs: readonly Buff[], now: number) {
  return buffs.filter((buff) => buff.until > now);
}

// Mesmo efeito não empilha: só renova a duração.
function addBuff(buffs: readonly Buff[], effect: PickupEffect, now: number): Buff[] {
  const durationMs = PICKUP_EFFECTS[effect].durationMs;
  const rest = activeBuffs(buffs, now).filter((buff) => buff.effect !== effect);
  if (durationMs <= 0) return rest;
  return [...rest, { effect, until: now + durationMs }];
}

function buffScale(buffs: readonly Buff[], effect: PickupEffect, now: number) {
  return buffs.some((buff) => buff.effect === effect && buff.until > now)
    ? PICKUP_EFFECTS[effect].scale
    : 1;
}

function healAmount(maxHp: number) {
  return Math.max(1, Math.round(maxHp * HEAL_RATIO));
}

export {
  activeBuffs,
  addBuff,
  buffScale,
  healAmount,
  MYSTERY_CHANCE,
  MYSTERY_COLOR,
  PICKUP_EFFECTS,
  PICKUP_FIGHTER_GAP,
  PICKUP_LIFETIME_MS,
  PICKUP_MAX_ON_MAP,
  PICKUP_RADIUS,
  PICKUP_SPAWN_MAX_MS,
  PICKUP_SPAWN_MIN_MS,
  pickupDelay,
  pickupSpot,
  revealPickup,
  rollPickup,
};
export type { Buff, PickupBounds, PickupEffect, PickupLook, PickupSpec };
