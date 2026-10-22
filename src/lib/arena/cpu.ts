import {
  BEAM_RANGE,
  canAttack,
  MELEE_RANGE,
  type AttackKind,
  type Point,
} from "@/lib/arena/combat";
import { normalizeMove, type MoveVector } from "@/lib/arena/movement";

const CPU_MELEE_RANGE = MELEE_RANGE;
const CPU_HOLD_DISTANCE = Math.round(MELEE_RANGE * 0.7);

type ArenaDifficulty = "normal" | "hard";

type CpuProfile = {
  speed: number;
  cooldownScale: number;
  damageScale: number;
  fireRange: number;
};

const CPU_PROFILES: Record<ArenaDifficulty, CpuProfile> = {
  normal: {
    speed: 200,
    cooldownScale: 2.6,
    damageScale: 0.6,
    fireRange: Math.round(BEAM_RANGE * 0.45),
  },
  hard: {
    speed: 255,
    cooldownScale: 1.6,
    damageScale: 1,
    fireRange: Math.round(BEAM_RANGE * 0.65),
  },
};

const DEFAULT_DIFFICULTY: ArenaDifficulty = "normal";

function isArenaDifficulty(value: unknown): value is ArenaDifficulty {
  return value === "normal" || value === "hard";
}

type CpuInput = {
  self: Point;
  target: Point;
  selfHp: number;
  targetHp: number;
  busy: boolean;
  now: number;
  readyAt: Record<AttackKind, number>;
  blockedAt: number | null;
  fireRange: number;
};

type CpuDecision =
  | { action: "idle" }
  | { action: "chase"; move: MoveVector }
  | { action: "attack"; kind: AttackKind; aim: MoveVector };

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

export {
  CPU_HOLD_DISTANCE,
  CPU_MELEE_RANGE,
  CPU_PROFILES,
  decideCpu,
  DEFAULT_DIFFICULTY,
  isArenaDifficulty,
};
export type { ArenaDifficulty, CpuDecision, CpuInput, CpuProfile };
