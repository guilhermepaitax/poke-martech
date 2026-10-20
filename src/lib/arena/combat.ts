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
};

type BeamStop = "block" | "fighter" | "range";

type BeamEnd = {
  x: number;
  y: number;
  distance: number;
  stop: BeamStop;
};

type HitTag = "critical" | "super" | "resisted";

type ImpactTier = "light" | "medium" | "heavy";

type ResolvedHit = {
  damage: number;
  tags: HitTag[];
};

const MELEE_COOLDOWN_MS = 560;
const FIRE_COOLDOWN_MS = 720;
const MELEE_RANGE = 88;
const PROJECTILE_SPEED = 480;
const AIM_LENGTH = 160;
const BEAM_RANGE = 520;
const BEAM_TARGET_RADIUS = 36;
const CRACK_RADIUS_MIN = 36;
const CRACK_RADIUS_MAX = 140;
const CRACK_BRANCH_MIN = 5;
const CRACK_BRANCH_MAX = 12;
const CRIT_CHANCE = 0.1;
const CRIT_MULTIPLIER = 1.5;
const MEDIUM_IMPACT = 30;
const HEAVY_IMPACT = 60;

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

function attackPower(kind: AttackKind, attackDamage: number) {
  if (attackDamage <= 0) return 0;
  if (kind === "melee") return attackDamage;
  return Math.round(attackDamage * 0.6);
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
  for (const block of blocks) {
    const enter = segmentEntry(from, dx, dy, block);
    if (enter === null) continue;
    const distance = enter * Math.hypot(dx, dy);
    if (best && distance >= best.distance) continue;
    best = {
      x: from.x + dx * enter,
      y: from.y + dy * enter,
      distance,
    };
  }
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
    best = { x: block.x, y: block.y, distance: block.distance, stop: "block" };
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

function crackSize(damage: number): CrackSize {
  const amount = Math.max(0, damage);
  return {
    radius: Math.min(
      CRACK_RADIUS_MAX,
      Math.max(CRACK_RADIUS_MIN, CRACK_RADIUS_MIN + amount * 1.1),
    ),
    branches: Math.min(
      CRACK_BRANCH_MAX,
      CRACK_BRANCH_MIN + Math.floor(amount / 20),
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
  canAttack,
  COOLDOWN_MS,
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  crackSize,
  firstBlockHit,
  impactTier,
  MELEE_RANGE,
  meleeConnect,
  nextReadyAt,
  PROJECTILE_SPEED,
  resolveDamage,
  rollCritical,
  selectAttack,
};
export type {
  AimTip,
  AttackKey,
  AttackKind,
  BeamEnd,
  BeamStop,
  BlockHit,
  CrackSize,
  HitResult,
  HitTag,
  ImpactTier,
  Point,
  Rect,
  ResolvedHit,
};
