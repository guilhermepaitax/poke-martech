import { blockRects, tryAttack, type Combat } from "@/game/arena/entities/combat";
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
) {
  const self = { x: cpu.sprite.x, y: cpu.sprite.y };
  const enemy = { x: target.sprite.x, y: target.sprite.y };
  const busy = cpu.attacking || cpu.hurting || isDashing(cpu);
  const decision = decideCpu({
    self,
    target: enemy,
    selfHp: cpu.hp,
    targetHp: target.hp,
    busy,
    now: scene.time.now,
    readyAt: cpu.readyAt,
    blockedAt: firstBlockHit(self, enemy, blockRects(combat))?.distance ?? null,
    fireRange: profile.fireRange,
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
