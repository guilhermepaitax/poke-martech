import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import type { Player } from "@/game/arena/entities/player";
import type { ImpactTier, Point } from "@/lib/arena/combat";
import Phaser from "phaser";

const HIT_DEPTH = 7;
const STAR_MS = 220;
const STREAK_MS = 240;
const FLASH_MS = 70;
const KNOCKBACK_MS = 80;
const HITSTOP_MS = 60;
const STREAK_COUNT = 4;
const STREAK_SPREAD = 0.9;

const TIER_SCALE: Record<ImpactTier, number> = {
  light: 0.7,
  medium: 0.95,
  heavy: 1.25,
};

const TIER_KNOCKBACK: Record<ImpactTier, number> = {
  light: 90,
  medium: 140,
  heavy: 200,
};

type HitFxCast = {
  target: Player;
  at: Point;
  direction: Point;
  tier: ImpactTier;
  color: number;
};

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

function burstStar(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  x: number,
  y: number,
  size: number,
  color: number,
  delay: number,
) {
  const star = scene.add
    .image(x, y, FX_TEXTURES.star)
    .setTint(color)
    .setDepth(HIT_DEPTH)
    .setScale(0.3 * size)
    .setRotation(Math.random() * Math.PI)
    .setAlpha(0);
  const release = track(bucket, star);
  scene.tweens.chain({
    targets: star,
    delay,
    tweens: [
      {
        scale: 1.1 * size,
        alpha: 1,
        angle: star.angle + 20,
        duration: STAR_MS * 0.4,
        ease: "Back.easeOut",
      },
      {
        scale: 0,
        alpha: 0,
        angle: star.angle + 45,
        duration: STAR_MS * 0.6,
        ease: "Quad.easeIn",
      },
    ],
    onComplete: release,
  });
}

function speedLines(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  at: Point,
  direction: Point,
  scale: number,
) {
  const heading = Math.atan2(direction.y, direction.x);
  for (let index = 0; index < STREAK_COUNT; index += 1) {
    const angle = heading + (Math.random() - 0.5) * STREAK_SPREAD;
    const start = 18 + Math.random() * 10;
    const travel = 26 + Math.random() * 18;
    const streak = scene.add
      .image(at.x + Math.cos(angle) * start, at.y + Math.sin(angle) * start, FX_TEXTURES.streak)
      .setRotation(angle)
      .setDepth(HIT_DEPTH)
      .setScale(scale, 1);
    const release = track(bucket, streak);
    scene.tweens.add({
      targets: streak,
      x: streak.x + Math.cos(angle) * travel,
      y: streak.y + Math.sin(angle) * travel,
      alpha: 0,
      scaleX: scale * 0.4,
      duration: STREAK_MS,
      ease: "Quad.easeOut",
      onComplete: release,
    });
  }
}

function flashSprite(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
  sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
  scene.time.delayedCall(FLASH_MS, () => {
    if (!sprite.scene) return;
    sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
  });
}

function knockback(
  scene: Phaser.Scene,
  sprite: Phaser.Physics.Arcade.Sprite,
  direction: Point,
  speed: number,
) {
  const length = Math.hypot(direction.x, direction.y);
  if (length === 0) return;
  sprite.setVelocity((direction.x / length) * speed, (direction.y / length) * speed);
  scene.time.delayedCall(KNOCKBACK_MS, () => {
    if (sprite.scene) sprite.setVelocity(0, 0);
  });
}

function hitStop(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
  sprite.anims.pause();
  scene.time.delayedCall(HITSTOP_MS, () => {
    if (sprite.scene) sprite.anims.resume();
  });
}

function spawnHitFx(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  cast: HitFxCast,
) {
  const size = TIER_SCALE[cast.tier];
  const sprite = cast.target.sprite;
  burstStar(scene, bucket, cast.at.x, cast.at.y, size, cast.color, 0);
  if (cast.tier !== "light") {
    burstStar(
      scene,
      bucket,
      cast.at.x - cast.direction.x * 14 + (Math.random() - 0.5) * 16,
      cast.at.y + 18,
      size * 0.75,
      cast.color,
      50,
    );
  }
  speedLines(scene, bucket, cast.at, cast.direction, size);
  flashSprite(scene, sprite);
  knockback(scene, sprite, cast.direction, TIER_KNOCKBACK[cast.tier]);
  if (cast.tier === "heavy") {
    scene.cameras.main.shake(120, 0.004);
    hitStop(scene, sprite);
  }
}

function clearHitFx(scene: Phaser.Scene, bucket: Phaser.GameObjects.GameObject[]) {
  for (const object of bucket) {
    scene.tweens.killTweensOf(object);
    if (object.scene) object.destroy();
  }
  bucket.length = 0;
}

export { clearHitFx, spawnHitFx };
export type { HitFxCast };
