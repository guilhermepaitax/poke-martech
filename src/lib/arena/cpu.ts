import {
  BEAM_RANGE,
  canAttack,
  MELEE_RANGE,
  type AttackKind,
  type Point,
} from "@/lib/arena/combat";
import { normalizeMove, type MoveVector } from "@/lib/arena/movement";

const CPU_MELEE_RANGE = MELEE_RANGE;
const CPU_FIRE_RANGE = Math.round(BEAM_RANGE * 0.65);
const CPU_HOLD_DISTANCE = Math.round(MELEE_RANGE * 0.7);
const CPU_SPEED = 255;
const CPU_COOLDOWN_SCALE = 1.6;

type CpuInput = {
  self: Point;
  target: Point;
  selfHp: number;
  targetHp: number;
  busy: boolean;
  now: number;
  readyAt: Record<AttackKind, number>;
  lineClear: boolean;
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
  if (
    aimed &&
    distance <= CPU_FIRE_RANGE &&
    input.lineClear &&
    canAttack(input.now, input.readyAt.fire)
  ) {
    return { action: "attack", kind: "fire", aim };
  }
  if (distance > CPU_HOLD_DISTANCE) return { action: "chase", move: aim };
  return { action: "idle" };
}

export {
  CPU_COOLDOWN_SCALE,
  CPU_FIRE_RANGE,
  CPU_HOLD_DISTANCE,
  CPU_MELEE_RANGE,
  CPU_SPEED,
  decideCpu,
};
export type { CpuDecision, CpuInput };
