import { clearAim, createAim, drawAim } from "@/game/arena/entities/aim";
import { playArenaAudio } from "@/game/arena/entities/audio";
import {
  clearBanner,
  layoutBanner,
  spawnBanner,
  type BannerBucket,
} from "@/game/arena/entities/banner";
import {
  castBeam,
  clearBeams,
  FIRE_BEAM,
  FIRE_BEAM_CHARGED,
  type BeamShot,
} from "@/game/arena/entities/beam";
import {
  clearBones,
  GROUND_BONE,
  GROUND_BONE_CHARGED,
  launchBone,
  stepBones,
  type BoneShot,
} from "@/game/arena/entities/bone";
import {
  clearBubbles,
  launchBubble,
  stepBubbles,
  WATER_BUBBLE,
  WATER_BUBBLE_CHARGED,
  type BubbleShot,
} from "@/game/arena/entities/bubble";
import { clearCracks, spawnCracks } from "@/game/arena/entities/cracks";
import { spawnWaterSplash } from "@/game/arena/entities/water-fx";
import {
  clearDamageNumbers,
  spawnDamageNumber,
} from "@/game/arena/entities/damage-number";
import { clearHitFx, spawnHitFx } from "@/game/arena/entities/hit-fx";
import { flashShield, parryShield, shatterShield } from "@/game/arena/entities/shield-fx";
import { flashMarker, spawnRingWave } from "@/game/arena/entities/marker";
import {
  clearOrbs,
  GRASS_ORB,
  GRASS_ORB_CHARGED,
  launchOrb,
  stepOrbs,
  type OrbShot,
} from "@/game/arena/entities/orb";
import {
  clearStars,
  launchStar,
  stepStars,
  SWIFT_STAR,
  SWIFT_STAR_CHARGED,
  type StarShot,
} from "@/game/arena/entities/star";
import {
  hitObstacle,
  obstacleRect,
  type Obstacle,
} from "@/game/arena/entities/obstacle";
import {
  dashWithTrail,
  EVADE,
  LUNGE,
  spawnShockwave,
  spawnSlashArc,
  type DashStyle,
  type SlashLook,
} from "@/game/arena/entities/melee-fx";
import {
  isDashing,
  isEvading,
  lowerDefense,
  playAttack,
  playHurt,
  playerAnchor,
  setPlayerHp,
  type Player,
} from "@/game/arena/entities/player";
import { chargedDamage, type ChargeLevel } from "@/lib/arena/charge";
import {
  applyHit,
  attackPower,
  BEAM_RANGE,
  beamImpact,
  boneVolley,
  bubbleVolley,
  canAttack,
  COOLDOWN_MS,
  firstBlockHit,
  guardHit,
  impactTier,
  MELEE_GUARD_MS,
  MELEE_RANGE,
  meleeConnect,
  nextReadyAt,
  orbVolley,
  resolveDamage,
  rollCritical,
  spinConnect,
  starVolley,
  type AttackKind,
  type BeamEnd,
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
import { canCounter, defendHit, isParry, spendGuard } from "@/lib/arena/defense";
import { buffScale } from "@/lib/arena/pickups";
import Phaser from "phaser";

const MUZZLE_FORWARD = 36;
const MUZZLE_DOWN = 18;
const HURT_NUMBER_OFFSET_Y = 62;
const MELEE_CRACK_OFFSET_Y = 20;
const HIT_FX_OFFSET_Y = 10;
const MELEE_RESOLVE_MS = 90;
const ATTACK_FLASH_MS = 220;
const HURT_FLASH_MS = 320;
const BLOCK_SHAKE_MS = 70;
const BREAK_SHAKE_MS = 160;
const PARRY_SHAKE_MS = 120;
const PARRY_COLOR = 0xffd23a;
// Contra-ataque do parry: sai logo depois do flash, com força de carga nível 1.
const COUNTER_DELAY_MS = 70;
const COUNTER_CHARGE: ChargeLevel = 1;
const CHARGED_BEAM_MS = 90;
const IMPACT_COLOR: Record<AttackKind, number> = {
  melee: 0xff8a2a,
  fire: FIRE_BEAM.impact,
};
const CHARGE_COLOR: Record<ChargeLevel, number> = {
  0: IMPACT_COLOR.melee,
  1: 0xff8a3a,
  2: 0xd86bff,
};
const MELEE_REACH: Record<ChargeLevel, number> = { 0: 1, 1: 1.12, 2: 1.28 };
const BEAM_WIDTH: Record<ChargeLevel, number> = { 0: 1, 1: 1.5, 2: 2.1 };
const ORB_SCALE: Record<ChargeLevel, number> = { 0: 1, 1: 1.8, 2: 1.2 };
const STAR_SCALE: Record<ChargeLevel, number> = { 0: 1, 1: 1.45, 2: 1.15 };
const BONE_SCALE: Record<ChargeLevel, number> = { 0: 1, 1: 1.5, 2: 1.15 };
const BUBBLE_SCALE: Record<ChargeLevel, number> = { 0: 1, 1: 1.6, 2: 1.1 };
// O giro alcança em volta, mas um pouco menos que o golpe direcional.
const SPIN_REACH = 0.85;
const SPIN_COLOR = 0x6cc4ff;
const BONE_SPEED_SCALE: Record<ChargeLevel, number> = { 0: 1, 1: 1.15, 2: 1.1 };
const SLASH_LOOK: Record<ChargeLevel, SlashLook> = {
  0: { color: 0xffffff, thickness: 1 },
  1: { color: 0xffd0a0, thickness: 1.5 },
  2: { color: 0xf3c4ff, thickness: 2.1 },
};
const LUNGE_BY_CHARGE: Record<ChargeLevel, DashStyle> = {
  0: LUNGE,
  1: { ...LUNGE, speed: 700, durationMs: 120, ghostTint: 0xffb066 },
  2: { ...LUNGE, speed: 780, durationMs: 140, ghostTint: 0xd86bff, ghostAlpha: 0.6 },
};

type AttackTuning = {
  cooldownScale: number;
  damageScale: number;
};

const PLAYER_TUNING: AttackTuning = { cooldownScale: 1, damageScale: 1 };

// Golpe que acertou alguém defendendo; `broke` = a guarda quebrou nele,
// `parry` = defendeu no tempo certo e anulou o golpe.
type BlockEvent = {
  target: Player;
  broke: boolean;
  parry: boolean;
};

// Quem desferiu o golpe e com qual ataque: o parry devolve no mesmo tipo.
type HitSource = {
  attacker: Player;
  kind: AttackKind;
};

type Combat = {
  kind: AttackKind;
  over: boolean;
  banner: BannerBucket;
  onHpChange: () => void;
  onBlock: (event: BlockEvent) => void;
  projectiles: Phaser.Physics.Arcade.Group;
  cracks: Phaser.GameObjects.GameObject[];
  hitFx: Phaser.GameObjects.GameObject[];
  numbers: Phaser.GameObjects.Container[];
  beams: BeamShot[];
  orbs: OrbShot[];
  bones: BoneShot[];
  stars: StarShot[];
  bubbles: BubbleShot[];
  overlap: Phaser.Physics.Arcade.Collider;
  blockOverlap: Phaser.Physics.Arcade.Collider;
  obstacles: Obstacle[];
  // Ponto do chão em água: impacto espirra em vez de rachar.
  isWater: (at: Point) => boolean;
  aim: Phaser.GameObjects.Graphics;
};

function createCombat(
  scene: Phaser.Scene,
  player: Player,
  opponent: Player,
  obstacles: Obstacle[],
  onHpChange: () => void = () => {},
  onBlock: (event: BlockEvent) => void = () => {},
  isWater: (at: Point) => boolean = () => false,
): Combat {
  const projectiles = scene.physics.add.group();
  const combat: Combat = {
    kind: "melee",
    over: false,
    banner: { current: null },
    onHpChange,
    onBlock,
    projectiles,
    cracks: [],
    hitFx: [],
    numbers: [],
    beams: [],
    orbs: [],
    bones: [],
    stars: [],
    bubbles: [],
    obstacles,
    isWater,
    overlap: scene.physics.add.overlap(
      projectiles,
      opponent.sprite,
      (first, second) => {
        const bolt = projectileOf(combat, first, second);
        if (!bolt) return;
        strikeProjectile(scene, combat, opponent, bolt);
      },
    ),
    blockOverlap: scene.physics.add.overlap(
      projectiles,
      obstacles.map((obstacle) => obstacle.body),
      (first, second) => {
        const bolt = projectileOf(combat, first, second);
        if (!bolt) return;
        const struck = obstacles.find((obstacle) => obstacle.body === first || obstacle.body === second);
        stopProjectile(scene, combat, bolt, struck);
      },
    ),
    aim: createAim(scene),
  };
  layoutCombat(scene, combat);
  return combat;
}

function layoutCombat(scene: Phaser.Scene, combat: Combat) {
  layoutBanner(scene, combat.banner);
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
}

function showBanner(
  scene: Phaser.Scene,
  combat: Combat,
  label: string,
  tone: Parameters<typeof spawnBanner>[3],
) {
  spawnBanner(scene, combat.banner, label, tone);
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
  stars = true,
  charge: ChargeLevel = 0,
  source: HitSource | null = null,
) {
  const skip = combat.over || isEvading(target);
  if (!skip && target.defending && hit.damage > 0 && isParry(target.guard, scene.time.now)) {
    parryHit(scene, combat, target, direction, source);
    return { hp: target.hp, applied: false, dealt: 0 };
  }
  const block = !skip && target.defending && hit.damage > 0 ? spendGuard(target.guard, charge, scene.time.now) : null;
  if (block) {
    target.guard = block.guard;
    hit = defendHit(hit);
  }
  const exposed = buffScale(target.buffs, "vulnerable", scene.time.now);
  const damage = exposed === 1 ? hit.damage : Math.round(hit.damage * exposed);
  const result = applyHit(target.hp, damage, skip);
  if (!result.applied) return result;
  setPlayerHp(target, result.hp);
  if (block && !block.broke) {
    blockedHit(scene, combat, target, hit, direction, result.dealt);
    return result;
  }
  if (block?.broke) breakGuard(scene, combat, target);
  playHurt(target);
  combat.onHpChange();
  const critical = hit.tags.includes("critical");
  const charged = hit.tags.includes("charged");
  flashMarker(target.marker, "hurt", HURT_FLASH_MS);
  spawnRingWave(scene, target.marker, {
    color: target.marker.palette.hurt,
    count: charged || critical ? 3 : 2,
    grow: charged ? 3 : 2.4,
  });
  spawnHitFx(scene, combat.hitFx, {
    target,
    at: { x: target.sprite.x, y: target.sprite.y - HIT_FX_OFFSET_Y },
    direction,
    tier: impactTier(result.dealt, critical || charged),
    color,
    stars,
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

// Defesa segurou o golpe: sem hurt, o lutador segue andando.
function blockedHit(
  scene: Phaser.Scene,
  combat: Combat,
  target: Player,
  hit: ResolvedHit,
  direction: Point,
  dealt: number,
) {
  combat.onHpChange();
  flashShield(scene, target, direction);
  spawnRingWave(scene, target.marker, { color: 0x8fd8ff, count: 1, grow: 1.8 });
  spawnDamageNumber(
    scene,
    combat.numbers,
    target.sprite.x,
    target.sprite.y - HURT_NUMBER_OFFSET_Y,
    dealt,
    hit.tags,
  );
  scene.cameras.main.shake(BLOCK_SHAKE_MS, 0.002);
  combat.onBlock({ target, broke: false, parry: false });
}

// Defesa no tempo certo: anula o golpe e devolve no mesmo tipo de ataque.
function parryHit(
  scene: Phaser.Scene,
  combat: Combat,
  target: Player,
  direction: Point,
  source: HitSource | null,
) {
  parryShield(scene, target, direction);
  spawnRingWave(scene, target.marker, { color: PARRY_COLOR, count: 2, grow: 2.4, width: 3 });
  showBanner(scene, combat, "PARRY!", "parry");
  playArenaAudio(scene, "appear");
  scene.cameras.main.shake(PARRY_SHAKE_MS, 0.004);
  combat.onBlock({ target, broke: false, parry: true });
  if (!source || source.attacker.hp <= 0 || !canCounter(target.guard)) return;
  target.guard = { ...target.guard, counteredAt: scene.time.now };
  const { attacker, kind } = source;
  // Corpo a corpo aparado deixa o atacante atordoado na frente de quem defendeu.
  if (kind === "melee") playHurt(attacker);
  scene.time.delayedCall(COUNTER_DELAY_MS, () => counterAttack(scene, combat, target, attacker, kind));
}

function counterAttack(
  scene: Phaser.Scene,
  combat: Combat,
  parrier: Player,
  attacker: Player,
  kind: AttackKind,
) {
  if (combat.over || !parrier.sprite.scene || !attacker.sprite.scene) return;
  if (parrier.hp <= 0 || attacker.hp <= 0 || parrier.hurting) return;
  const dx = attacker.sprite.x - parrier.sprite.x;
  const dy = attacker.sprite.y - parrier.sprite.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return;
  const aim = { x: dx / length, y: dy / length };
  lowerDefense(parrier);
  parrier.facing = facingFromAim(aim.x, aim.y, parrier.facing);
  if (!playAttack(parrier, kind)) return;
  const damage = attackDamage(parrier, attacker, kind, PLAYER_TUNING, COUNTER_CHARGE, scene.time.now);
  flashMarker(parrier.marker, "attack", ATTACK_FLASH_MS);
  spawnRingWave(scene, parrier.marker, { color: PARRY_COLOR, count: 2, grow: 2.6, width: 3 });
  if (kind === "melee") {
    playArenaAudio(scene, "hit");
    startMelee(scene, combat, parrier, attacker, aim, damage, COUNTER_CHARGE);
    return;
  }
  launchRanged(scene, combat, parrier, attacker, aim, damage, COUNTER_CHARGE);
}

function breakGuard(scene: Phaser.Scene, combat: Combat, target: Player) {
  lowerDefense(target);
  shatterShield(scene, target);
  spawnRingWave(scene, target.marker, { color: 0x8b949e, count: 2, grow: 2.4, width: 3 });
  showBanner(scene, combat, "GUARDA QUEBRADA!", "guard");
  scene.cameras.main.shake(BREAK_SHAKE_MS, 0.006);
  combat.onBlock({ target, broke: true, parry: false });
}

function isGuarding(scene: Phaser.Scene, target: Player) {
  return scene.time.now < target.guardUntil;
}

function rollHit(base: number, charge: ChargeLevel = 0): ResolvedHit {
  const hit = resolveDamage(base, { critical: rollCritical(Math.random) });
  if (charge === 0 || hit.damage <= 0) return hit;
  return { damage: hit.damage, tags: ["charged", ...hit.tags] };
}

function announceHit(scene: Phaser.Scene, combat: Combat, hit: ResolvedHit, charge: ChargeLevel) {
  if (charge === 2) {
    showBanner(scene, combat, hit.tags.includes("critical") ? "SUPER CRITICAL!" : "SUPER GOLPE!", "super");
    scene.cameras.main.shake(180, 0.008);
    return;
  }
  if (hit.tags.includes("critical")) showBanner(scene, combat, "CRITICAL!", "critical");
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
  obstacle?: Obstacle,
) {
  if (!projectile.active || projectile.getData("hit") === true) return;
  projectile.setData("hit", true);
  projectile.setVelocity(0, 0);
  hitObstacle(scene, obstacle, projectileDamage(projectile), projectile);
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
  const hit = guardHit(rollHit(damage), isGuarding(scene, opponent));
  hurtFighter(scene, combat, opponent, hit, direction, IMPACT_COLOR.fire);
  markGround(scene, combat, projectile.x, projectile.y, damage);
  projectile.destroy();
}

// Marca do impacto no chão: rachadura em terra, espirro na água.
function markGround(scene: Phaser.Scene, combat: Combat, x: number, y: number, damage: number) {
  if (combat.isWater({ x, y })) {
    spawnWaterSplash(scene, { x, y }, damage);
    return;
  }
  spawnCracks(scene, combat.cracks, x, y, damage);
}

function liveObstacles(combat: Combat) {
  return combat.obstacles.filter((obstacle) => !obstacle.broken);
}

function blockRects(combat: Combat) {
  return liveObstacles(combat).map(obstacleRect);
}

function resolveMelee(
  scene: Phaser.Scene,
  combat: Combat,
  player: Player,
  opponent: Player,
  aim: Point,
  damage: number,
  charge: ChargeLevel,
) {
  const spin = player.fighter.tuning.meleeSpin === true;
  const range = MELEE_RANGE * MELEE_REACH[charge] * (spin ? SPIN_REACH : 1);
  if (spin) {
    const color = charge > 0 ? CHARGE_COLOR[charge] : SPIN_COLOR;
    spawnShockwave(scene, combat.hitFx, player.sprite, color, range);
  }
  const obstacles = liveObstacles(combat);
  const rects = obstacles.map(obstacleRect);
  const struck = firstBlockHit(
    player.sprite,
    { x: player.sprite.x + aim.x * range, y: player.sprite.y + aim.y * range },
    rects,
  );
  if (struck) {
    hitObstacle(scene, obstacles[struck.index], damage, struck);
    if (charge > 0) spawnShockwave(scene, combat.hitFx, struck, CHARGE_COLOR[charge], range);
    return;
  }
  const blocked = firstBlockHit(player.sprite, opponent.sprite, rects);
  if (charge > 0 && !spin) {
    spawnShockwave(
      scene,
      combat.hitFx,
      { x: player.sprite.x + aim.x * range * 0.6, y: player.sprite.y + aim.y * range * 0.6 },
      CHARGE_COLOR[charge],
      range,
    );
  }
  if (blocked && blocked.distance <= range) return;
  const connects = spin
    ? spinConnect(player.sprite, opponent.sprite, range)
    : meleeConnect(player.sprite, opponent.sprite, aim, range);
  if (!connects) return;
  const hit = rollHit(damage, charge);
  const result = hurtFighter(
    scene,
    combat,
    opponent,
    hit,
    aim,
    CHARGE_COLOR[charge],
    true,
    charge,
    { attacker: player, kind: "melee" },
  );
  if (result.applied) announceHit(scene, combat, hit, charge);
  markGround(scene, combat, opponent.sprite.x, opponent.sprite.y + MELEE_CRACK_OFFSET_Y, hit.damage);
}

function startMelee(
  scene: Phaser.Scene,
  combat: Combat,
  player: Player,
  opponent: Player,
  aim: Point,
  damage: number,
  charge: ChargeLevel,
) {
  const scale = player.fighter.tuning.lungeScale ?? 1;
  const base = LUNGE_BY_CHARGE[charge];
  const lunge = { ...base, speed: base.speed * scale, durationMs: base.durationMs * scale };
  player.guardUntil = scene.time.now + lunge.durationMs + MELEE_GUARD_MS;
  const distance = (lunge.speed * lunge.durationMs) / 1000;
  const reach = Math.min(
    distance,
    firstBlockHit(
      player.sprite,
      {
        x: player.sprite.x + aim.x * distance,
        y: player.sprite.y + aim.y * distance,
      },
      blockRects(combat),
    )?.distance ?? distance,
  );
  if (!player.fighter.tuning.meleeSpin) {
    spawnSlashArc(
      scene,
      combat.hitFx,
      { x: player.sprite.x + aim.x * reach, y: player.sprite.y + aim.y * reach },
      aim,
      MELEE_RANGE * MELEE_REACH[charge],
      SLASH_LOOK[charge],
    );
  }
  dashWithTrail(scene, combat.hitFx, player, aim, lunge);
  scene.time.delayedCall(MELEE_RESOLVE_MS + (lunge.durationMs - LUNGE.durationMs), () => {
    if (!player.sprite.scene || !opponent.sprite.scene) return;
    resolveMelee(scene, combat, player, opponent, aim, damage, charge);
  });
}

function landRanged(
  scene: Phaser.Scene,
  combat: Combat,
  attacker: Player,
  target: Player,
  impact: BeamEnd,
  connects: boolean,
  damage: number,
  charge: ChargeLevel,
  direction: Point,
  color: number,
  obstacles: Obstacle[],
  stars = true,
) {
  const hit = connects ? guardHit(rollHit(damage, charge), isGuarding(scene, target)) : null;
  if (hit || impact.stop === "block") playArenaAudio(scene, "explosion");
  if (charge > 0 && impact.stop !== "range") {
    spawnShockwave(scene, combat.hitFx, impact, CHARGE_COLOR[charge], 60 + charge * 30);
  }
  if (hit) {
    const result = hurtFighter(scene, combat, target, hit, direction, color, stars, charge, {
      attacker,
      kind: "fire",
    });
    if (result.applied) announceHit(scene, combat, hit, charge);
  }
  if (impact.stop === "block") {
    hitObstacle(scene, obstacles[impact.block ?? -1], damage, impact);
  } else if (impact.stop === "fighter") {
    markGround(scene, combat, impact.x, impact.y, hit?.damage ?? damage);
  }
}

function fireOrbs(
  scene: Phaser.Scene,
  combat: Combat,
  attacker: Player,
  target: Player,
  muzzle: Point,
  aim: Point,
  damage: number,
  charge: ChargeLevel,
  obstacles: Obstacle[],
) {
  const style = charge === 2 ? GRASS_ORB_CHARGED : GRASS_ORB;
  playArenaAudio(scene, "laser");
  for (const direction of orbVolley(aim, charge)) {
    launchOrb(scene, combat.orbs, {
      from: muzzle,
      direction,
      style,
      scale: ORB_SCALE[charge],
      target: () => (target.sprite.scene ? { x: target.sprite.x, y: target.sprite.y } : null),
      onArrive: (impact) => {
        landRanged(
          scene,
          combat,
          attacker,
          target,
          impact,
          impact.stop === "fighter",
          damage,
          charge,
          direction,
          style.impact,
          obstacles,
          false,
        );
      },
    });
  }
}

function fireStars(
  scene: Phaser.Scene,
  combat: Combat,
  attacker: Player,
  target: Player,
  muzzle: Point,
  aim: Point,
  damage: number,
  charge: ChargeLevel,
  obstacles: Obstacle[],
) {
  const style = charge === 2 ? SWIFT_STAR_CHARGED : SWIFT_STAR;
  const volley = starVolley(aim, charge);
  // O dano do golpe se divide entre as estrelas do leque.
  const share = Math.max(1, Math.round(damage / volley.length));
  playArenaAudio(scene, "laser");
  for (const direction of volley) {
    launchStar(scene, combat.stars, {
      from: muzzle,
      direction,
      style,
      scale: STAR_SCALE[charge],
      target: () => (target.sprite.scene ? { x: target.sprite.x, y: target.sprite.y } : null),
      onArrive: (impact) => {
        landRanged(
          scene,
          combat,
          attacker,
          target,
          impact,
          impact.stop === "fighter",
          share,
          charge,
          direction,
          style.impact,
          obstacles,
          false,
        );
      },
    });
  }
}

function fireBubbles(
  scene: Phaser.Scene,
  combat: Combat,
  attacker: Player,
  target: Player,
  aim: Point,
  damage: number,
  charge: ChargeLevel,
) {
  const style = charge === 2 ? WATER_BUBBLE_CHARGED : WATER_BUBBLE;
  const volley = bubbleVolley(aim, charge);
  // O dano do golpe se divide entre as bolhas da rajada.
  const share = Math.max(1, Math.round(damage / volley.length));
  for (const bubble of volley) {
    const launch = () => {
      if (combat.over || !attacker.sprite.scene) return;
      playArenaAudio(scene, "laser");
      // Cada bolha sai da boca na posição atual: a rajada acompanha quem anda.
      const muzzle = {
        x: attacker.sprite.x + aim.x * MUZZLE_FORWARD,
        y: attacker.sprite.y + aim.y * MUZZLE_DOWN,
      };
      launchBubble(scene, combat.bubbles, {
        from: muzzle,
        direction: bubble.direction,
        sway: bubble.sway,
        style,
        scale: BUBBLE_SCALE[charge],
        target: () => (target.sprite.scene ? { x: target.sprite.x, y: target.sprite.y } : null),
        onArrive: (impact) => {
          landRanged(
            scene,
            combat,
            attacker,
            target,
            impact,
            impact.stop === "fighter",
            share,
            charge,
            bubble.direction,
            style.impact,
            liveObstacles(combat),
            false,
          );
        },
      });
    };
    if (bubble.delayMs > 0) scene.time.delayedCall(bubble.delayMs, launch);
    else launch();
  }
}

function throwBones(
  scene: Phaser.Scene,
  combat: Combat,
  attacker: Player,
  target: Player,
  muzzle: Point,
  aim: Point,
  damage: number,
  charge: ChargeLevel,
) {
  const style = charge === 2 ? GROUND_BONE_CHARGED : GROUND_BONE;
  playArenaAudio(scene, "bone");
  for (const direction of boneVolley(aim, charge)) {
    launchBone(scene, combat.bones, {
      from: muzzle,
      direction,
      style,
      scale: BONE_SCALE[charge],
      speedScale: BONE_SPEED_SCALE[charge],
      owner: () => (attacker.sprite.scene ? { x: attacker.sprite.x, y: attacker.sprite.y } : null),
      target: () => (target.sprite.scene ? { x: target.sprite.x, y: target.sprite.y } : null),
      onHit: (impact) => {
        landRanged(
          scene,
          combat,
          attacker,
          target,
          impact,
          impact.stop === "fighter",
          damage,
          charge,
          direction,
          style.impact,
          liveObstacles(combat),
          false,
        );
      },
    });
  }
}

function stepCombat(scene: Phaser.Scene, combat: Combat, deltaMs: number) {
  if (
    combat.orbs.length === 0 &&
    combat.bones.length === 0 &&
    combat.stars.length === 0 &&
    combat.bubbles.length === 0
  ) {
    return;
  }
  const blocks = blockRects(combat);
  if (combat.orbs.length > 0) stepOrbs(scene, combat.orbs, deltaMs, blocks);
  if (combat.bones.length > 0) stepBones(scene, combat.bones, deltaMs, blocks);
  if (combat.stars.length > 0) stepStars(scene, combat.stars, deltaMs, blocks);
  if (combat.bubbles.length > 0) stepBubbles(scene, combat.bubbles, deltaMs, blocks);
}

function tryAttack(
  scene: Phaser.Scene,
  combat: Combat,
  attacker: Player,
  target: Player,
  kind: AttackKind,
  aim: Point,
  tuning: AttackTuning = PLAYER_TUNING,
  charge: ChargeLevel = 0,
) {
  if (combat.over) return false;
  if (attacker.attacking || attacker.hurting || attacker.defending || isDashing(attacker)) return false;
  const now = scene.time.now;
  if (!canAttack(now, attacker.readyAt[kind])) return false;
  attacker.facing = facingFromAim(aim.x, aim.y, attacker.facing);
  if (!playAttack(attacker, kind)) return false;
  if (kind === "melee") playArenaAudio(scene, "hit");
  attacker.readyAt[kind] = nextReadyAt(
    now,
    COOLDOWN_MS[kind] * tuning.cooldownScale * buffScale(attacker.buffs, "rapid", now),
  );
  const damage = attackDamage(attacker, target, kind, tuning, charge, now);
  flashMarker(attacker.marker, "attack", ATTACK_FLASH_MS);
  spawnRingWave(scene, attacker.marker, {
    color: charge > 0 ? CHARGE_COLOR[charge] : attacker.marker.palette.attack,
    count: charge + 1,
    grow: 2.2 + charge * 0.6,
    width: 2 + charge,
  });
  if (kind === "melee") {
    startMelee(scene, combat, attacker, target, aim, damage, charge);
    return true;
  }
  launchRanged(scene, combat, attacker, target, aim, damage, charge);
  return true;
}

function attackDamage(
  attacker: Player,
  target: Player,
  kind: AttackKind,
  tuning: AttackTuning,
  charge: ChargeLevel,
  now: number,
) {
  return chargedDamage(
    Math.max(
      1,
      Math.round(
        attackPower(kind, attacker.fighter.attacks[kind].power, target.maxHp) *
          tuning.damageScale *
          buffScale(attacker.buffs, "fury", now) *
          attacker.terrain.damage,
      ),
    ),
    charge,
  );
}

// Dispara o ataque à distância do lutador (osso, bolha, estrela, orbe ou feixe).
function launchRanged(
  scene: Phaser.Scene,
  combat: Combat,
  attacker: Player,
  target: Player,
  aim: Point,
  damage: number,
  charge: ChargeLevel,
) {
  const muzzle = {
    x: attacker.sprite.x + aim.x * MUZZLE_FORWARD,
    y: attacker.sprite.y + aim.y * MUZZLE_DOWN,
  };
  const obstacles = liveObstacles(combat);
  if (attacker.fighter.ranged === "bone") {
    throwBones(scene, combat, attacker, target, muzzle, aim, damage, charge);
    return;
  }
  if (attacker.fighter.ranged === "bubble") {
    fireBubbles(scene, combat, attacker, target, aim, damage, charge);
    return;
  }
  if (attacker.fighter.ranged === "star") {
    fireStars(scene, combat, attacker, target, muzzle, aim, damage, charge, obstacles);
    return;
  }
  if (attacker.fighter.ranged === "orb") {
    fireOrbs(scene, combat, attacker, target, muzzle, aim, damage, charge, obstacles);
    return;
  }
  castBeam(scene, combat.beams, {
    from: muzzle,
    rayFrom: muzzle,
    direction: aim,
    style: charge === 2 ? FIRE_BEAM_CHARGED : FIRE_BEAM,
    widthScale: BEAM_WIDTH[charge],
    chargeMs: charge > 0 ? CHARGED_BEAM_MS : undefined,
    blocks: obstacles.map(obstacleRect),
    target: { x: target.sprite.x, y: target.sprite.y },
    onArrive: (impact) => {
      const still =
        impact.stop === "fighter" &&
        beamImpact(muzzle, aim, BEAM_RANGE, blockRects(combat), {
          x: target.sprite.x,
          y: target.sprite.y,
        }).stop === "fighter";
      const color = charge === 2 ? FIRE_BEAM_CHARGED.impact : IMPACT_COLOR.fire;
      landRanged(scene, combat, attacker, target, impact, still, damage, charge, aim, color, obstacles);
    },
  });
}

function tryPlayerAttack(
  scene: Phaser.Scene,
  combat: Combat,
  player: Player,
  opponent: Player,
  worldX: number,
  worldY: number,
  charge: ChargeLevel = 0,
) {
  return tryAttack(
    scene,
    combat,
    player,
    opponent,
    combat.kind,
    aimVector(player, worldX, worldY),
    PLAYER_TUNING,
    charge,
  );
}

function tryPlayerDash(
  scene: Phaser.Scene,
  combat: Combat,
  player: Player,
  move: MoveVector,
) {
  if (combat.over) return false;
  if (player.attacking || player.hurting || player.defending || isDashing(player)) return false;
  const now = scene.time.now;
  if (!canAttack(now, player.dashReadyAt)) return false;
  const heading = dashHeading(move, player.facing);
  player.facing = facingFromAim(heading.x, heading.y, player.facing);
  player.dashReadyAt = nextReadyAt(now, DASH_COOLDOWN_MS * buffScale(player.buffs, "rapid", now));
  dashWithTrail(scene, combat.hitFx, player, heading, EVADE);
  playArenaAudio(scene, "dash");
  spawnRingWave(scene, player.marker, { color: 0xffc861, count: 1, grow: 1.8 });
  return true;
}

function cullProjectiles(
  scene: Phaser.Scene,
  combat: Combat,
  worldWidth: number,
  worldHeight: number,
) {
  if (worldWidth <= 0 || worldHeight <= 0) return;
  const obstacles = liveObstacles(combat);
  const blocks = obstacles.map(obstacleRect);
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
      stopProjectile(scene, combat, child, obstacles[blocked.index]);
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
  clearOrbs(scene, combat.orbs);
  clearBones(combat.bones);
  clearStars(scene, combat.stars);
  clearBubbles(scene, combat.bubbles);
  combat.projectiles.destroy(true);
  combat.aim.destroy();
  clearBanner(scene, combat.banner);
}

export {
  blockRects,
  clearCombatAim,
  createCombat,
  cullProjectiles,
  destroyCombat,
  layoutCombat,
  setCombatKind,
  showBanner,
  stepCombat,
  syncCombatAim,
  tryAttack,
  tryPlayerAttack,
  tryPlayerDash,
};
export type { AttackTuning, BlockEvent, Combat, HitSource };
