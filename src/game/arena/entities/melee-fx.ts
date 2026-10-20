import { isDashing, startDash, type Player } from "@/game/arena/entities/player";
import type { Point } from "@/lib/arena/combat";
import Phaser from "phaser";

const SLASH_DEPTH = 6;
const SLASH_SWEEP = Math.PI * 0.62;
const SLASH_THICKNESS = 14;
const SLASH_STEPS = 18;
const SLASH_DRAW_MS = 90;
const SLASH_FADE_MS = 150;
const SLASH_COLOR = 0xffffff;
const DASH_SPEED = 520;
const DASH_MS = 90;
const GHOST_EVERY_MS = 22;
const GHOST_FADE_MS = 200;
const GHOST_DEPTH = 1.9;
const TRAIL_DEPTH = 1.8;
const TRAIL_FADE_MS = 220;
const TRAIL_LINES = [-14, 0, 14];
const TRAIL_LENGTH = 70;

const DASH_DISTANCE = (DASH_SPEED * DASH_MS) / 1000;

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
    const thickness = SLASH_THICKNESS * Math.max(0.08, Math.sin(Math.PI * u));
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    outer.push(new Phaser.Math.Vector2(cos * radius, sin * radius));
    inner.push(new Phaser.Math.Vector2(cos * (radius - thickness), sin * (radius - thickness)));
  }
  const ring = [...outer, ...inner.reverse()];
  graphics.lineStyle(6, SLASH_COLOR, 0.28);
  graphics.strokePoints(ring, true);
  graphics.fillStyle(SLASH_COLOR, 0.92);
  graphics.fillPoints(ring, true);
}

function spawnSlashArc(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  origin: Point,
  aim: Point,
  radius: number,
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
      if (graphics.scene) paintSlash(graphics, radius, sweep.progress);
    },
    onComplete: () => {
      if (!graphics.scene) return;
      paintSlash(graphics, radius, 1);
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
) {
  const ghost = scene.add
    .image(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
    .setDisplaySize(sprite.displayWidth, sprite.displayHeight)
    .setFlipX(sprite.flipX)
    .setTint(0xffffff)
    .setTintMode(Phaser.TintModes.FILL)
    .setAlpha(0.45)
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
) {
  graphics.clear();
  const px = -heading.y;
  const py = heading.x;
  const tailX = from.x - heading.x * (TRAIL_LENGTH - DASH_DISTANCE);
  const tailY = from.y - heading.y * (TRAIL_LENGTH - DASH_DISTANCE);
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

function dashWithTrail(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  player: Player,
  aim: Point,
) {
  const length = Math.hypot(aim.x, aim.y);
  if (length === 0) return;
  const heading = { x: aim.x / length, y: aim.y / length };
  const sprite = player.sprite;
  const from = { x: sprite.x, y: sprite.y };
  startDash(player, heading.x, heading.y, DASH_SPEED, DASH_MS);
  const trail = scene.add.graphics().setDepth(TRAIL_DEPTH);
  const releaseTrail = track(bucket, trail);
  spawnGhost(scene, bucket, sprite);
  const ghosts = scene.time.addEvent({
    delay: GHOST_EVERY_MS,
    repeat: Math.ceil(DASH_MS / GHOST_EVERY_MS),
    callback: () => {
      if (!sprite.scene || !trail.scene) return;
      spawnGhost(scene, bucket, sprite);
      paintTrail(trail, from, sprite, heading);
    },
  });
  scene.time.delayedCall(DASH_MS + GHOST_EVERY_MS, () => {
    ghosts.remove(false);
    if (!trail.scene) return;
    if (sprite.scene && !isDashing(player)) paintTrail(trail, from, sprite, heading);
    scene.tweens.add({
      targets: trail,
      alpha: 0,
      duration: TRAIL_FADE_MS,
      onComplete: releaseTrail,
    });
  });
}

export { DASH_DISTANCE, dashWithTrail, spawnSlashArc };
