import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { pixelBurst, pixelRing, pixelScale } from "@/game/arena/entities/pixel-fx";
import type { Player } from "@/game/arena/entities/player";
import type { Point } from "@/lib/arena/combat";
import { GUARD_MAX } from "@/lib/arena/defense";
import Phaser from "phaser";

const SHIELD_COLOR = 0x8fd8ff;
const SHIELD_DEPTH = 2.5;
// Bolha centrada no tronco: um pouco abaixo do centro do sprite, raio pelos pés.
const CENTER_RATIO = 0.35;
const RADIUS_RATIO = 1.5;
const SQUASH = 0.92;
const SPIN_SPEED = 0.0012;
const PULSE_MS = 160;
const FLASH_MS = 160;
const CRACK_RATIO = 0.35;
const SPARK_COUNT = 7;
const SPARK_SPREAD = Math.PI / 2.2;
const SPARK_DISTANCE = 46;
const SPARK_MS = 280;
const SHARD_COUNT = 12;
const SHARD_DISTANCE = 80;
const SHARD_MS = 420;
const PARRY_COLOR = 0xffd23a;
const PARRY_TINTS = [0xffd23a, 0xfff6d0, 0xffffff];
const PARRY_RING_STEPS = 4;
const PARRY_RING_STEP_MS = 45;

type ShieldFx = {
  graphics: Phaser.GameObjects.Graphics;
  flashAt: number;
  flashColor: number;
};

const shields = new WeakMap<Player, ShieldFx>();

function shieldCenter(player: Player): Point {
  return {
    x: player.sprite.x,
    y: player.sprite.y + player.fighter.tuning.feetOffsetY * CENTER_RATIO,
  };
}

function shieldRadius(player: Player) {
  return player.fighter.tuning.feetOffsetY * RADIUS_RATIO;
}

function hexPoints(radius: number, angle: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const theta = angle + (Math.PI * 2 * index) / 6;
    return new Phaser.Math.Vector2(Math.cos(theta) * radius, Math.sin(theta) * radius * SQUASH);
  });
}

function drawShield(
  graphics: Phaser.GameObjects.Graphics,
  radius: number,
  now: number,
  guard: number,
  flash: number,
  flashColor: number,
) {
  const pulse = 1 + Math.sin(now / PULSE_MS) * 0.03;
  const r = radius * pulse;
  const strength = 0.45 + 0.55 * guard;
  const angle = (now * SPIN_SPEED) % (Math.PI * 2);
  graphics.clear();
  graphics.fillStyle(SHIELD_COLOR, (0.1 + flash * 0.25) * strength);
  graphics.fillEllipse(0, 0, r * 2, r * 2 * SQUASH);
  graphics.lineStyle(3 + flash * 2, flash > 0 ? flashColor : SHIELD_COLOR, 0.85 * strength + flash * 0.15);
  graphics.strokePoints(hexPoints(r, angle), true);
  graphics.lineStyle(1.5, SHIELD_COLOR, 0.5 * strength);
  graphics.strokePoints(hexPoints(r * 0.62, -angle), true);
  // Brilho no topo para dar volume.
  graphics.lineStyle(2, 0xffffff, 0.35 * strength);
  graphics.beginPath();
  graphics.arc(0, 0, r * 0.82, Math.PI * 1.15, Math.PI * 1.55);
  graphics.strokePath();
  if (guard >= CRACK_RATIO) return;
  // Guarda baixa: rachaduras fixas que denunciam a quebra iminente.
  graphics.lineStyle(2, 0xffffff, 0.8);
  [0.4, 2.3, 4.1].forEach((base) => {
    graphics.beginPath();
    graphics.moveTo(Math.cos(base) * r, Math.sin(base) * r * SQUASH);
    graphics.lineTo(Math.cos(base + 0.25) * r * 0.6, Math.sin(base + 0.25) * r * 0.6 * SQUASH);
    graphics.lineTo(Math.cos(base - 0.1) * r * 0.35, Math.sin(base - 0.1) * r * 0.35 * SQUASH);
    graphics.strokePath();
  });
}

// Desenha a bolha enquanto o lutador defende; some assim que ele solta.
function syncShieldFx(scene: Phaser.Scene, player: Player) {
  let shield = shields.get(player);
  if (!player.defending || player.hp <= 0) {
    if (shield) {
      shield.graphics.destroy();
      shields.delete(player);
    }
    return;
  }
  if (!shield) {
    const graphics = scene.add.graphics().setDepth(SHIELD_DEPTH).setBlendMode(Phaser.BlendModes.ADD);
    shield = { graphics, flashAt: -Infinity, flashColor: 0xffffff };
    shields.set(player, shield);
  }
  const now = scene.time.now;
  const center = shieldCenter(player);
  const flash = Math.max(0, 1 - (now - shield.flashAt) / FLASH_MS);
  shield.graphics.setPosition(center.x, center.y);
  drawShield(
    shield.graphics,
    shieldRadius(player),
    now,
    player.guard.meter / GUARD_MAX,
    flash,
    shield.flashColor,
  );
}

function burst(
  scene: Phaser.Scene,
  from: Point,
  angles: number[],
  distance: number,
  duration: number,
  scale: number,
) {
  angles.forEach((angle) => {
    const spark = scene.add
      .image(from.x, from.y, FX_TEXTURES.spark)
      .setTint(SHIELD_COLOR)
      .setScale(scale)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(SHIELD_DEPTH + 0.1);
    const reach = distance * (0.6 + Math.random() * 0.4);
    scene.tweens.add({
      targets: spark,
      x: from.x + Math.cos(angle) * reach,
      y: from.y + Math.sin(angle) * reach,
      alpha: 0,
      scale: scale * 0.3,
      duration,
      ease: "Quad.easeOut",
      onComplete: () => spark.destroy(),
    });
  });
}

// Golpe bloqueado: a bolha pisca e faíscas saltam de onde o golpe bateu.
function flashShield(scene: Phaser.Scene, player: Player, direction: Point) {
  const shield = shields.get(player);
  if (shield) {
    shield.flashAt = scene.time.now;
    shield.flashColor = 0xffffff;
  }
  const center = shieldCenter(player);
  const radius = shieldRadius(player);
  const length = Math.hypot(direction.x, direction.y) || 1;
  const ux = direction.x / length;
  const uy = direction.y / length;
  const at = { x: center.x - ux * radius, y: center.y - uy * radius * SQUASH };
  const back = Math.atan2(-uy, -ux);
  const angles = Array.from(
    { length: SPARK_COUNT },
    (_, index) => back + (index / (SPARK_COUNT - 1) - 0.5) * SPARK_SPREAD * 2,
  );
  burst(scene, at, angles, SPARK_DISTANCE, SPARK_MS, 1.6);
}

// Parry: a bolha pisca dourada e um anel de estilhaços em pixel cresce em
// degraus no ponto do impacto (padrão de docs/arena-pixel-fx.md).
function parryShield(scene: Phaser.Scene, player: Player, direction: Point) {
  const shield = shields.get(player);
  if (shield) {
    shield.flashAt = scene.time.now;
    shield.flashColor = PARRY_COLOR;
  }
  const center = shieldCenter(player);
  const radius = shieldRadius(player);
  const length = Math.hypot(direction.x, direction.y) || 1;
  const at = {
    x: Math.round(center.x - (direction.x / length) * radius),
    y: Math.round(center.y - (direction.y / length) * radius * SQUASH),
  };
  const scale = pixelScale(radius * 0.5);
  pixelRing(scene, at, FX_TEXTURES.shards, PARRY_COLOR, scale, PARRY_RING_STEPS, PARRY_RING_STEP_MS, SHIELD_DEPTH + 0.2);
  pixelRing(
    scene,
    center,
    FX_TEXTURES.shards,
    0xfff6d0,
    scale + 1,
    PARRY_RING_STEPS + 1,
    PARRY_RING_STEP_MS,
    SHIELD_DEPTH + 0.1,
  );
  pixelBurst(scene, at, PARRY_TINTS, 18, scale, 0, SHIELD_DEPTH + 0.2);
}

// Guarda quebrada: estilhaços em todas as direções.
function shatterShield(scene: Phaser.Scene, player: Player) {
  const angles = Array.from(
    { length: SHARD_COUNT },
    (_, index) => (Math.PI * 2 * index) / SHARD_COUNT + Math.random() * 0.3,
  );
  burst(scene, shieldCenter(player), angles, SHARD_DISTANCE, SHARD_MS, 2.2);
}

function clearShieldFx(player: Player) {
  const shield = shields.get(player);
  if (!shield) return;
  if (shield.graphics.scene) shield.graphics.destroy();
  shields.delete(player);
}

export { clearShieldFx, flashShield, parryShield, shatterShield, syncShieldFx };
