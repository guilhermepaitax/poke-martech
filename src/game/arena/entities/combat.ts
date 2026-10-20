import { clearAim, createAim, drawAim } from "@/game/arena/entities/aim";
import {
  createAttackHud,
  destroyAttackHud,
  layoutAttackHud,
  paintAttackHud,
  type AttackHud,
} from "@/game/arena/entities/attack-hud";
import { playArenaAudio } from "@/game/arena/entities/audio";
import {
  castBeam,
  clearBeams,
  FIRE_BEAM,
  type BeamShot,
} from "@/game/arena/entities/beam";
import { clearCracks, spawnCracks } from "@/game/arena/entities/cracks";
import {
  clearDamageNumbers,
  spawnDamageNumber,
} from "@/game/arena/entities/damage-number";
import { clearHitFx, spawnHitFx } from "@/game/arena/entities/hit-fx";
import {
  DASH_DISTANCE,
  dashWithTrail,
  EVADE,
  spawnSlashArc,
} from "@/game/arena/entities/melee-fx";
import {
  isDashing,
  playAttack,
  playHurt,
  playerAnchor,
  setPlayerHp,
  type Player,
} from "@/game/arena/entities/player";
import {
  applyHit,
  attackPower,
  canAttack,
  COOLDOWN_MS,
  firstBlockHit,
  impactTier,
  MELEE_RANGE,
  meleeConnect,
  nextReadyAt,
  resolveDamage,
  rollCritical,
  type AttackKind,
  type Point,
  type ResolvedHit,
} from "@/lib/arena/combat";
import {
  DASH_COOLDOWN_MS,
  dashHeading,
  facingFromAim,
  facingVector,
  type MoveVector,
} from "@/lib/arena/movement";
import Phaser from "phaser";

const MUZZLE_FORWARD = 36;
const MUZZLE_DOWN = 18;
const MELEE_BLOCK_SPARK_GAP = 24;
const HURT_NUMBER_OFFSET_Y = 62;
const MELEE_CRACK_OFFSET_Y = 20;
const HIT_FX_OFFSET_Y = 10;
const MELEE_RESOLVE_MS = 90;
const IMPACT_COLOR: Record<AttackKind, number> = {
  melee: 0xff8a2a,
  fire: FIRE_BEAM.impact,
};

type Combat = {
  kind: AttackKind;
  dashReady: boolean;
  hud: AttackHud;
  projectiles: Phaser.Physics.Arcade.Group;
  cracks: Phaser.GameObjects.GameObject[];
  hitFx: Phaser.GameObjects.GameObject[];
  numbers: Phaser.GameObjects.Container[];
  beams: BeamShot[];
  overlap: Phaser.Physics.Arcade.Collider;
  blockOverlap: Phaser.Physics.Arcade.Collider;
  blocks: Phaser.GameObjects.Rectangle[];
  aim: Phaser.GameObjects.Graphics;
};

function createCombat(
  scene: Phaser.Scene,
  opponent: Player,
  blocks: Phaser.GameObjects.Rectangle[],
): Combat {
  const projectiles = scene.physics.add.group();
  const combat: Combat = {
    kind: "melee",
    dashReady: true,
    hud: createAttackHud(scene),
    projectiles,
    cracks: [],
    hitFx: [],
    numbers: [],
    beams: [],
    blocks,
    overlap: scene.physics.add.overlap(
      projectiles,
      opponent.sprite,
      (first, second) => {
        const bolt = projectileOf(combat, first, second);
        if (!bolt) return;
        strikeProjectile(scene, combat, opponent, bolt);
      },
    ),
    blockOverlap: scene.physics.add.overlap(projectiles, blocks, (first, second) => {
      const bolt = projectileOf(combat, first, second);
      if (!bolt) return;
      stopProjectile(scene, combat, bolt);
    }),
    aim: createAim(scene),
  };
  paintAttackHud(combat.hud, combat.kind, combat.dashReady);
  layoutCombat(scene, combat);
  return combat;
}

function layoutCombat(scene: Phaser.Scene, combat: Combat) {
  layoutAttackHud(scene, combat.hud);
}

function syncCombatAim(
  combat: Combat,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) {
  drawAim(combat.aim, fromX, fromY, toX, toY);
}

function clearCombatAim(combat: Combat) {
  clearAim(combat.aim);
}

function setCombatKind(combat: Combat, kind: AttackKind) {
  combat.kind = kind;
  paintAttackHud(combat.hud, kind, combat.dashReady);
}

function syncDashHud(scene: Phaser.Scene, combat: Combat, player: Player) {
  const ready = canAttack(scene.time.now, player.dashReadyAt);
  if (ready === combat.dashReady) return;
  combat.dashReady = ready;
  paintAttackHud(combat.hud, combat.kind, ready);
}

function aimVector(player: Player, worldX: number, worldY: number) {
  const origin = playerAnchor(player);
  const dx = worldX - origin.x;
  const dy = worldY - origin.y;
  if (dx === 0 && dy === 0) return facingVector(player.facing);
  const length = Math.hypot(dx, dy);
  return { x: dx / length, y: dy / length };
}

function hurtFighter(
  scene: Phaser.Scene,
  combat: Combat,
  target: Player,
  hit: ResolvedHit,
  direction: Point,
  color: number,
) {
  const result = applyHit(target.hp, hit.damage, false);
  if (!result.applied) return result;
  setPlayerHp(target, result.hp);
  playHurt(target);
  spawnHitFx(scene, combat.hitFx, {
    target,
    at: { x: target.sprite.x, y: target.sprite.y - HIT_FX_OFFSET_Y },
    direction,
    tier: impactTier(result.dealt, hit.tags.includes("critical")),
    color,
  });
  spawnDamageNumber(
    scene,
    combat.numbers,
    target.sprite.x,
    target.sprite.y - HURT_NUMBER_OFFSET_Y,
    result.dealt,
    hit.tags,
  );
  return result;
}

function rollHit(base: number) {
  return resolveDamage(base, { critical: rollCritical(Math.random) });
}

function projectileOf(combat: Combat, first: unknown, second: unknown) {
  if (
    first instanceof Phaser.Physics.Arcade.Sprite &&
    combat.projectiles.contains(first)
  ) {
    return first;
  }
  if (
    second instanceof Phaser.Physics.Arcade.Sprite &&
    combat.projectiles.contains(second)
  ) {
    return second;
  }
  return null;
}

function projectileDamage(projectile: Phaser.Physics.Arcade.Sprite) {
  const damage = Number(projectile.getData("damage"));
  return Number.isFinite(damage) ? damage : 0;
}

function stopProjectile(
  scene: Phaser.Scene,
  combat: Combat,
  projectile: Phaser.Physics.Arcade.Sprite,
) {
  if (!projectile.active || projectile.getData("hit") === true) return;
  projectile.setData("hit", true);
  projectile.setVelocity(0, 0);
  spawnCracks(
    scene,
    combat.cracks,
    projectile.x,
    projectile.y,
    projectileDamage(projectile),
  );
  projectile.destroy();
}

function strikeProjectile(
  scene: Phaser.Scene,
  combat: Combat,
  opponent: Player,
  projectile: Phaser.Physics.Arcade.Sprite,
) {
  if (!projectile.active || projectile.getData("hit") === true) return;
  const damage = projectileDamage(projectile);
  const velocity = projectile.body?.velocity ?? { x: 0, y: 0 };
  const speed = Math.hypot(velocity.x, velocity.y) || 1;
  const direction = { x: velocity.x / speed, y: velocity.y / speed };
  projectile.setData("hit", true);
  projectile.setVelocity(0, 0);
  hurtFighter(scene, combat, opponent, rollHit(damage), direction, IMPACT_COLOR.fire);
  spawnCracks(scene, combat.cracks, projectile.x, projectile.y, damage);
  projectile.destroy();
}

function blockRects(combat: Combat) {
  return combat.blocks.map((block) => ({
    x: block.x,
    y: block.y,
    width: block.width,
    height: block.height,
  }));
}

function resolveMelee(
  scene: Phaser.Scene,
  combat: Combat,
  player: Player,
  opponent: Player,
  aim: Point,
  damage: number,
) {
  const blocked = firstBlockHit(player.sprite, opponent.sprite, blockRects(combat));
  if (blocked && blocked.distance <= MELEE_RANGE) {
    if (blocked.distance > MELEE_BLOCK_SPARK_GAP) {
      spawnCracks(scene, combat.cracks, blocked.x, blocked.y, damage);
    }
    return;
  }
  if (!meleeConnect(player.sprite, opponent.sprite, aim, MELEE_RANGE)) return;
  const hit = rollHit(damage);
  hurtFighter(scene, combat, opponent, hit, aim, IMPACT_COLOR.melee);
  spawnCracks(
    scene,
    combat.cracks,
    opponent.sprite.x,
    opponent.sprite.y + MELEE_CRACK_OFFSET_Y,
    hit.damage,
  );
}

function startMelee(
  scene: Phaser.Scene,
  combat: Combat,
  player: Player,
  opponent: Player,
  aim: Point,
  damage: number,
) {
  const reach = Math.min(
    DASH_DISTANCE,
    firstBlockHit(
      player.sprite,
      {
        x: player.sprite.x + aim.x * DASH_DISTANCE,
        y: player.sprite.y + aim.y * DASH_DISTANCE,
      },
      blockRects(combat),
    )?.distance ?? DASH_DISTANCE,
  );
  spawnSlashArc(
    scene,
    combat.hitFx,
    { x: player.sprite.x + aim.x * reach, y: player.sprite.y + aim.y * reach },
    aim,
    MELEE_RANGE,
  );
  dashWithTrail(scene, combat.hitFx, player, aim);
  scene.time.delayedCall(MELEE_RESOLVE_MS, () => {
    if (!player.sprite.scene || !opponent.sprite.scene) return;
    resolveMelee(scene, combat, player, opponent, aim, damage);
  });
}

function tryAttack(
  scene: Phaser.Scene,
  combat: Combat,
  attacker: Player,
  target: Player,
  kind: AttackKind,
  aim: Point,
  cooldownScale = 1,
) {
  if (attacker.attacking || attacker.hurting || isDashing(attacker)) return false;
  const now = scene.time.now;
  if (!canAttack(now, attacker.readyAt[kind])) return false;
  attacker.facing = facingFromAim(aim.x, aim.y, attacker.facing);
  if (!playAttack(attacker)) return false;
  playArenaAudio(scene, "hit");
  attacker.readyAt[kind] = nextReadyAt(now, COOLDOWN_MS[kind] * cooldownScale);
  const damage = attackPower(kind, attacker.attackDamage, target.maxHp);
  if (kind === "melee") {
    startMelee(scene, combat, attacker, target, aim, damage);
    return true;
  }
  const muzzle = {
    x: attacker.sprite.x + aim.x * MUZZLE_FORWARD,
    y: attacker.sprite.y + aim.y * MUZZLE_DOWN,
  };
  castBeam(scene, combat.beams, {
    from: muzzle,
    rayFrom: muzzle,
    direction: aim,
    style: FIRE_BEAM,
    blocks: blockRects(combat),
    target: { x: target.sprite.x, y: target.sprite.y },
    onArrive: (impact) => {
      const hit = impact.stop === "fighter" ? rollHit(damage) : null;
      if (hit) {
        hurtFighter(scene, combat, target, hit, aim, IMPACT_COLOR.fire);
      }
      if (impact.stop !== "range") {
        spawnCracks(scene, combat.cracks, impact.x, impact.y, hit?.damage ?? damage);
      }
    },
  });
  return true;
}

function tryPlayerAttack(
  scene: Phaser.Scene,
  combat: Combat,
  player: Player,
  opponent: Player,
  worldX: number,
  worldY: number,
) {
  return tryAttack(
    scene,
    combat,
    player,
    opponent,
    combat.kind,
    aimVector(player, worldX, worldY),
  );
}

function tryPlayerDash(
  scene: Phaser.Scene,
  combat: Combat,
  player: Player,
  move: MoveVector,
) {
  if (player.attacking || player.hurting || isDashing(player)) return false;
  const now = scene.time.now;
  if (!canAttack(now, player.dashReadyAt)) return false;
  const heading = dashHeading(move, player.facing);
  player.facing = facingFromAim(heading.x, heading.y, player.facing);
  player.dashReadyAt = nextReadyAt(now, DASH_COOLDOWN_MS);
  dashWithTrail(scene, combat.hitFx, player, heading, EVADE);
  syncDashHud(scene, combat, player);
  return true;
}

function cullProjectiles(
  scene: Phaser.Scene,
  combat: Combat,
  worldWidth: number,
  worldHeight: number,
) {
  if (worldWidth <= 0 || worldHeight <= 0) return;
  const blocks = blockRects(combat);
  for (const child of combat.projectiles.getChildren()) {
    if (!(child instanceof Phaser.Physics.Arcade.Sprite) || !child.active) continue;
    const fromX = Number(child.getData("fromX"));
    const fromY = Number(child.getData("fromY"));
    const from = {
      x: Number.isFinite(fromX) ? fromX : child.x,
      y: Number.isFinite(fromY) ? fromY : child.y,
    };
    const blocked = firstBlockHit(from, child, blocks);
    child.setData("fromX", child.x);
    child.setData("fromY", child.y);
    if (blocked) {
      child.setPosition(blocked.x, blocked.y);
      stopProjectile(scene, combat, child);
      continue;
    }
    if (child.x < 0 || child.y < 0 || child.x > worldWidth || child.y > worldHeight) {
      child.destroy();
    }
  }
}

function destroyCombat(scene: Phaser.Scene, combat: Combat) {
  combat.overlap.destroy();
  combat.blockOverlap.destroy();
  clearCracks(scene, combat.cracks);
  clearHitFx(scene, combat.hitFx);
  clearDamageNumbers(scene, combat.numbers);
  clearBeams(scene, combat.beams);
  combat.projectiles.destroy(true);
  combat.aim.destroy();
  destroyAttackHud(combat.hud);
}

export {
  blockRects,
  clearCombatAim,
  createCombat,
  cullProjectiles,
  destroyCombat,
  layoutCombat,
  setCombatKind,
  syncCombatAim,
  syncDashHud,
  tryAttack,
  tryPlayerAttack,
  tryPlayerDash,
};
export type { Combat };
