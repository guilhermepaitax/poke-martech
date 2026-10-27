import {
  isDashing,
  startDash,
  type DashKind,
  type Player,
} from "@/game/arena/entities/player";
import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import type { Point } from "@/lib/arena/combat";
import Phaser from "phaser";

const SLASH_DEPTH = 6;
const SLASH_SWEEP = Math.PI * 0.62;
const SLASH_THICKNESS = 14;
const SLASH_STEPS = 18;
const SLASH_DRAW_MS = 90;
const SLASH_FADE_MS = 150;
const SLASH_COLOR = 0xffffff;
const GHOST_EVERY_MS = 22;
const GHOST_FADE_MS = 200;
const GHOST_DEPTH = 1.9;
const TRAIL_DEPTH = 1.8;
const TRAIL_FADE_MS = 220;
const TRAIL_LINES = [-14, 0, 14];
const TRAIL_LENGTH = 70;
const DUST_DEPTH = 1.7;
const DUST_PUFFS = 5;
const DUST_SPREAD = 22;
const DUST_RADIUS = 9;
const DUST_GROW = 2.2;
const DUST_FADE_MS = 340;
const DUST_COLOR = 0xd8c6a4;
const DUST_FEET_OFFSET_Y = 34;
const SHOCK_DEPTH = 6.5;
const SHOCK_MS = 420;
const SHOCK_RINGS = 3;
const SHOCK_STAGGER_MS = 70;
const GLOW_TEXTURE_RADIUS = 32;

type SlashLook = {
  color: number;
  thickness: number;
};

const PLAIN_SLASH: SlashLook = { color: SLASH_COLOR, thickness: 1 };

type DashStyle = {
  kind: DashKind;
  speed: number;
  durationMs: number;
  ghostTint: number;
  ghostAlpha: number;
};

const LUNGE: DashStyle = {
  kind: "lunge",
  speed: 620,
  durationMs: 100,
  ghostTint: 0xffffff,
  ghostAlpha: 0.45,
};

const EVADE: DashStyle = {
  kind: "evade",
  speed: 900,
  durationMs: 160,
  ghostTint: 0xffc861,
  ghostAlpha: 0.55,
};

function dashDistance(style: DashStyle) {
  return (style.speed * style.durationMs) / 1000;
}

const DASH_DISTANCE = dashDistance(LUNGE);

function track(
  bucket: Phaser.GameObjects.GameObject[],
  object: Phaser.GameObjects.GameObject,
) {
  bucket.push(object);
  return () => {
    const index = bucket.indexOf(object);
    if (index >= 0) bucket.splice(index, 1);
    if (object.scene) object.destroy();
  };
}

function paintSlash(
  graphics: Phaser.GameObjects.Graphics,
  radius: number,
  progress: number,
  look: SlashLook,
) {
  graphics.clear();
  if (progress <= 0) return;
  const start = -SLASH_SWEEP / 2;
  const span = SLASH_SWEEP * progress;
  const outer: Phaser.Math.Vector2[] = [];
  const inner: Phaser.Math.Vector2[] = [];
  for (let index = 0; index <= SLASH_STEPS; index += 1) {
    const u = index / SLASH_STEPS;
    const angle = start + span * u;
    const thickness =
      SLASH_THICKNESS * look.thickness * Math.max(0.08, Math.sin(Math.PI * u));
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    outer.push(new Phaser.Math.Vector2(cos * radius, sin * radius));
    inner.push(new Phaser.Math.Vector2(cos * (radius - thickness), sin * (radius - thickness)));
  }
  const ring = [...outer, ...inner.reverse()];
  graphics.lineStyle(6 * look.thickness, look.color, 0.28);
  graphics.strokePoints(ring, true);
  graphics.fillStyle(look.color, 0.92);
  graphics.fillPoints(ring, true);
}

function spawnSlashArc(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  origin: Point,
  aim: Point,
  radius: number,
  look: SlashLook = PLAIN_SLASH,
) {
  const graphics = scene.add
    .graphics()
    .setPosition(origin.x, origin.y)
    .setRotation(Math.atan2(aim.y, aim.x))
    .setDepth(SLASH_DEPTH);
  const release = track(bucket, graphics);
  const sweep = { progress: 0 };
  scene.tweens.add({
    targets: sweep,
    progress: 1,
    duration: SLASH_DRAW_MS,
    ease: "Quad.easeOut",
    onUpdate: () => {
      if (graphics.scene) paintSlash(graphics, radius, sweep.progress, look);
    },
    onComplete: () => {
      if (!graphics.scene) return;
      paintSlash(graphics, radius, 1, look);
      scene.tweens.add({
        targets: graphics,
        alpha: 0,
        scale: 1.08,
        duration: SLASH_FADE_MS,
        ease: "Quad.easeIn",
        onComplete: release,
      });
    },
  });
}

function spawnGhost(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  sprite: Phaser.Physics.Arcade.Sprite,
  style: DashStyle,
) {
  const ghost = scene.add
    .image(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
    .setDisplaySize(sprite.displayWidth, sprite.displayHeight)
    .setFlipX(sprite.flipX)
    .setTint(style.ghostTint)
    .setTintMode(Phaser.TintModes.FILL)
    .setAlpha(style.ghostAlpha)
    .setDepth(GHOST_DEPTH);
  const release = track(bucket, ghost);
  scene.tweens.add({
    targets: ghost,
    alpha: 0,
    duration: GHOST_FADE_MS,
    onComplete: release,
  });
}

function paintTrail(
  graphics: Phaser.GameObjects.Graphics,
  from: Point,
  to: Point,
  heading: Point,
  style: DashStyle,
) {
  graphics.clear();
  const px = -heading.y;
  const py = heading.x;
  const tail = Math.max(TRAIL_LENGTH - dashDistance(style), 0);
  const tailX = from.x - heading.x * tail;
  const tailY = from.y - heading.y * tail;
  TRAIL_LINES.forEach((offset, index) => {
    const shorten = index === 1 ? 0 : 14;
    graphics.lineStyle(index === 1 ? 3 : 2, 0xffffff, index === 1 ? 0.55 : 0.4);
    graphics.lineBetween(
      tailX + heading.x * shorten + px * offset,
      tailY + heading.y * shorten + py * offset,
      to.x - heading.x * 18 + px * offset * 0.6,
      to.y - heading.y * 18 + py * offset * 0.6,
    );
  });
}

function spawnDustPuff(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  at: Point,
  heading: Point,
) {
  for (let index = 0; index < DUST_PUFFS; index += 1) {
    const spread = (index / (DUST_PUFFS - 1) - 0.5) * 2;
    const back = 6 + Math.abs(spread) * 6;
    const x = at.x - heading.x * back - heading.y * spread * DUST_SPREAD;
    const y = at.y - heading.y * back + heading.x * spread * DUST_SPREAD;
    const puff = scene.add
      .circle(x, y, DUST_RADIUS * (1 - Math.abs(spread) * 0.3), DUST_COLOR, 0.55)
      .setDepth(DUST_DEPTH);
    const release = track(bucket, puff);
    scene.tweens.add({
      targets: puff,
      x: x - heading.x * 18,
      y: y - heading.y * 18 - 6,
      scale: DUST_GROW,
      alpha: 0,
      duration: DUST_FADE_MS + index * 20,
      ease: "Quad.easeOut",
      onComplete: release,
    });
  }
}

function dashWithTrail(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  player: Player,
  aim: Point,
  style: DashStyle = LUNGE,
) {
  const length = Math.hypot(aim.x, aim.y);
  if (length === 0) return;
  const heading = { x: aim.x / length, y: aim.y / length };
  const sprite = player.sprite;
  const from = { x: sprite.x, y: sprite.y };
  startDash(player, heading.x, heading.y, style.speed, style.durationMs, style.kind);
  if (style.kind === "evade") {
    spawnDustPuff(scene, bucket, { x: from.x, y: from.y + DUST_FEET_OFFSET_Y }, heading);
  }
  const trail = scene.add.graphics().setDepth(TRAIL_DEPTH);
  const releaseTrail = track(bucket, trail);
  spawnGhost(scene, bucket, sprite, style);
  const ghosts = scene.time.addEvent({
    delay: GHOST_EVERY_MS,
    repeat: Math.ceil(style.durationMs / GHOST_EVERY_MS),
    callback: () => {
      if (!sprite.scene || !trail.scene) return;
      spawnGhost(scene, bucket, sprite, style);
      paintTrail(trail, from, sprite, heading, style);
    },
  });
  scene.time.delayedCall(style.durationMs + GHOST_EVERY_MS, () => {
    ghosts.remove(false);
    if (!trail.scene) return;
    if (sprite.scene && !isDashing(player)) {
      paintTrail(trail, from, sprite, heading, style);
    }
    scene.tweens.add({
      targets: trail,
      alpha: 0,
      duration: TRAIL_FADE_MS,
      onComplete: releaseTrail,
    });
  });
}

function spawnShockwave(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  at: Point,
  color: number,
  radius: number,
) {
  const flash = scene.add
    .image(at.x, at.y, FX_TEXTURES.glow)
    .setTint(color)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(SHOCK_DEPTH)
    .setScale((radius * 0.6) / GLOW_TEXTURE_RADIUS);
  const releaseFlash = track(bucket, flash);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scale: (radius * 1.4) / GLOW_TEXTURE_RADIUS,
    duration: SHOCK_MS,
    ease: "Quad.easeOut",
    onComplete: releaseFlash,
  });
  for (let index = 0; index < SHOCK_RINGS; index += 1) {
    const ring = scene.add
      .ellipse(at.x, at.y, radius * 0.5, radius * 0.25, color, 0)
      .setStrokeStyle(4 - index, index === 0 ? 0xffffff : color, 1)
      .setSmoothness(40)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(SHOCK_DEPTH);
    const release = track(bucket, ring);
    scene.tweens.add({
      targets: ring,
      scale: 4 + index,
      alpha: 0,
      delay: index * SHOCK_STAGGER_MS,
      duration: SHOCK_MS,
      ease: "Cubic.easeOut",
      onComplete: release,
    });
  }
}

export { DASH_DISTANCE, dashWithTrail, EVADE, LUNGE, spawnGhost, spawnShockwave, spawnSlashArc };
export type { DashStyle, SlashLook };
