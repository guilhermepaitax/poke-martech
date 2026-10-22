import { blockRects, tryAttack, type Combat } from "@/game/arena/entities/combat";
import type { Pickup } from "@/game/arena/entities/pickup";
import { isDashing, updatePlayer, type Player } from "@/game/arena/entities/player";
import { firstBlockHit } from "@/lib/arena/combat";
import { decideCpu, type CpuProfile } from "@/lib/arena/cpu";
import { facingFromAim } from "@/lib/arena/movement";
import type Phaser from "phaser";

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
