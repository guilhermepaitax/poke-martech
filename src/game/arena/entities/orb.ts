import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
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
  body: Phaser.GameObjects.Arc[];
  halo: Phaser.GameObjects.Image;
  emitter: Phaser.GameObjects.Particles.ParticleEmitter;
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
  core: 0xa8ff8a,
  mid: 0x22e03a,
  glow: 0x00b83a,
  impact: 0x2aff4a,
};

const GRASS_ORB_CHARGED: OrbStyle = {
  core: 0xd8ffb0,
  mid: 0x3cff2a,
  glow: 0x00e05a,
  impact: 0x6aff3a,
};

const ORB_DEPTH = 5;
const GLOW_TEXTURE_RADIUS = 32;
const HALO_SCALE = 2.6;
const PULSE_MS = 140;
const MUZZLE_MS = 160;
const BURST_MS = 260;

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
    .setDepth(ORB_DEPTH + 0.1)
    .setScale(radius / GLOW_TEXTURE_RADIUS);
}

function orbTrail(
  scene: Phaser.Scene,
  follow: Phaser.GameObjects.Arc,
  shot: Pick<OrbShot, "radius" | "style">,
) {
  const size = shot.radius / ORB_RADIUS;
  const emitter = scene.add.particles(0, 0, FX_TEXTURES.pixel, {
    follow,
    emitZone: {
      type: "random",
      source: new Phaser.Geom.Circle(0, 0, shot.radius * 0.9),
      quantity: 1,
    },
    lifespan: { min: 220, max: 420 },
    frequency: 10,
    quantity: Math.ceil(2 * size),
    speed: { min: 8, max: 36 },
    scale: { start: 1.1 + size * 0.4, end: 0.4 },
    alpha: { start: 1, end: 0 },
    tint: [shot.style.core, shot.style.mid, shot.style.glow],
  });
  emitter.setDepth(ORB_DEPTH - 0.1);
  return emitter;
}

function launchOrb(scene: Phaser.Scene, bucket: OrbShot[], launch: OrbLaunch) {
  const length = Math.hypot(launch.direction.x, launch.direction.y);
  if (length === 0) return null;
  const scale = launch.scale ?? 1;
  const radius = ORB_RADIUS * scale;
  const { x, y } = launch.from;
  const halo = addGlow(scene, x, y, launch.style.glow, radius * HALO_SCALE);
  const shell = scene.add.circle(x, y, radius, launch.style.mid, 1).setDepth(ORB_DEPTH);
  const core = scene.add
    .circle(x, y, radius * 0.5, launch.style.core, 1)
    .setDepth(ORB_DEPTH + 0.05);
  const emitter = orbTrail(scene, core, { radius, style: launch.style });
  const muzzle = addGlow(scene, x, y, launch.style.mid, radius * 3);
  scene.tweens.add({
    targets: muzzle,
    alpha: 0,
    scale: muzzle.scale * 1.6,
    duration: MUZZLE_MS,
    onComplete: () => {
      if (muzzle.scene) muzzle.destroy();
    },
  });
  scene.tweens.add({
    targets: halo,
    scale: halo.scale * 1.25,
    duration: PULSE_MS,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
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
    objects: [halo, shell, core, emitter],
    body: [shell, core],
    halo,
    emitter,
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

function burstOrb(scene: Phaser.Scene, shot: OrbShot, at: Point) {
  const flash = addGlow(scene, at.x, at.y, shot.style.impact, shot.radius * 3);
  const ring = scene.add
    .circle(at.x, at.y, shot.radius, shot.style.mid, 0)
    .setStrokeStyle(3, shot.style.mid, 0.9)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(ORB_DEPTH + 0.1);
  scene.tweens.add({
    targets: [flash, ring],
    alpha: 0,
    scale: "*=2.4",
    duration: BURST_MS,
    ease: "Quad.easeOut",
    onComplete: () => {
      if (flash.scene) flash.destroy();
      if (ring.scene) ring.destroy();
    },
  });
}

function moveShot(shot: OrbShot, x: number, y: number) {
  shot.x = x;
  shot.y = y;
  shot.halo.setPosition(x, y);
  for (const part of shot.body) part.setPosition(x, y);
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
