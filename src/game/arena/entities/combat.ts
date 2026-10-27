import { clearAim, createAim, drawAimShape, type AimShape } from "@/game/arena/entities/aim";
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
  castBolt,
  clearBolts,
  spawnShockSparks,
  THUNDER_BOLT,
  THUNDER_BOLT_CHARGED,
  type BoltShot,
} from "@/game/arena/entities/bolt";
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
  spawnPickupLabel,
} from "@/game/arena/entities/damage-number";
import { castFireTornado, spawnBurn } from "@/game/arena/entities/fire-tornado";
import { castLastResort } from "@/game/arena/entities/last-resort";
import { popPoisonBubble } from "@/game/arena/entities/poison-fx";
import { castQuake } from "@/game/arena/entities/quake";
import { clearSpecials, stepSpecials, type SpecialFx } from "@/game/arena/entities/special-fx";
import { castSurf } from "@/game/arena/entities/surf";
import { castThunder } from "@/game/arena/entities/thunder";
import { castToxicMist } from "@/game/arena/entities/toxic-mist";
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
  endChannel,
  isChanneling,
  isDashing,
  isEvading,
  isStunned,
  lowerDefense,
  playAttack,
  playHurt,
  playerAnchor,
  setPlayerHp,
  startDash,
  stunPlayer,
  type Player,
} from "@/game/arena/entities/player";
import { chargedDamage, type ChargeLevel } from "@/lib/arena/charge";
import {
  applyHit,
  attackPower,
  BEAM_RANGE,
  BEAM_TARGET_RADIUS,
  beamImpact,
  boltVolley,
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
  type Rect,
  type ResolvedHit,
} from "@/lib/arena/combat";
import { aimReach, powerForDistance } from "@/lib/arena/aim";
import type { SpecialStyle } from "@/lib/arena/fighter";
import {
  addSpecial,
  applyPoison,
  blinkPoints,
  FIRE_TORNADO_DAMAGE,
  FIRE_TORNADO_MS,
  FIRE_TORNADO_RADIUS,
  FIRE_TORNADO_TICK_MS,
  insideZone,
  LAST_RESORT_BLINK_MS,
  LAST_RESORT_BLINKS,
  LAST_RESORT_RANGE,
  pointInRange,
  poisonTick,
  poisonTickDamage,
  QUAKE_BAND,
  QUAKE_MS,
  quakeRingHit,
  specialGain,
  specialReady,
  splitDamage,
  SURF_RADIUS,
  SURF_RANGE,
  surfWaveHit,
  THUNDER_RADIUS,
  THUNDER_RANGE,
  THUNDER_STUN_MS,
  SPECIAL_AIM,
  TOXIC_IMPACT,
  TOXIC_LINGER_DAMAGE,
  TOXIC_LINGER_MS,
  TOXIC_RANGE,
  TOXIC_TICK_MS,
  toxicSweepHit,
  type SpecialEvent,
} from "@/lib/arena/special";
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
  special: 0x5cf2ff,
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
// Espessura do raio em blocos da grade.
const BOLT_THICKNESS: Record<ChargeLevel, number> = { 0: 1, 1: 2, 2: 1 };
// O giro alcança em volta, mas um pouco menos que o golpe direcional.
const SPIN_REACH = 0.85;
const SPIN_COLOR = 0x6cc4ff;
const BONE_SPEED_SCALE: Record<ChargeLevel, number> = { 0: 1, 1: 1.15, 2: 1.1 };
const SLASH_LOOK: Record<ChargeLevel, SlashLook> = {
  0: { color: 0xffffff, thickness: 1 },
  1: { color: 0xffd0a0, thickness: 1.5 },
  2: { color: 0xf3c4ff, thickness: 2.1 },
};
const SPECIAL_COLOR: Record<SpecialStyle, number> = {
  "fire-tornado": 0xff6a1a,
  "toxic-mist": 0x9a3ad8,
  quake: 0xc9a070,
  "last-resort": 0xffc23a,
  surf: 0x6cc4ff,
  thunder: 0xffe14a,
};
const SPECIAL_RING_COLOR = 0x5cf2ff;
const POISON_COLOR = 0x9a3ad8;
const STATUS_LABEL_OFFSET_Y = 84;
// Quem sai do furacão continua lento por um instante.
const FIRE_TORNADO_SLOW_LINGER_MS = FIRE_TORNADO_TICK_MS + 150;
// O furacão nasce um pouco à frente de quem lança.
const FIRE_TORNADO_SPAWN = 60;
const FIRE_TORNADO_HOLD = 8;
// Som do acerto toca quando o furacão começa a encostar, não a cada tique.
const FIRE_TORNADO_SOUND_GAP_MS = 900;
// Estouro de bolha na névoa: laser mais agudo e baixo, variando a cada tique.
const BUBBLE_POP_RATE = 1.5;
const BUBBLE_POP_RATE_SPREAD = 0.6;
const BUBBLE_POP_VOLUME = 0.6;
// Empurrões do Surfar e do último golpe do Último Recurso.
const SURF_PUSH = { speed: 760, durationMs: 180 };
const LAST_RESORT_PUSH = { speed: 640, durationMs: 140 };
const LAST_RESORT_SETTLE_MS = 150;
const QUAKE_SHAKE = 0.006;
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

// `light` = tique de dano contínuo (sem hurt nem parry); `unblockable` =
// atravessa a defesa (Terremoto).
type HurtOptions = {
  light?: boolean;
  unblockable?: boolean;
};

type Combat = {
  kind: AttackKind;
  over: boolean;
  banner: BannerBucket;
  onHpChange: () => void;
  onBlock: (event: BlockEvent) => void;
  // Medidor do especial de alguém mudou.
  onSpecial: (fighter: Player) => void;
  specials: SpecialFx[];
  projectiles: Phaser.Physics.Arcade.Group;
  cracks: Phaser.GameObjects.GameObject[];
  hitFx: Phaser.GameObjects.GameObject[];
  numbers: Phaser.GameObjects.Container[];
  beams: BeamShot[];
  orbs: OrbShot[];
  bones: BoneShot[];
  stars: StarShot[];
  bubbles: BubbleShot[];
  bolts: BoltShot[];
  overlap: Phaser.Physics.Arcade.Collider;
  blockOverlap: Phaser.Physics.Arcade.Collider;
  obstacles: Obstacle[];
  // Ponto do chão em água: impacto espirra em vez de rachar.
  isWater: (at: Point) => boolean;
  aim: Phaser.GameObjects.Graphics;
  // Jogador e oponente (o veneno avança nos dois).
  fighters: readonly Player[];
  // WASD do jogador: guia o furacão dele. A CPU guia para o alvo.
  playerMove: () => Point;
};

function createCombat(
  scene: Phaser.Scene,
  player: Player,
  opponent: Player,
  obstacles: Obstacle[],
  onHpChange: () => void = () => {},
  onBlock: (event: BlockEvent) => void = () => {},
  isWater: (at: Point) => boolean = () => false,
  onSpecial: (fighter: Player) => void = () => {},
): Combat {
  const projectiles = scene.physics.add.group();
  const combat: Combat = {
    kind: "melee",
    over: false,
    banner: { current: null },
    onHpChange,
    onBlock,
    onSpecial,
    specials: [],
    projectiles,
    cracks: [],
    hitFx: [],
    numbers: [],
    beams: [],
    orbs: [],
    bones: [],
    stars: [],
    bubbles: [],
    bolts: [],
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
    fighters: [player, opponent],
    playerMove: () => ({ x: 0, y: 0 }),
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
  shape: AimShape | null = null,
) {
  drawAimShape(combat.aim, fromX, fromY, toX, toY, shape);
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
  options: HurtOptions = {},
) {
  const now = scene.time.now;
  const skip = combat.over || isEvading(target) || now < target.untouchableUntil;
  const guarded = !skip && target.defending && hit.damage > 0 && !options.unblockable;
  if (guarded && !options.light && isParry(target.guard, now)) {
    parryHit(scene, combat, target, direction, source);
    if (source && source.kind !== "special") chargeSpecial(scene, combat, target, "parried", 0, target.maxHp);
    return { hp: target.hp, applied: false, dealt: 0 };
  }
  const block = guarded ? spendGuard(target.guard, charge, now) : null;
  if (block) {
    target.guard = block.guard;
    hit = defendHit(hit);
  }
  const exposed = buffScale(target.buffs, "vulnerable", now);
  const damage = exposed === 1 ? hit.damage : Math.round(hit.damage * exposed);
  const result = applyHit(target.hp, damage, skip);
  if (!result.applied) return result;
  setPlayerHp(target, result.hp);
  // Especial não enche medidor de ninguém (sem especial em cadeia).
  if (source && source.kind !== "special") {
    chargeSpecial(scene, combat, target, block ? "blocked" : "taken", result.dealt, target.maxHp);
    chargeSpecial(scene, combat, source.attacker, "dealt", result.dealt, target.maxHp);
  }
  if (block && !block.broke) {
    blockedHit(scene, combat, target, hit, direction, result.dealt);
    return result;
  }
  if (block?.broke) breakGuard(scene, combat, target);
  // Golpe que passa a defesa desfaz o furacão de quem está guiando.
  if (!options.light && isChanneling(target)) endChannel(target);
  if (options.light) {
    lightHit(scene, combat, target, hit, result.dealt);
    return result;
  }
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

// Tique de dano contínuo: número e flash, sem travar o lutador em hurt.
function lightHit(scene: Phaser.Scene, combat: Combat, target: Player, hit: ResolvedHit, dealt: number) {
  combat.onHpChange();
  flashMarker(target.marker, "hurt", HURT_FLASH_MS / 2);
  spawnDamageNumber(
    scene,
    combat.numbers,
    target.sprite.x,
    target.sprite.y - HURT_NUMBER_OFFSET_Y,
    dealt,
    hit.tags,
  );
}

function chargeSpecial(
  scene: Phaser.Scene,
  combat: Combat,
  fighter: Player,
  event: SpecialEvent,
  dealt: number,
  maxHp: number,
) {
  if (combat.over || fighter.hp <= 0) return;
  const before = fighter.special;
  fighter.special = addSpecial(before, specialGain(event, dealt, maxHp));
  if (fighter.special === before) return;
  if (specialReady(fighter.special) && !specialReady(before)) fighter.specialFullAt = scene.time.now;
  combat.onSpecial(fighter);
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
  const { attacker } = source;
  // Especial aparado volta como tiro comum.
  const kind = source.kind === "special" ? "fire" : source.kind;
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
  if (player.fighter.tuning.meleeShock) {
    spawnShockSparks(
      scene,
      combat.hitFx,
      { x: opponent.sprite.x, y: opponent.sprite.y },
      charge === 2 ? THUNDER_BOLT_CHARGED : THUNDER_BOLT,
    );
  }
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

function fireBolts(
  scene: Phaser.Scene,
  combat: Combat,
  attacker: Player,
  target: Player,
  aim: Point,
  damage: number,
  charge: ChargeLevel,
) {
  const style = charge === 2 ? THUNDER_BOLT_CHARGED : THUNDER_BOLT;
  const volley = boltVolley(aim, charge);
  // O dano do golpe se divide entre os raios do leque.
  const share = Math.max(1, Math.round(damage / volley.length));
  playArenaAudio(scene, "laser");
  for (const direction of volley) {
    castBolt(scene, combat.bolts, {
      origin: () =>
        combat.over || !attacker.sprite.scene
          ? null
          : {
              x: attacker.sprite.x + aim.x * MUZZLE_FORWARD,
              y: attacker.sprite.y + aim.y * MUZZLE_DOWN,
            },
      direction,
      style,
      thickness: BOLT_THICKNESS[charge],
      blocks: () => blockRects(combat),
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
          liveObstacles(combat),
          false,
        );
      },
    });
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
  if (combat.specials.length > 0) stepSpecials(combat.specials, deltaMs);
  stepPoison(scene, combat);
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
  // Ponto mirado no chão (zonas do especial). Sem valor, a posição do alvo.
  aimAt: Point = playerAnchor(target),
  // Alcance escolhido pela força da mira (especiais com mira de força).
  reach: number | null = null,
) {
  if (combat.over) return false;
  if (attacker.attacking || attacker.hurting || attacker.defending || isDashing(attacker)) return false;
  if (isStunned(attacker) || isChanneling(attacker)) return false;
  const now = scene.time.now;
  if (!canAttack(now, attacker.readyAt[kind])) return false;
  if (kind === "special" && !canCastSpecial(combat, attacker, target)) return false;
  attacker.facing = facingFromAim(aim.x, aim.y, attacker.facing);
  if (!playAttack(attacker, kind)) return false;
  if (kind === "melee") playArenaAudio(scene, "hit");
  attacker.readyAt[kind] = nextReadyAt(
    now,
    COOLDOWN_MS[kind] * tuning.cooldownScale * buffScale(attacker.buffs, "rapid", now),
  );
  if (kind === "special") {
    const damage = attackDamage(attacker, target, kind, tuning, 0, now);
    attacker.special = 0;
    combat.onSpecial(attacker);
    flashMarker(attacker.marker, "attack", ATTACK_FLASH_MS);
    spawnRingWave(scene, attacker.marker, { color: SPECIAL_RING_COLOR, count: 3, grow: 3, width: 4 });
    launchSpecial(scene, combat, attacker, target, aim, aimAt, damage, reach);
    return true;
  }
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

function fighterPoint(player: Player): Point | null {
  return player.sprite.scene ? { x: player.sprite.x, y: player.sprite.y } : null;
}

function unitFrom(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  return length === 0 ? { x: 1, y: 0 } : { x: dx / length, y: dy / length };
}

function insideRect(rect: Rect, at: Point) {
  return Math.abs(at.x - rect.x) <= rect.width / 2 && Math.abs(at.y - rect.y) <= rect.height / 2;
}

// Medidor cheio; o Último Recurso ainda precisa do alvo perto e à vista.
function canCastSpecial(combat: Combat, attacker: Player, target: Player) {
  if (!specialReady(attacker.special)) return false;
  if (attacker.fighter.special !== "last-resort") return true;
  const distance = Math.hypot(target.sprite.x - attacker.sprite.x, target.sprite.y - attacker.sprite.y);
  return (
    target.hp > 0 &&
    distance <= LAST_RESORT_RANGE &&
    firstBlockHit(attacker.sprite, target.sprite, blockRects(combat)) === null
  );
}

// Selo flutuante de estado (ENVENENADO!) no estilo dos consumíveis.
function statusLabel(scene: Phaser.Scene, combat: Combat, fighter: Player, text: string, color: number) {
  spawnPickupLabel(
    scene,
    combat.numbers,
    fighter.sprite.x,
    fighter.sprite.y - STATUS_LABEL_OFFSET_Y,
    text,
    color,
  );
}

// Tiques do veneno: dano contínuo que a defesa não segura.
function stepPoison(scene: Phaser.Scene, combat: Combat) {
  const now = scene.time.now;
  for (const fighter of combat.fighters) {
    if (!fighter.poison) continue;
    if (combat.over || fighter.hp <= 0) {
      fighter.poison = null;
      continue;
    }
    const step = poisonTick(fighter.poison, now);
    fighter.poison = step.poison;
    // Veneno acabou: o HUD tira o selo.
    if (!step.poison) combat.onHpChange();
    if (!step.tick) continue;
    const damage = step.poison?.damage ?? 1;
    popPoisonBubble(scene, { x: fighter.sprite.x, y: fighter.sprite.y - 20 }, true);
    hurtFighter(scene, combat, fighter, { damage, tags: [] }, { x: 0, y: -1 }, POISON_COLOR, false, 0, null, {
      light: true,
      unblockable: true,
    });
  }
}

function launchSpecial(
  scene: Phaser.Scene,
  combat: Combat,
  attacker: Player,
  target: Player,
  aim: Point,
  aimAt: Point,
  damage: number,
  reach: number | null,
) {
  showBanner(scene, combat, `${attacker.fighter.attacks.special.hudName}!`, "special");
  playArenaAudio(scene, "appear");
  switch (attacker.fighter.special) {
    case "fire-tornado":
      return castFireTornadoSpecial(scene, combat, attacker, target, aim, damage);
    case "toxic-mist":
      return castToxicMistSpecial(scene, combat, attacker, target, aim, damage, reach);
    case "quake":
      return castQuakeSpecial(scene, combat, attacker, target, damage);
    case "last-resort":
      return castLastResortSpecial(scene, combat, attacker, target, damage);
    case "surf":
      return castSurfSpecial(scene, combat, attacker, target, aim, damage, reach);
    case "thunder":
      return castThunderSpecial(scene, combat, attacker, target, aimAt, damage);
  }
}

// Redemoinho de Fogo: furacão guiado pelo WASD (CPU: rumo ao alvo). Quem lança
// fica parado canalizando até o tempo acabar, clicar de novo ou levar golpe.
function castFireTornadoSpecial(
  scene: Phaser.Scene,
  combat: Combat,
  attacker: Player,
  target: Player,
  aim: Point,
  damage: number,
) {
  const origin = playerAnchor(attacker);
  const parts = splitDamage(damage * FIRE_TORNADO_DAMAGE, Math.round(FIRE_TORNADO_MS / FIRE_TORNADO_TICK_MS));
  const source: HitSource = { attacker, kind: "special" };
  const guided = attacker === combat.fighters[0];
  let tick = 0;
  let touching = false;
  let soundAt = -Infinity;
  attacker.channelUntil = scene.time.now + FIRE_TORNADO_MS;
  playArenaAudio(scene, "explosion");
  combat.specials.push(
    castFireTornado(scene, {
      from: { x: origin.x + aim.x * FIRE_TORNADO_SPAWN, y: origin.y + aim.y * FIRE_TORNADO_SPAWN },
      move: (at) => {
        if (guided) return combat.playerMove();
        if (!target.sprite.scene) return { x: 0, y: 0 };
        const feet = playerAnchor(target);
        // Colado no alvo, a CPU segura o furacão em cima dele.
        if (Math.hypot(feet.x - at.x, feet.y - at.y) < FIRE_TORNADO_HOLD) return { x: 0, y: 0 };
        return { x: feet.x - at.x, y: feet.y - at.y };
      },
      owner: () => (attacker.sprite.scene ? playerAnchor(attacker) : null),
      active: () => !combat.over && attacker.hp > 0 && isChanneling(attacker),
      blocks: () => blockRects(combat),
      onBlock: (impact) => {
        hitObstacle(scene, liveObstacles(combat)[impact.block ?? -1], parts[0] ?? 1, impact);
      },
      onTick: (at) => {
        const part = parts[tick] ?? 0;
        tick += 1;
        if (combat.over || !target.sprite.scene) return;
        const feet = playerAnchor(target);
        const inside = insideZone(at, FIRE_TORNADO_RADIUS, feet);
        const entered = inside && !touching;
        touching = inside;
        if (!inside) return;
        target.slowUntil = scene.time.now + FIRE_TORNADO_SLOW_LINGER_MS;
        const result = hurtFighter(scene, combat, target, rollHit(part), unitFrom(at, feet), SPECIAL_COLOR["fire-tornado"], false, 0, source, {
          light: true,
        });
        if (!result.applied) return;
        spawnBurn(scene, combat.hitFx, () => fighterPoint(target));
        const now = scene.time.now;
        if (entered && now - soundAt >= FIRE_TORNADO_SOUND_GAP_MS) {
          soundAt = now;
          playArenaAudio(scene, "fireTornadoHit");
        }
      },
    }),
  );
}

// Sem força escolhida (CPU): alcance da mira que cai em cima do alvo.
function reachTowardTarget(style: SpecialStyle, origin: Point, target: Point, fallback: number) {
  const spec = SPECIAL_AIM[style];
  if (!spec) return fallback;
  return aimReach(spec, powerForDistance(spec, Math.hypot(target.x - origin.x, target.y - origin.y)));
}

// Dano dentro da névoa: o laser agudo e com tom sorteado soa como bolha estourando.
function bubblePop(scene: Phaser.Scene) {
  playArenaAudio(scene, "laser", {
    rate: BUBBLE_POP_RATE + Math.random() * BUBBLE_POP_RATE_SPREAD,
    volume: BUBBLE_POP_VOLUME,
  });
}

// Névoa de Veneno: rajada que avança crescendo (acerta uma vez quem varrer) e
// vira nuvem por um instante (tiques enquanto o alvo fica dentro). Envenena.
function castToxicMistSpecial(
  scene: Phaser.Scene,
  combat: Combat,
  attacker: Player,
  target: Player,
  aim: Point,
  damage: number,
  reach: number | null,
) {
  // Nível do chão (pés), o mesmo do cone da mira.
  const origin = playerAnchor(attacker);
  const distance = reach ?? reachTowardTarget("toxic-mist", origin, playerAnchor(target), TOXIC_RANGE);
  const stop = beamImpact(origin, aim, Math.min(distance, TOXIC_RANGE), blockRects(combat), null);
  const source: HitSource = { attacker, kind: "special" };
  const lingerParts = splitDamage(damage * TOXIC_LINGER_DAMAGE, Math.round(TOXIC_LINGER_MS / TOXIC_TICK_MS));
  const tickDamage = poisonTickDamage(damage);
  let struck = false;
  let lingerTick = 0;
  let lingerAt = -Infinity;
  const poison = () => {
    const fresh = target.poison === null;
    target.poison = applyPoison(target.poison, scene.time.now, tickDamage);
    if (fresh) {
      statusLabel(scene, combat, target, "ENVENENADO!", POISON_COLOR);
      combat.onHpChange();
    }
  };
  playArenaAudio(scene, "toxicMist");
  const mist = castToxicMist(scene, {
    origin,
    direction: aim,
    distance: stop.distance,
    onSweep: (previous, travelled, radius) => {
      if (struck || combat.over || target.hp <= 0 || !target.sprite.scene) return;
      if (!toxicSweepHit(origin, aim, previous, travelled, radius, playerAnchor(target))) return;
      struck = true;
      const hit = rollHit(Math.max(1, Math.round(damage * TOXIC_IMPACT)));
      const result = hurtFighter(scene, combat, target, hit, aim, SPECIAL_COLOR["toxic-mist"], false, 0, source);
      if (!result.applied) return;
      bubblePop(scene);
      poison();
    },
    onLinger: (center, radius) => {
      const now = scene.time.now;
      if (now - lingerAt < TOXIC_TICK_MS) return;
      if (combat.over || target.hp <= 0 || !target.sprite.scene) return;
      if (!insideZone(center, radius, playerAnchor(target))) return;
      lingerAt = now;
      const part = lingerParts[lingerTick] ?? 0;
      lingerTick += 1;
      const result = hurtFighter(scene, combat, target, rollHit(part), aim, SPECIAL_COLOR["toxic-mist"], false, 0, source, {
        light: true,
      });
      if (!result.applied) return;
      bubblePop(scene);
      poison();
    },
  });
  if (mist) combat.specials.push(mist);
}

// Terremoto: o anel acerta uma vez quem a borda atravessar; ignora defesa.
function castQuakeSpecial(scene: Phaser.Scene, combat: Combat, attacker: Player, target: Player, damage: number) {
  const origin = playerAnchor(attacker);
  const source: HitSource = { attacker, kind: "special" };
  const shaken = new Set<Obstacle>();
  let struck = false;
  playArenaAudio(scene, "explosion");
  scene.cameras.main.shake(QUAKE_MS, QUAKE_SHAKE);
  markGround(scene, combat, origin.x, origin.y, damage * 2);
  combat.specials.push(
    castQuake(scene, {
      origin,
      onRing: (previous, next) => {
        if (combat.over) return;
        for (const obstacle of liveObstacles(combat)) {
          if (shaken.has(obstacle)) continue;
          const rect = obstacleRect(obstacle);
          const distance = Math.hypot(rect.x - origin.x, rect.y - origin.y);
          const band = QUAKE_BAND + Math.min(rect.width, rect.height) / 2;
          if (!quakeRingHit(previous, next, distance, band)) continue;
          shaken.add(obstacle);
          hitObstacle(scene, obstacle, damage, { x: rect.x, y: rect.y });
        }
        if (struck || !target.sprite.scene) return;
        const feet = playerAnchor(target);
        if (!quakeRingHit(previous, next, Math.hypot(feet.x - origin.x, feet.y - origin.y))) return;
        struck = true;
        const hit = rollHit(damage);
        const result = hurtFighter(scene, combat, target, hit, unitFrom(origin, feet), SPECIAL_COLOR.quake, true, 0, source, {
          unblockable: true,
        });
        if (!result.applied) return;
        announceHit(scene, combat, hit, 0);
        markGround(scene, combat, target.sprite.x, target.sprite.y + MELEE_CRACK_OFFSET_Y, hit.damage);
      },
    }),
  );
}

// Último Recurso: some e reaparece em volta do alvo, um golpe por ponto.
function castLastResortSpecial(
  scene: Phaser.Scene,
  combat: Combat,
  attacker: Player,
  target: Player,
  damage: number,
) {
  const parts = splitDamage(damage, LAST_RESORT_BLINKS);
  const from = { x: attacker.sprite.x, y: attacker.sprite.y };
  const source: HitSource = { attacker, kind: "special" };
  const bounds = scene.physics.world.bounds;
  attacker.untouchableUntil = scene.time.now + LAST_RESORT_BLINKS * LAST_RESORT_BLINK_MS + LAST_RESORT_SETTLE_MS;
  playArenaAudio(scene, "dash");
  combat.specials.push(
    castLastResort(scene, combat.hitFx, {
      attacker,
      count: LAST_RESORT_BLINKS,
      pointAt: (index) => blinkPoints(target.sprite, from)[index] ?? null,
      target: () => fighterPoint(target),
      canStand: (at) => bounds.contains(at.x, at.y) && !blockRects(combat).some((rect) => insideRect(rect, at)),
      onBlink: (index, aim) => {
        if (combat.over || target.hp <= 0) return;
        playArenaAudio(scene, "hit");
        const last = index === LAST_RESORT_BLINKS - 1;
        const hit = rollHit(parts[index] ?? 0);
        const result = hurtFighter(scene, combat, target, hit, aim, SPECIAL_COLOR["last-resort"], last, 0, source);
        if (!result.applied || !last) return;
        announceHit(scene, combat, hit, 0);
        if (!target.defending) startDash(target, aim.x, aim.y, LAST_RESORT_PUSH.speed, LAST_RESORT_PUSH.durationMs);
        markGround(scene, combat, target.sprite.x, target.sprite.y + MELEE_CRACK_OFFSET_Y, hit.damage);
      },
    }),
  );
}

// Surfar: a onda varre a linha da mira e arrasta o alvo que pegar.
function castSurfSpecial(
  scene: Phaser.Scene,
  combat: Combat,
  attacker: Player,
  target: Player,
  aim: Point,
  damage: number,
  reach: number | null,
) {
  // Nível do chão (pés), o mesmo do cone da mira.
  const origin = playerAnchor(attacker);
  const distance = reach ?? reachTowardTarget("surf", origin, playerAnchor(target), SURF_RANGE);
  const stop = beamImpact(origin, aim, Math.min(distance, SURF_RANGE), blockRects(combat), null);
  const source: HitSource = { attacker, kind: "special" };
  let struck = false;
  playArenaAudio(scene, "waterIn");
  const wave = castSurf(scene, {
    origin,
    direction: aim,
    distance: stop.distance,
    onStep: (previous, travelled) => {
      if (travelled >= stop.distance && stop.stop === "block") {
        const block = beamImpact(origin, aim, stop.distance + 4, blockRects(combat), null);
        if (block.stop === "block") hitObstacle(scene, liveObstacles(combat)[block.block ?? -1], damage, block);
      }
      if (struck || combat.over || !target.sprite.scene) return;
      const feet = playerAnchor(target);
      if (!surfWaveHit(origin, aim, previous, travelled, feet, BEAM_TARGET_RADIUS / 2 + SURF_RADIUS)) return;
      struck = true;
      const hit = rollHit(damage);
      const result = hurtFighter(scene, combat, target, hit, aim, SPECIAL_COLOR.surf, true, 0, source);
      if (!result.applied) return;
      announceHit(scene, combat, hit, 0);
      spawnWaterSplash(scene, { x: target.sprite.x, y: target.sprite.y }, hit.damage);
      if (!target.defending) startDash(target, aim.x, aim.y, SURF_PUSH.speed, SURF_PUSH.durationMs);
    },
  });
  if (wave) combat.specials.push(wave);
}

// Trovão: marca os pés do alvo (ou o ponto mirado, se longe) e o raio cai depois.
function castThunderSpecial(
  scene: Phaser.Scene,
  combat: Combat,
  attacker: Player,
  target: Player,
  aimAt: Point,
  damage: number,
) {
  const origin = playerAnchor(attacker);
  const feet = playerAnchor(target);
  const near = Math.hypot(feet.x - origin.x, feet.y - origin.y) <= THUNDER_RANGE;
  const at = near ? feet : pointInRange(origin, aimAt, THUNDER_RANGE);
  const source: HitSource = { attacker, kind: "special" };
  playArenaAudio(scene, "laser");
  combat.specials.push(
    castThunder(scene, {
      at,
      onStrike: (spot) => {
        playArenaAudio(scene, "explosion");
        markGround(scene, combat, spot.x, spot.y, damage);
        if (combat.over || !target.sprite.scene) return;
        const now = playerAnchor(target);
        if (!insideZone(spot, THUNDER_RADIUS, now)) return;
        const hit = rollHit(damage);
        const result = hurtFighter(scene, combat, target, hit, unitFrom(spot, now), SPECIAL_COLOR.thunder, true, 0, source);
        if (!result.applied) return;
        announceHit(scene, combat, hit, 0);
        spawnShockSparks(scene, combat.hitFx, { x: target.sprite.x, y: target.sprite.y }, THUNDER_BOLT);
        // Defesa segura o raio sem paralisar.
        if (!target.defending && target.hp > 0) stunPlayer(target, THUNDER_STUN_MS);
      },
    }),
  );
}

// Dispara o ataque à distância do lutador (osso, bolha, raio, estrela, orbe ou feixe).
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
  if (attacker.fighter.ranged === "bolt") {
    fireBolts(scene, combat, attacker, target, aim, damage, charge);
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
  reach: number | null = null,
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
    { x: worldX, y: worldY },
    reach,
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
  if (isStunned(player) || isChanneling(player)) return false;
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
  clearBolts(combat.bolts);
  clearSpecials(combat.specials);
  combat.projectiles.destroy(true);
  combat.aim.destroy();
  clearBanner(scene, combat.banner);
}

export {
  blockRects,
  canCastSpecial,
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
