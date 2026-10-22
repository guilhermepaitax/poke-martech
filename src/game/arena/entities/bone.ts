import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import {
  BONE_RADIUS,
  BONE_SPEED,
  boneStep,
  throwBone,
  type BeamEnd,
  type BoneFlight,
  type Point,
  type Rect,
} from "@/lib/arena/combat";
import Phaser from "phaser";

type BoneStyle = {
  dust: number;
  glow: number;
  impact: number;
};

type BoneShot = {
  flight: BoneFlight;
  radius: number;
  speed: number;
  style: BoneStyle;
  owner: () => Point | null;
  target: () => Point | null;
  onHit: (impact: BeamEnd) => void;
  sprite: Phaser.GameObjects.Image;
  halo: Phaser.GameObjects.Image;
  emitter: Phaser.GameObjects.Particles.ParticleEmitter;
};

type BoneLaunch = {
  from: Point;
  direction: Point;
  style: BoneStyle;
  owner: () => Point | null;
  target: () => Point | null;
  onHit: (impact: BeamEnd) => void;
  scale?: number;
  speedScale?: number;
};

const GROUND_BONE: BoneStyle = {
  dust: 0xc9a25a,
  glow: 0xffe2a8,
  impact: 0xd9a55a,
};

const GROUND_BONE_CHARGED: BoneStyle = {
  dust: 0xe0b86a,
  glow: 0xfff0c8,
  impact: 0xf0c070,
};

const BONE_DEPTH = 5;
const GLOW_TEXTURE_RADIUS = 32;
// Voltas por segundo do osso girando.
const SPIN_TURNS = 3.2;
const BURST_MS = 240;

function boneTrail(scene: Phaser.Scene, follow: Phaser.GameObjects.Image, style: BoneStyle, scale: number) {
  const emitter = scene.add.particles(0, 0, FX_TEXTURES.pixel, {
    follow,
    lifespan: { min: 180, max: 360 },
    frequency: 18,
    quantity: Math.ceil(scale),
    speed: { min: 6, max: 28 },
    scale: { start: 0.9 + scale * 0.3, end: 0.3 },
    alpha: { start: 0.8, end: 0 },
    tint: [style.dust, style.glow],
  });
  emitter.setDepth(BONE_DEPTH - 0.1);
  return emitter;
}

function launchBone(scene: Phaser.Scene, bucket: BoneShot[], launch: BoneLaunch) {
  const flight = throwBone(launch.from, launch.direction);
  if (!flight) return null;
  const scale = launch.scale ?? 1;
  const { x, y } = launch.from;
  const sprite = scene.add
    .image(x, y, FX_TEXTURES.bone)
    .setScale(scale)
    .setRotation(Math.atan2(flight.uy, flight.ux))
    .setDepth(BONE_DEPTH);
  const halo = scene.add
    .image(x, y, FX_TEXTURES.glow)
    .setTint(launch.style.glow)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setAlpha(0.55)
    .setScale((BONE_RADIUS * scale * 1.8) / GLOW_TEXTURE_RADIUS)
    .setDepth(BONE_DEPTH - 0.05);
  const shot: BoneShot = {
    flight,
    radius: BONE_RADIUS * scale,
    speed: BONE_SPEED * (launch.speedScale ?? 1),
    style: launch.style,
    owner: launch.owner,
    target: launch.target,
    onHit: launch.onHit,
    sprite,
    halo,
    emitter: boneTrail(scene, sprite, launch.style, scale),
  };
  bucket.push(shot);
  return shot;
}

function destroyShot(shot: BoneShot) {
  for (const object of [shot.sprite, shot.halo, shot.emitter]) {
    if (object.scene) object.destroy();
  }
}

function burstBone(scene: Phaser.Scene, shot: BoneShot, at: Point) {
  const flash = scene.add
    .image(at.x, at.y, FX_TEXTURES.glow)
    .setTint(shot.style.impact)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(BONE_DEPTH + 0.1)
    .setScale((shot.radius * 2.4) / GLOW_TEXTURE_RADIUS);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scale: "*=2.2",
    duration: BURST_MS,
    ease: "Quad.easeOut",
    onComplete: () => {
      if (flash.scene) flash.destroy();
    },
  });
}

function stepBones(scene: Phaser.Scene, bucket: BoneShot[], deltaMs: number, blocks: Rect[]) {
  if (deltaMs <= 0) return;
  for (const shot of [...bucket]) {
    const owner = shot.owner();
    const result = owner
      ? boneStep(shot.flight, (shot.speed * deltaMs) / 1000, owner, shot.target(), blocks, shot.radius)
      : { flight: shot.flight, hit: null, done: true };
    shot.flight = result.flight;
    shot.sprite.setPosition(result.flight.x, result.flight.y);
    shot.sprite.rotation += Math.PI * 2 * SPIN_TURNS * (deltaMs / 1000);
    shot.halo.setPosition(result.flight.x, result.flight.y);
    if (result.hit) {
      burstBone(scene, shot, result.hit);
      shot.onHit(result.hit);
    }
    if (!result.done) continue;
    bucket.splice(bucket.indexOf(shot), 1);
    destroyShot(shot);
  }
}

function clearBones(bucket: BoneShot[]) {
  for (const shot of bucket) destroyShot(shot);
  bucket.length = 0;
}

export { clearBones, GROUND_BONE, GROUND_BONE_CHARGED, launchBone, stepBones };
export type { BoneShot, BoneStyle };
