import { blockRects, tryAttack, type Combat } from "@/game/arena/entities/combat";
import type { Pickup } from "@/game/arena/entities/pickup";
import { isDashing, setDefending, updatePlayer, type Player } from "@/game/arena/entities/player";
import { firstBlockHit, type Point } from "@/lib/arena/combat";
import { cpuDefends, cpuParries, decideCpu, type CpuProfile } from "@/lib/arena/cpu";
import { PARRY_WINDOW_MS } from "@/lib/arena/defense";
import { facingFromAim, normalizeMove, type MoveVector } from "@/lib/arena/movement";
import { nextWaypoint, type NavGrid } from "@/lib/arena/navigation";
import type Phaser from "phaser";

// Defesa comum sobe depois da janela de parry, para não virar parry sem querer.
const CPU_BLOCK_DELAY_MS = PARRY_WINDOW_MS + 40;

type CpuGuard = {
  targetAttacking: boolean;
  raiseAt: number;
  defendUntil: number;
  // Decidiu fazer parry: a janela cobre a defesa toda (tiro de longe incluso).
  parry: boolean;
};

const guards = new WeakMap<Player, CpuGuard>();

function guardOf(cpu: Player) {
  let guard = guards.get(cpu);
  if (!guard) {
    guard = { targetAttacking: false, raiseAt: 0, defendUntil: 0, parry: false };
    guards.set(cpu, guard);
  }
  return guard;
}

// Reage ao início de cada golpe do jogador: às vezes segura a defesa um pouco.
function updateCpuGuard(scene: Phaser.Scene, combat: Combat, cpu: Player, target: Player, profile: CpuProfile) {
  const now = scene.time.now;
  const guard = guardOf(cpu);
  const started = target.attacking && !guard.targetAttacking;
  guard.targetAttacking = target.attacking;
  if (started) {
    const free = !cpu.attacking && !cpu.hurting && !isDashing(cpu);
    const distance = Math.hypot(target.sprite.x - cpu.sprite.x, target.sprite.y - cpu.sprite.y);
    if (cpuDefends(Math.random, profile, { kind: combat.kind, distance }, free)) {
      guard.parry = cpuParries(Math.random, profile);
      guard.raiseAt = guard.parry ? now : now + CPU_BLOCK_DELAY_MS;
      guard.defendUntil = guard.raiseAt + profile.defendMs;
    }
  }
  setDefending(
    cpu,
    !combat.over && now >= guard.raiseAt && now < guard.defendUntil,
    guard.parry ? profile.defendMs : undefined,
  );
  // Esperando a hora de levantar a guarda, a CPU fica parada encarando.
  return cpu.defending || (!combat.over && now < guard.raiseAt);
}

// O vetor da decisão aponta para o alvo ou para uma caixa; acha qual.
function chaseGoal(self: Point, move: MoveVector, enemy: Point, pickups: readonly { at: Point }[]) {
  const candidates = [enemy, ...pickups.map((pickup) => pickup.at)];
  let best = enemy;
  let bestDot = -Infinity;
  for (const point of candidates) {
    const aim = normalizeMove(point.x - self.x, point.y - self.y);
    const dot = aim.x * move.x + aim.y * move.y;
    if (dot > bestDot) {
      best = point;
      bestDot = dot;
    }
  }
  return best;
}

// Com grade de navegação, contorna água/rocha em vez de andar reto contra a margem.
function steer(nav: NavGrid | null, self: Point, move: MoveVector, goal: Point): MoveVector {
  if (!nav) return move;
  const waypoint = nextWaypoint(nav, self, goal);
  if (!waypoint) return move;
  const next = normalizeMove(waypoint.x - self.x, waypoint.y - self.y);
  // Já na margem mais perto de um alvo inalcançável: espera ali.
  if (Math.hypot(waypoint.x - self.x, waypoint.y - self.y) < nav.cell / 4) return { x: 0, y: 0 };
  return next;
}

function updateCpu(
  scene: Phaser.Scene,
  combat: Combat,
  cpu: Player,
  target: Player,
  profile: CpuProfile,
  pickups: readonly Pickup[] = [],
  nav: NavGrid | null = null,
) {
  const self = { x: cpu.sprite.x, y: cpu.sprite.y };
  const enemy = { x: target.sprite.x, y: target.sprite.y };
  if (updateCpuGuard(scene, combat, cpu, target, profile)) {
    cpu.facing = facingFromAim(enemy.x - self.x, enemy.y - self.y, cpu.facing);
    updatePlayer(cpu, 0, 0);
    return;
  }
  const busy = cpu.attacking || cpu.hurting || isDashing(cpu);
  const blocks = blockRects(combat);
  // A coleta mede pelos pés; converte a caixa para o referencial do sprite.
  const feet = cpu.fighter.tuning.feetOffsetY;
  const goals = pickups.map((pickup) => {
    const at = { x: pickup.x, y: pickup.y - feet };
    return { at, look: pickup.look, blocked: firstBlockHit(self, at, blocks) !== null };
  });
  const decision = decideCpu({
    self,
    target: enemy,
    selfHp: cpu.hp,
    selfMaxHp: cpu.maxHp,
    targetHp: target.hp,
    busy,
    now: scene.time.now,
    readyAt: cpu.readyAt,
    blockedAt: firstBlockHit(self, enemy, blocks)?.distance ?? null,
    fireRange: profile.fireRange,
    pickups: goals,
    pickupReach: profile.pickupReach,
  });
  if (!busy && cpu.hp > 0) {
    cpu.facing = facingFromAim(enemy.x - self.x, enemy.y - self.y, cpu.facing);
  }
  if (decision.action === "attack") {
    tryAttack(scene, combat, cpu, target, decision.kind, decision.aim, profile);
    return;
  }
  if (decision.action === "chase") {
    const goal = chaseGoal(self, decision.move, enemy, goals);
    const body = cpu.sprite.body;
    const feet = body ? { x: body.center.x, y: body.center.y } : self;
    const move = steer(nav, feet, decision.move, goal);
    updatePlayer(cpu, move.x, move.y, profile.speed);
    return;
  }
  updatePlayer(cpu, 0, 0);
}

export { updateCpu };
