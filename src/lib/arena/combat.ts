import type { ChargeLevel } from "./charge";

type AttackKind = "melee" | "fire";

type AttackKey = "1" | "2";

type Point = {
  x: number;
  y: number;
};

type HitResult = {
  hp: number;
  applied: boolean;
  dealt: number;
};

type CrackSize = {
  radius: number;
  branches: number;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type AimTip = {
  x: number;
  y: number;
  reaches: boolean;
};

type BlockHit = {
  x: number;
  y: number;
  distance: number;
  index: number;
};

type BeamStop = "block" | "fighter" | "range";

type BeamEnd = {
  x: number;
  y: number;
  distance: number;
  stop: BeamStop;
  block?: number;
};

type HitTag = "critical" | "charged" | "super" | "resisted";

type ImpactTier = "light" | "medium" | "heavy";

type BonePhase = "out" | "back";

// Osso do Ossomerang: vai em linha reta até `BONE_RANGE` e volta perseguindo
// quem lançou. Acerta o alvo no máximo uma vez em cada sentido.
type BoneFlight = {
  x: number;
  y: number;
  ux: number;
  uy: number;
  travelled: number;
  phase: BonePhase;
  struck: Record<BonePhase, boolean>;
};

type BoneStep = {
  flight: BoneFlight;
  hit: BeamEnd | null;
  done: boolean;
};

type ResolvedHit = {
  damage: number;
  tags: HitTag[];
};

const MELEE_COOLDOWN_MS = 460;
const FIRE_COOLDOWN_MS = 720;
const MELEE_RANGE = 124;
// Quem avança para o corpo a corpo leva menos dano à distância durante o golpe.
const MELEE_GUARD_MS = 260;
const MELEE_GUARD_RATIO = 0.5;
const PROJECTILE_SPEED = 480;
const AIM_LENGTH = 160;
const BEAM_RANGE = 520;
const BEAM_TARGET_RADIUS = 36;
const ORB_SPEED = 820;
const ORB_RANGE = 760;
const ORB_RADIUS = 16;
const ORB_SPREAD = Math.PI / 6;
const BONE_SPEED = 640;
const BONE_RANGE = 420;
const BONE_RADIUS = 14;
const BONE_SPREAD = Math.PI / 10;
const BONE_CATCH_RADIUS = 28;
// Estrelas do Meteoro: curvam para o alvo com giro limitado, então o dash
// ou uma curva fechada ainda escapam.
const STAR_SPEED = 700;
const STAR_RANGE = 680;
const STAR_RADIUS = 12;
const STAR_SPREAD = Math.PI / 9;
const STAR_TURN_RATE = Math.PI * 1.1;
const CRACK_RADIUS_MIN = 36;
const CRACK_RADIUS_MAX = 140;
const CRACK_BRANCH_MIN = 5;
const CRACK_BRANCH_MAX = 12;
const CRIT_CHANCE = 0.1;
const CRIT_MULTIPLIER = 1.5;
const MEDIUM_IMPACT = 8;
const HEAVY_IMPACT = 14;
const FALLBACK_ATTACK_DAMAGE = 30;

const DAMAGE_SCALE: Record<AttackKind, number> = {
  melee: 0.4,
  fire: 0.18,
};

const DAMAGE_CAP: Record<AttackKind, number> = {
  melee: 0.16,
  fire: 0.08,
};

const COOLDOWN_MS: Record<AttackKind, number> = {
  melee: MELEE_COOLDOWN_MS,
  fire: FIRE_COOLDOWN_MS,
};

function selectAttack(
  current: AttackKind,
  input: { key?: AttackKey; wheel?: number },
): AttackKind {
  if (input.key === "1") return "melee";
  if (input.key === "2") return "fire";
  if (typeof input.wheel === "number" && input.wheel !== 0) {
    return current === "melee" ? "fire" : "melee";
  }
  return current;
}

function canAttack(now: number, readyAt: number) {
  return now >= readyAt;
}

function nextReadyAt(now: number, cooldownMs: number) {
  return now + cooldownMs;
}

function applyHit(hp: number, damage: number, alreadyHit: boolean): HitResult {
  if (alreadyHit || damage <= 0 || hp <= 0) {
    return { hp, applied: false, dealt: 0 };
  }
  const dealt = Math.min(hp, damage);
  return { hp: hp - dealt, applied: true, dealt };
}

function meleeConnect(
  attacker: Point,
  target: Point,
  aim: Point,
  range: number,
): boolean {
  const dx = target.x - attacker.x;
  const dy = target.y - attacker.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || distance > range) return false;
  const aimLength = Math.hypot(aim.x, aim.y);
  if (aimLength === 0) return false;
  const dot =
    (dx / distance) * (aim.x / aimLength) +
    (dy / distance) * (aim.y / aimLength);
  return dot > 0;
}

function attackPower(kind: AttackKind, attackDamage: number, targetMaxHp: number) {
  const power = attackDamage > 0 ? attackDamage : FALLBACK_ATTACK_DAMAGE;
  const base = Math.round(power * DAMAGE_SCALE[kind]);
  const cap = Math.max(1, Math.round(targetMaxHp * DAMAGE_CAP[kind]));
  return Math.min(Math.max(base, 1), cap);
}

function aimTip(from: Point, to: Point, maxLength = AIM_LENGTH): AimTip | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || maxLength <= 0) return null;
  const length = Math.min(distance, maxLength);
  return {
    x: from.x + (dx / distance) * length,
    y: from.y + (dy / distance) * length,
    reaches: distance <= maxLength,
  };
}

function segmentEntry(from: Point, dx: number, dy: number, block: Rect) {
  const minX = block.x - block.width / 2;
  const maxX = block.x + block.width / 2;
  const minY = block.y - block.height / 2;
  const maxY = block.y + block.height / 2;
  const p = [-dx, dx, -dy, dy];
  const q = [from.x - minX, maxX - from.x, from.y - minY, maxY - from.y];
  let enter = 0;
  let exit = 1;
  for (let index = 0; index < 4; index += 1) {
    const side = p[index] ?? 0;
    const distance = q[index] ?? 0;
    if (side === 0) {
      if (distance < 0) return null;
      continue;
    }
    const t = distance / side;
    if (side < 0) {
      if (t > exit) return null;
      if (t > enter) enter = t;
    } else {
      if (t < enter) return null;
      if (t < exit) exit = t;
    }
  }
  return enter;
}

function firstBlockHit(from: Point, to: Point, blocks: Rect[]): BlockHit | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let best: BlockHit | null = null;
  blocks.forEach((block, index) => {
    const enter = segmentEntry(from, dx, dy, block);
    if (enter === null) return;
    const distance = enter * Math.hypot(dx, dy);
    if (best && distance >= best.distance) return;
    best = {
      x: from.x + dx * enter,
      y: from.y + dy * enter,
      distance,
      index,
    };
  });
  return best;
}

function circleEntry(from: Point, dx: number, dy: number, center: Point, radius: number) {
  const offsetX = from.x - center.x;
  const offsetY = from.y - center.y;
  const a = dx * dx + dy * dy;
  const reach = offsetX * offsetX + offsetY * offsetY;
  if (a === 0) return reach <= radius * radius ? 0 : null;
  const b = 2 * (offsetX * dx + offsetY * dy);
  const c = reach - radius * radius;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const root = Math.sqrt(disc);
  const near = (-b - root) / (2 * a);
  const far = (-b + root) / (2 * a);
  if (near >= 0 && near <= 1) return near;
  if (far >= 0 && far <= 1) return Math.max(near, 0);
  return null;
}

function beamImpact(
  from: Point,
  direction: Point,
  maxLength: number,
  blocks: Rect[],
  target: Point | null,
  targetRadius = BEAM_TARGET_RADIUS,
): BeamEnd {
  const length = Math.hypot(direction.x, direction.y);
  if (length === 0 || maxLength <= 0) {
    return { x: from.x, y: from.y, distance: 0, stop: "range" };
  }
  const ux = direction.x / length;
  const uy = direction.y / length;
  const to = { x: from.x + ux * maxLength, y: from.y + uy * maxLength };
  let best: BeamEnd = { x: to.x, y: to.y, distance: maxLength, stop: "range" };
  const block = firstBlockHit(from, to, blocks);
  if (block && block.distance < best.distance) {
    best = {
      x: block.x,
      y: block.y,
      distance: block.distance,
      stop: "block",
      block: block.index,
    };
  }
  if (!target || targetRadius < 0) return best;
  const enter = circleEntry(from, ux * maxLength, uy * maxLength, target, targetRadius);
  if (enter === null) return best;
  const distance = enter * maxLength;
  if (distance >= best.distance) return best;
  return {
    x: from.x + ux * distance,
    y: from.y + uy * distance,
    distance,
    stop: "fighter",
  };
}

function rotate(vector: Point, angle: number): Point {
  return {
    x: vector.x * Math.cos(angle) - vector.y * Math.sin(angle),
    y: vector.x * Math.sin(angle) + vector.y * Math.cos(angle),
  };
}

function orbVolley(aim: Point, charge: ChargeLevel): Point[] {
  const length = Math.hypot(aim.x, aim.y);
  if (length === 0) return [];
  const center = { x: aim.x / length, y: aim.y / length };
  if (charge < 2) return [center];
  return [center, rotate(center, -ORB_SPREAD), rotate(center, ORB_SPREAD)];
}

function boneVolley(aim: Point, charge: ChargeLevel): Point[] {
  const length = Math.hypot(aim.x, aim.y);
  if (length === 0) return [];
  const center = { x: aim.x / length, y: aim.y / length };
  if (charge < 2) return [center];
  return [rotate(center, -BONE_SPREAD), rotate(center, BONE_SPREAD)];
}

const STAR_COUNT: Record<ChargeLevel, number> = { 0: 2, 1: 3, 2: 5 };

function starVolley(aim: Point, charge: ChargeLevel): Point[] {
  const length = Math.hypot(aim.x, aim.y);
  if (length === 0) return [];
  const center = { x: aim.x / length, y: aim.y / length };
  const count = STAR_COUNT[charge];
  return Array.from({ length: count }, (_, index) =>
    rotate(center, (index - (count - 1) / 2) * STAR_SPREAD),
  );
}

// Gira o rumo unitário em direção ao alvo, no máximo `maxTurn` radianos.
function steerToward(heading: Point, toTarget: Point | null, maxTurn: number): Point {
  if (!toTarget || Math.hypot(toTarget.x, toTarget.y) === 0) return heading;
  const angle = Math.atan2(
    heading.x * toTarget.y - heading.y * toTarget.x,
    heading.x * toTarget.x + heading.y * toTarget.y,
  );
  return rotate(heading, Math.max(-maxTurn, Math.min(maxTurn, angle)));
}

function throwBone(from: Point, direction: Point): BoneFlight | null {
  const length = Math.hypot(direction.x, direction.y);
  if (length === 0) return null;
  return {
    x: from.x,
    y: from.y,
    ux: direction.x / length,
    uy: direction.y / length,
    travelled: 0,
    phase: "out",
    struck: { out: false, back: false },
  };
}

function boneStep(
  flight: BoneFlight,
  distance: number,
  owner: Point,
  target: Point | null,
  blocks: Rect[],
  radius = BONE_RADIUS,
): BoneStep {
  if (distance <= 0) return { flight, hit: null, done: false };
  let { ux, uy } = flight;
  let step = distance;
  if (flight.phase === "out") {
    step = Math.min(distance, BONE_RANGE - flight.travelled);
  } else {
    const dx = owner.x - flight.x;
    const dy = owner.y - flight.y;
    const gap = Math.hypot(dx, dy);
    if (gap <= BONE_CATCH_RADIUS + distance) {
      return { flight: { ...flight, x: owner.x, y: owner.y }, hit: null, done: true };
    }
    ux = dx / gap;
    uy = dy / gap;
  }
  const reach = BEAM_TARGET_RADIUS + radius;
  // Só conta a entrada no alvo: se já está dentro (passou por ele), ignora.
  const inside =
    target !== null && Math.hypot(target.x - flight.x, target.y - flight.y) <= reach;
  const aimed = flight.struck[flight.phase] || inside ? null : target;
  const impact = beamImpact(flight, { x: ux, y: uy }, step, blocks, aimed, reach);
  const travelled = flight.travelled + impact.distance;
  if (impact.stop === "block") {
    return { flight: { ...flight, x: impact.x, y: impact.y, ux, uy, travelled }, hit: impact, done: true };
  }
  const struck =
    impact.stop === "fighter" ? { ...flight.struck, [flight.phase]: true } : flight.struck;
  const turning = flight.phase === "out" && impact.stop === "range" && travelled >= BONE_RANGE;
  const next: BoneFlight = {
    x: impact.x,
    y: impact.y,
    ux,
    uy,
    travelled,
    phase: turning ? "back" : flight.phase,
    struck,
  };
  // Teto de segurança: dono fugindo para sempre não deixa o osso vivo.
  const done = next.phase === "back" && travelled > BONE_RANGE * 3;
  return { flight: next, hit: impact.stop === "fighter" ? impact : null, done };
}

function crackSize(damage: number): CrackSize {
  const amount = Math.max(0, damage);
  return {
    radius: Math.min(
      CRACK_RADIUS_MAX,
      Math.max(CRACK_RADIUS_MIN, CRACK_RADIUS_MIN + amount * 4),
    ),
    branches: Math.min(
      CRACK_BRANCH_MAX,
      CRACK_BRANCH_MIN + Math.floor(amount / 5),
    ),
  };
}

function rollCritical(rng: () => number, chance = CRIT_CHANCE) {
  if (chance <= 0) return false;
  return rng() < chance;
}

function resolveDamage(base: number, options: { critical: boolean }): ResolvedHit {
  if (base <= 0) return { damage: 0, tags: [] };
  if (!options.critical) return { damage: base, tags: [] };
  return { damage: Math.round(base * CRIT_MULTIPLIER), tags: ["critical"] };
}

function guardHit(hit: ResolvedHit, guarded: boolean): ResolvedHit {
  if (!guarded || hit.damage <= 0) return hit;
  return {
    damage: Math.max(1, Math.round(hit.damage * MELEE_GUARD_RATIO)),
    tags: [...hit.tags, "resisted"],
  };
}

function impactTier(damage: number, critical = false): ImpactTier {
  if (critical || damage >= HEAVY_IMPACT) return "heavy";
  if (damage >= MEDIUM_IMPACT) return "medium";
  return "light";
}

export {
  AIM_LENGTH,
  aimTip,
  attackPower,
  applyHit,
  BEAM_RANGE,
  BEAM_TARGET_RADIUS,
  beamImpact,
  BONE_CATCH_RADIUS,
  BONE_RADIUS,
  BONE_RANGE,
  BONE_SPEED,
  BONE_SPREAD,
  boneStep,
  boneVolley,
  canAttack,
  COOLDOWN_MS,
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  crackSize,
  DAMAGE_CAP,
  DAMAGE_SCALE,
  FALLBACK_ATTACK_DAMAGE,
  firstBlockHit,
  guardHit,
  impactTier,
  MELEE_GUARD_MS,
  MELEE_GUARD_RATIO,
  MELEE_RANGE,
  meleeConnect,
  nextReadyAt,
  ORB_RADIUS,
  ORB_RANGE,
  ORB_SPEED,
  ORB_SPREAD,
  orbVolley,
  PROJECTILE_SPEED,
  resolveDamage,
  rollCritical,
  selectAttack,
  STAR_RADIUS,
  STAR_RANGE,
  STAR_SPEED,
  STAR_SPREAD,
  STAR_TURN_RATE,
  starVolley,
  steerToward,
  throwBone,
};
export type {
  AimTip,
  AttackKey,
  AttackKind,
  BeamEnd,
  BeamStop,
  BlockHit,
  BoneFlight,
  BonePhase,
  BoneStep,
  CrackSize,
  HitResult,
  HitTag,
  ImpactTier,
  Point,
  Rect,
  ResolvedHit,
};
