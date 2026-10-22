import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import {
  BEAM_TARGET_RADIUS,
  beamImpact,
  STAR_RADIUS,
  STAR_RANGE,
  STAR_SPEED,
  STAR_TURN_RATE,
  steerToward,
  type BeamEnd,
  type Point,
  type Rect,
} from "@/lib/arena/combat";
import Phaser from "phaser";

type StarStyle = {
  core: number;
  glow: number;
  impact: number;
};

type StarShot = {
  x: number;
  y: number;
  ux: number;
  uy: number;
  travelled: number;
  radius: number;
  style: StarStyle;
  target: () => Point | null;
  onArrive: (impact: BeamEnd) => void;
  objects: Phaser.GameObjects.GameObject[];
  star: Phaser.GameObjects.Image;
  halo: Phaser.GameObjects.Image;
};

type StarLaunch = {
  from: Point;
  direction: Point;
  style: StarStyle;
  target: () => Point | null;
  onArrive: (impact: BeamEnd) => void;
  scale?: number;
};

const SWIFT_STAR: StarStyle = {
  core: 0xfff3a8,
  glow: 0xffc23a,
  impact: 0xffe066,
};

const SWIFT_STAR_CHARGED: StarStyle = {
  core: 0xfff0fb,
  glow: 0xff7ad9,
  impact: 0xffa8ec,
};

const STAR_DEPTH = 5;
const GLOW_TEXTURE_RADIUS = 32;
const SWIFT_TEXTURE_RADIUS = 16;
const HALO_SCALE = 2.4;
const SPIN_MS = 360;
const MUZZLE_MS = 160;
const BURST_MS = 240;

function addGlow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  radius: number,
) {
  return scene.add
    .image(x, y, FX_TEXTURES.glow)
    .setTint(color)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(STAR_DEPTH - 0.1)
    .setScale(radius / GLOW_TEXTURE_RADIUS);
}

function starTrail(
  scene: Phaser.Scene,
  follow: Phaser.GameObjects.Image,
  shot: Pick<StarShot, "radius" | "style">,
) {
  const emitter = scene.add.particles(0, 0, FX_TEXTURES.pixel, {
    follow,
    lifespan: { min: 180, max: 340 },
    frequency: 16,
    quantity: 1,
    speed: { min: 4, max: 24 },
    scale: { start: 0.9 + shot.radius / STAR_RADIUS / 2, end: 0.2 },
    alpha: { start: 1, end: 0 },
    tint: [shot.style.core, shot.style.glow],
  });
  emitter.setDepth(STAR_DEPTH - 0.2);
  return emitter;
}

function launchStar(scene: Phaser.Scene, bucket: StarShot[], launch: StarLaunch) {
  const length = Math.hypot(launch.direction.x, launch.direction.y);
  if (length === 0) return null;
  const radius = STAR_RADIUS * (launch.scale ?? 1);
  const { x, y } = launch.from;
  const halo = addGlow(scene, x, y, launch.style.glow, radius * HALO_SCALE);
  const star = scene.add
    .image(x, y, FX_TEXTURES.swift)
    .setTint(launch.style.core)
    .setDepth(STAR_DEPTH)
    .setScale((radius / SWIFT_TEXTURE_RADIUS) * 1.4);
  const emitter = starTrail(scene, star, { radius, style: launch.style });
  const muzzle = addGlow(scene, x, y, launch.style.glow, radius * 2.6);
  scene.tweens.add({
    targets: muzzle,
    alpha: 0,
    scale: muzzle.scale * 1.6,
    duration: MUZZLE_MS,
    onComplete: () => {
      if (muzzle.scene) muzzle.destroy();
    },
  });
  scene.tweens.add({ targets: star, angle: 360, duration: SPIN_MS, repeat: -1 });
  const shot: StarShot = {
    x,
    y,
    ux: launch.direction.x / length,
    uy: launch.direction.y / length,
    travelled: 0,
    radius,
    style: launch.style,
    target: launch.target,
    onArrive: launch.onArrive,
    objects: [halo, star, emitter],
    star,
    halo,
  };
  bucket.push(shot);
  return shot;
}

function destroyShot(scene: Phaser.Scene, shot: StarShot) {
  for (const object of shot.objects) {
    scene.tweens.killTweensOf(object);
    if (object.scene) object.destroy();
  }
  shot.objects.length = 0;
}

function burstStar(scene: Phaser.Scene, shot: StarShot, at: Point) {
  const flash = addGlow(scene, at.x, at.y, shot.style.impact, shot.radius * 3);
  const spark = scene.add
    .image(at.x, at.y, FX_TEXTURES.swift)
    .setTint(shot.style.core)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(STAR_DEPTH + 0.1)
    .setScale(shot.star.scale);
  scene.tweens.add({
    targets: [flash, spark],
    alpha: 0,
    scale: "*=2.2",
    angle: 90,
    duration: BURST_MS,
    ease: "Quad.easeOut",
    onComplete: () => {
      if (flash.scene) flash.destroy();
      if (spark.scene) spark.destroy();
    },
  });
}

function stepStars(scene: Phaser.Scene, bucket: StarShot[], deltaMs: number, blocks: Rect[]) {
  if (deltaMs <= 0) return;
  for (const shot of [...bucket]) {
    const target = shot.target();
    const heading = steerToward(
      { x: shot.ux, y: shot.uy },
      target ? { x: target.x - shot.x, y: target.y - shot.y } : null,
      (STAR_TURN_RATE * deltaMs) / 1000,
    );
    shot.ux = heading.x;
    shot.uy = heading.y;
    const step = Math.min((STAR_SPEED * deltaMs) / 1000, STAR_RANGE - shot.travelled);
    const impact = beamImpact(
      shot,
      heading,
      step,
      blocks,
      target,
      BEAM_TARGET_RADIUS + shot.radius,
    );
    shot.travelled += impact.distance;
    shot.x = impact.x;
    shot.y = impact.y;
    shot.star.setPosition(impact.x, impact.y);
    shot.halo.setPosition(impact.x, impact.y);
    if (impact.stop === "range" && shot.travelled < STAR_RANGE) continue;
    bucket.splice(bucket.indexOf(shot), 1);
    burstStar(scene, shot, impact);
    destroyShot(scene, shot);
    shot.onArrive(impact);
  }
}

function clearStars(scene: Phaser.Scene, bucket: StarShot[]) {
  for (const shot of bucket) destroyShot(scene, shot);
  bucket.length = 0;
}

export { clearStars, launchStar, stepStars, SWIFT_STAR, SWIFT_STAR_CHARGED };
export type { StarShot, StarStyle };
