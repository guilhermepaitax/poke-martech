import { blockRects, tryAttack, type Combat } from "@/game/arena/entities/combat";
import type { Pickup } from "@/game/arena/entities/pickup";
import { isDashing, setDefending, updatePlayer, type Player } from "@/game/arena/entities/player";
import { firstBlockHit } from "@/lib/arena/combat";
import { cpuDefends, cpuParries, decideCpu, type CpuProfile } from "@/lib/arena/cpu";
import { PARRY_WINDOW_MS } from "@/lib/arena/defense";
import { facingFromAim } from "@/lib/arena/movement";
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

function updateCpu(
  scene: Phaser.Scene,
  combat: Combat,
  cpu: Player,
  target: Player,
  profile: CpuProfile,
  pickups: readonly Pickup[] = [],
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
    updatePlayer(cpu, decision.move.x, decision.move.y, profile.speed);
    return;
  }
  updatePlayer(cpu, 0, 0);
}

export { updateCpu };
