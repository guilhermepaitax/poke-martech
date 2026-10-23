import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { pixelBurst, pixelRing, pixelScale, pixelTrail } from "@/game/arena/entities/pixel-fx";
import {
  BEAM_TARGET_RADIUS,
  beamImpact,
  ORB_RADIUS,
  ORB_RANGE,
  ORB_SPEED,
  type BeamEnd,
  type Point,
  type Rect,
} from "@/lib/arena/combat";
import Phaser from "phaser";

type OrbStyle = {
  // Quadros da pixel art, alternados enquanto a bola avança (pulso).
  frames: readonly [string, string];
  core: number;
  mid: number;
  glow: number;
  impact: number;
};

type OrbShot = {
  x: number;
  y: number;
  ux: number;
  uy: number;
  travelled: number;
  radius: number;
  style: OrbStyle;
  target: () => Point | null;
  onArrive: (impact: BeamEnd) => void;
  objects: Phaser.GameObjects.GameObject[];
  orb: Phaser.GameObjects.Image;
};

type OrbLaunch = {
  from: Point;
  direction: Point;
  style: OrbStyle;
  target: () => Point | null;
  onArrive: (impact: BeamEnd) => void;
  scale?: number;
};

const GRASS_ORB: OrbStyle = {
  frames: [FX_TEXTURES.orb, FX_TEXTURES.orbAlt],
  core: 0xa8ff8a,
  mid: 0x22e03a,
  glow: 0x00b83a,
  impact: 0x2aff4a,
};

const GRASS_ORB_CHARGED: OrbStyle = {
  frames: [FX_TEXTURES.orbCharged, FX_TEXTURES.orbChargedAlt],
  core: 0xd8ffb0,
  mid: 0x3cff2a,
  glow: 0x00e05a,
  impact: 0x6aff3a,
};

const ORB_DEPTH = 5;
// Px percorridos por quadro da animação.
const FRAME_DISTANCE = 28;
const BURST_STEPS = 3;
const BURST_STEP_MS = 70;
const MUZZLE_SPARKS = 5;
const IMPACT_SPARKS = 12;

function sparks(scene: Phaser.Scene, at: Point, style: OrbStyle, count: number, scale: number) {
  pixelBurst(scene, at, [style.core, style.mid, style.glow], count, scale, 0, ORB_DEPTH + 0.2);
}

function launchOrb(scene: Phaser.Scene, bucket: OrbShot[], launch: OrbLaunch) {
  const length = Math.hypot(launch.direction.x, launch.direction.y);
  if (length === 0) return null;
  const radius = ORB_RADIUS * (launch.scale ?? 1);
  const { x, y } = launch.from;
  const scale = pixelScale(radius);
  const orb = scene.add
    .image(Math.round(x), Math.round(y), launch.style.frames[0])
    .setDepth(ORB_DEPTH)
    .setScale(scale);
  const { core, mid, glow } = launch.style;
  const emitter = pixelTrail(scene, orb, [core, mid, glow], scale, radius * 0.6, ORB_DEPTH - 0.1);
  sparks(scene, launch.from, launch.style, MUZZLE_SPARKS, scale);
  const shot: OrbShot = {
    x,
    y,
    ux: launch.direction.x / length,
    uy: launch.direction.y / length,
    travelled: 0,
    radius,
    style: launch.style,
    target: launch.target,
    onArrive: launch.onArrive,
    objects: [orb, emitter],
    orb,
  };
  bucket.push(shot);
  return shot;
}

function destroyShot(scene: Phaser.Scene, shot: OrbShot) {
  for (const object of shot.objects) {
    scene.tweens.killTweensOf(object);
    if (object.scene) object.destroy();
  }
  shot.objects.length = 0;
}

// Estouro em degraus inteiros, como o resto da pixel art.
function burstOrb(scene: Phaser.Scene, shot: OrbShot, at: Point) {
  const scale = shot.orb.scale;
  pixelRing(
    scene,
    at,
    FX_TEXTURES.shards,
    shot.style.impact,
    scale,
    BURST_STEPS,
    BURST_STEP_MS,
    ORB_DEPTH + 0.1,
  );
  sparks(scene, at, shot.style, IMPACT_SPARKS, scale);
}

function moveShot(shot: OrbShot, x: number, y: number) {
  shot.x = x;
  shot.y = y;
  const frame = Math.floor(shot.travelled / FRAME_DISTANCE) % 2;
  shot.orb
    .setPosition(Math.round(x), Math.round(y))
    .setTexture(shot.style.frames[frame] ?? shot.style.frames[0]);
}

function stepOrbs(scene: Phaser.Scene, bucket: OrbShot[], deltaMs: number, blocks: Rect[]) {
  if (deltaMs <= 0) return;
  for (const shot of [...bucket]) {
    const remaining = ORB_RANGE - shot.travelled;
    const step = Math.min((ORB_SPEED * deltaMs) / 1000, remaining);
    const impact = beamImpact(
      shot,
      { x: shot.ux, y: shot.uy },
      step,
      blocks,
      shot.target(),
      BEAM_TARGET_RADIUS + shot.radius,
    );
    shot.travelled += impact.distance;
    moveShot(shot, impact.x, impact.y);
    if (impact.stop === "range" && shot.travelled < ORB_RANGE) continue;
    bucket.splice(bucket.indexOf(shot), 1);
    burstOrb(scene, shot, impact);
    destroyShot(scene, shot);
    shot.onArrive(impact);
  }
}

function clearOrbs(scene: Phaser.Scene, bucket: OrbShot[]) {
  for (const shot of bucket) destroyShot(scene, shot);
  bucket.length = 0;
}

export { clearOrbs, GRASS_ORB, GRASS_ORB_CHARGED, launchOrb, stepOrbs };
export type { OrbShot, OrbStyle };
