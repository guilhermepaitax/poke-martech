import {
  BEAM_RANGE,
  canAttack,
  MELEE_RANGE,
  type AttackKind,
  type Point,
} from "@/lib/arena/combat";
import { normalizeMove, type MoveVector } from "@/lib/arena/movement";
import type { PickupLook } from "@/lib/arena/pickups";

const CPU_MELEE_RANGE = MELEE_RANGE;
const CPU_HOLD_DISTANCE = Math.round(MELEE_RANGE * 0.7);
// Até onde um corpo a corpo do jogador assusta a CPU a ponto de defender.
const CPU_DEFEND_MELEE_RANGE = Math.round(MELEE_RANGE * 1.4);

type ArenaDifficulty = "easy" | "normal" | "hard";

type CpuProfile = {
  speed: number;
  cooldownScale: number;
  damageScale: number;
  fireRange: number;
  // Até onde a CPU desvia do alvo para buscar um consumível.
  pickupReach: number;
  // Chance de defender quando o jogador ataca e por quanto tempo segura.
  defendChance: number;
  defendMs: number;
  // Fração das defesas que sai no tempo do parry.
  parryChance: number;
};

const CPU_PROFILES: Record<ArenaDifficulty, CpuProfile> = {
  easy: {
    speed: 210,
    cooldownScale: 2.5,
    damageScale: 0.55,
    fireRange: Math.round(BEAM_RANGE * 0.4),
    pickupReach: 200,
    defendChance: 0.15,
    defendMs: 350,
    parryChance: 0,
  },
  normal: {
    speed: 260,
    cooldownScale: 1.8,
    damageScale: 0.8,
    fireRange: Math.round(BEAM_RANGE * 0.55),
    pickupReach: 450,
    defendChance: 0.35,
    defendMs: 450,
    parryChance: 0.12,
  },
  hard: {
    speed: 320,
    cooldownScale: 1.15,
    damageScale: 1.15,
    fireRange: Math.round(BEAM_RANGE * 0.8),
    pickupReach: 900,
    defendChance: 0.6,
    defendMs: 550,
    parryChance: 0.2,
  },
};

const DEFAULT_DIFFICULTY: ArenaDifficulty = "normal";

function isArenaDifficulty(value: unknown): value is ArenaDifficulty {
  return value === "easy" || value === "normal" || value === "hard";
}

// Posição já no referencial do sprite; bloqueada = obstáculo no caminho.
type CpuPickup = {
  at: Point;
  look: PickupLook;
  blocked: boolean;
};

type CpuInput = {
  self: Point;
  target: Point;
  selfHp: number;
  selfMaxHp?: number;
  targetHp: number;
  busy: boolean;
  now: number;
  readyAt: Record<AttackKind, number>;
  blockedAt: number | null;
  fireRange: number;
  pickups?: readonly CpuPickup[];
  pickupReach?: number;
};

type CpuDecision =
  | { action: "idle" }
  | { action: "chase"; move: MoveVector }
  | { action: "attack"; kind: AttackKind; aim: MoveVector };

function wantsPickup(look: PickupLook, input: CpuInput) {
  if (look === "vulnerable") return false;
  if (look === "heal") return input.selfHp < (input.selfMaxHp ?? Infinity);
  return true;
}

function nearestPickup(input: CpuInput): Point | null {
  const reach = input.pickupReach ?? 0;
  let best: Point | null = null;
  let bestDistance = reach;
  for (const pickup of input.pickups ?? []) {
    if (pickup.blocked || !wantsPickup(pickup.look, input)) continue;
    const distance = Math.hypot(pickup.at.x - input.self.x, pickup.at.y - input.self.y);
    if (distance > bestDistance) continue;
    best = pickup.at;
    bestDistance = distance;
  }
  return best;
}

function decideCpu(input: CpuInput): CpuDecision {
  if (input.selfHp <= 0 || input.targetHp <= 0) return { action: "idle" };
  if (input.busy) return { action: "idle" };
  const dx = input.target.x - input.self.x;
  const dy = input.target.y - input.self.y;
  const distance = Math.hypot(dx, dy);
  const aim = normalizeMove(dx, dy);
  const aimed = aim.x !== 0 || aim.y !== 0;
  if (
    aimed &&
    distance <= CPU_MELEE_RANGE &&
    canAttack(input.now, input.readyAt.melee)
  ) {
    return { action: "attack", kind: "melee", aim };
  }
  const pickup = nearestPickup(input);
  if (pickup) {
    const move = normalizeMove(pickup.x - input.self.x, pickup.y - input.self.y);
    if (move.x !== 0 || move.y !== 0) return { action: "chase", move };
  }
  const wall = input.blockedAt !== null && input.blockedAt < distance ? input.blockedAt : null;
  if (aimed && wall !== null) {
    if (wall <= CPU_MELEE_RANGE && canAttack(input.now, input.readyAt.melee)) {
      return { action: "attack", kind: "melee", aim };
    }
    if (wall <= input.fireRange && canAttack(input.now, input.readyAt.fire)) {
      return { action: "attack", kind: "fire", aim };
    }
  }
  if (
    aimed &&
    distance <= input.fireRange &&
    wall === null &&
    canAttack(input.now, input.readyAt.fire)
  ) {
    return { action: "attack", kind: "fire", aim };
  }
  if (distance > CPU_HOLD_DISTANCE) return { action: "chase", move: aim };
  return { action: "idle" };
}

type CpuThreat = {
  kind: AttackKind;
  distance: number;
};

// Rola uma vez por golpe do jogador: corpo a corpo só assusta de perto.
function cpuDefends(rng: () => number, profile: CpuProfile, threat: CpuThreat, free: boolean) {
  if (!free || profile.defendChance <= 0) return false;
  if (threat.kind === "melee" && threat.distance > CPU_DEFEND_MELEE_RANGE) return false;
  return rng() < profile.defendChance;
}

function cpuParries(rng: () => number, profile: CpuProfile) {
  return profile.parryChance > 0 && rng() < profile.parryChance;
}

export {
  CPU_DEFEND_MELEE_RANGE,
  CPU_HOLD_DISTANCE,
  CPU_MELEE_RANGE,
  CPU_PROFILES,
  cpuDefends,
  cpuParries,
  decideCpu,
  DEFAULT_DIFFICULTY,
  isArenaDifficulty,
};
export type { ArenaDifficulty, CpuDecision, CpuInput, CpuPickup, CpuProfile, CpuThreat };
