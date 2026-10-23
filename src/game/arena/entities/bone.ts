import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { pixelBurst, pixelRing, pixelTrail, snapAngle } from "@/game/arena/entities/pixel-fx";
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
  texture: string;
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
  // Ângulo contínuo do giro; o sprite mostra a versão em degraus.
  spin: number;
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
  texture: FX_TEXTURES.bone,
  dust: 0xc9a25a,
  glow: 0xffe2a8,
  impact: 0xd9a55a,
};

const GROUND_BONE_CHARGED: BoneStyle = {
  texture: FX_TEXTURES.boneCharged,
  dust: 0xe0b86a,
  glow: 0xfff0c8,
  impact: 0xf0c070,
};

const BONE_DEPTH = 5;
// Voltas por segundo do osso girando.
const SPIN_TURNS = 3.2;
const SPIN_STEPS = 8;
// Pixel da arte em px do mundo no tiro base (osso 22x10 → 44x20).
const BASE_PIXEL = 2;
const BURST_STEPS = 3;
const BURST_STEP_MS = 60;
const IMPACT_DUST = 10;

function launchBone(scene: Phaser.Scene, bucket: BoneShot[], launch: BoneLaunch) {
  const flight = throwBone(launch.from, launch.direction);
  if (!flight) return null;
  const scale = launch.scale ?? 1;
  const pixel = Math.max(BASE_PIXEL, Math.round(BASE_PIXEL * scale));
  const spin = Math.atan2(flight.uy, flight.ux);
  const sprite = scene.add
    .image(Math.round(launch.from.x), Math.round(launch.from.y), launch.style.texture)
    .setScale(pixel)
    .setRotation(snapAngle(spin, SPIN_STEPS))
    .setDepth(BONE_DEPTH);
  const radius = BONE_RADIUS * scale;
  const tints = [launch.style.dust, launch.style.glow];
  const shot: BoneShot = {
    flight,
    radius,
    speed: BONE_SPEED * (launch.speedScale ?? 1),
    style: launch.style,
    owner: launch.owner,
    target: launch.target,
    onHit: launch.onHit,
    sprite,
    spin,
    emitter: pixelTrail(scene, sprite, tints, pixel, radius * 0.5, BONE_DEPTH - 0.1),
  };
  bucket.push(shot);
  return shot;
}

function destroyShot(shot: BoneShot) {
  for (const object of [shot.sprite, shot.emitter]) {
    if (object.scene) object.destroy();
  }
}

// Estilhaços em degraus e poeira caindo, sem brilho suave.
function burstBone(scene: Phaser.Scene, shot: BoneShot, at: Point) {
  const pixel = shot.sprite.scale;
  pixelRing(
    scene,
    at,
    FX_TEXTURES.shards,
    shot.style.impact,
    pixel,
    BURST_STEPS,
    BURST_STEP_MS,
    BONE_DEPTH + 0.1,
  );
  const tints = [shot.style.dust, shot.style.impact, shot.style.glow];
  pixelBurst(scene, at, tints, IMPACT_DUST, pixel, 260, BONE_DEPTH + 0.2);
}

function stepBones(scene: Phaser.Scene, bucket: BoneShot[], deltaMs: number, blocks: Rect[]) {
  if (deltaMs <= 0) return;
  for (const shot of [...bucket]) {
    const owner = shot.owner();
    const result = owner
      ? boneStep(shot.flight, (shot.speed * deltaMs) / 1000, owner, shot.target(), blocks, shot.radius)
      : { flight: shot.flight, hit: null, done: true };
    shot.flight = result.flight;
    shot.spin += Math.PI * 2 * SPIN_TURNS * (deltaMs / 1000);
    shot.sprite
      .setPosition(Math.round(result.flight.x), Math.round(result.flight.y))
      .setRotation(snapAngle(shot.spin, SPIN_STEPS));
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
