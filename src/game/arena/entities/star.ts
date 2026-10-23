import { FX_TEXTURES, SWIFT_ART_SIZE } from "@/game/arena/entities/fx-textures";
import {
  pixelBurst,
  pixelRing,
  pixelScale,
  pixelTrail,
  snapAngle,
} from "@/game/arena/entities/pixel-fx";
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
  texture: string;
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
  // Ângulo contínuo do giro; o sprite mostra a versão em degraus.
  spin: number;
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
  texture: FX_TEXTURES.swift,
  core: 0xfff3a8,
  glow: 0xffc23a,
  impact: 0xffe066,
};

const SWIFT_STAR_CHARGED: StarStyle = {
  texture: FX_TEXTURES.swiftCharged,
  core: 0xfff0fb,
  glow: 0xff7ad9,
  impact: 0xffa8ec,
};

const STAR_DEPTH = 5;
// A arte cobre um pouco além do raio de acerto (pontas da estrela).
const ART_REACH = 1.4;
// Voltas por segundo; 20 degraus por volta (4 por ponta).
const SPIN_TURNS = 2.8;
const SPIN_STEPS = 20;
const BURST_STEPS = 3;
const BURST_STEP_MS = 60;
const MUZZLE_SPARKS = 4;
const IMPACT_SPARKS = 10;

function launchStar(scene: Phaser.Scene, bucket: StarShot[], launch: StarLaunch) {
  const length = Math.hypot(launch.direction.x, launch.direction.y);
  if (length === 0) return null;
  const radius = STAR_RADIUS * (launch.scale ?? 1);
  const { x, y } = launch.from;
  const scale = pixelScale(radius * ART_REACH, SWIFT_ART_SIZE);
  const star = scene.add
    .image(Math.round(x), Math.round(y), launch.style.texture)
    .setDepth(STAR_DEPTH)
    .setScale(scale);
  const tints = [launch.style.core, launch.style.glow];
  const emitter = pixelTrail(scene, star, tints, scale, radius * 0.4, STAR_DEPTH - 0.2);
  pixelBurst(scene, launch.from, tints, MUZZLE_SPARKS, scale, 0, STAR_DEPTH + 0.2);
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
    objects: [star, emitter],
    star,
    spin: 0,
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
  const scale = shot.star.scale;
  pixelRing(
    scene,
    at,
    FX_TEXTURES.shards,
    shot.style.impact,
    scale,
    BURST_STEPS,
    BURST_STEP_MS,
    STAR_DEPTH + 0.1,
  );
  const tints = [shot.style.core, shot.style.glow, 0xffffff];
  pixelBurst(scene, at, tints, IMPACT_SPARKS, scale, 0, STAR_DEPTH + 0.2);
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
    shot.spin += Math.PI * 2 * SPIN_TURNS * (deltaMs / 1000);
    shot.star
      .setPosition(Math.round(impact.x), Math.round(impact.y))
      .setRotation(snapAngle(shot.spin, SPIN_STEPS));
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
