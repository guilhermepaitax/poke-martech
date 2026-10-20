import { playArenaAudio } from "@/game/arena/entities/audio";
import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import {
  BEAM_RANGE,
  BEAM_TARGET_RADIUS,
  beamImpact,
  type BeamEnd,
  type Point,
  type Rect,
} from "@/lib/arena/combat";
import Phaser from "phaser";

type BeamStyle = {
  charge: number;
  core: number;
  mid: number;
  glow: number;
  impact: number;
};

type BeamShot = {
  graphics: Phaser.GameObjects.Graphics;
  timer: Phaser.Time.TimerEvent | null;
  motions: object[];
  objects: Phaser.GameObjects.GameObject[];
};

type BeamCast = {
  from: Point;
  rayFrom: Point;
  direction: Point;
  style: BeamStyle;
  blocks: Rect[];
  target: Point | null;
  onArrive: (impact: BeamEnd) => void;
};

type BeamBody = {
  from: Point;
  ux: number;
  uy: number;
  distance: number;
  width: number;
  phase: number;
};

const FIRE_BEAM: BeamStyle = {
  charge: 0xff6a1a,
  core: 0xfff6d0,
  mid: 0xffe08a,
  glow: 0xff7a18,
  impact: 0xff8a2a,
};

const WATER_BEAM: BeamStyle = {
  charge: 0x4aa8ff,
  core: 0xf4fbff,
  mid: 0x9fd6ff,
  glow: 0x2f7dff,
  impact: 0x6cc0ff,
};

const CHARGE_MS = 180;
const EXTEND_MS = 140;
const HOLD_MS = 90;
const FADE_MS = 200;
const BEAM_DEPTH = 5;
const GLOW_WIDTH = 22;
const MID_WIDTH = 10;
const CORE_WIDTH = 3;
const WAVE_STEP = 10;
const WAVE_FREQUENCY = 0.09;
const WAVE_SPEED = 0.025;
const WAVE_SWELL = 0.18;
const WAVE_DRIFT = 2;
const TAPER_IN = 0.15;
const TAPER_OUT = 0.12;
const CHARGE_SPARKS = 7;
const GLOW_TEXTURE_RADIUS = 32;

function drawCharge(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  style: BeamStyle,
  scale: number,
) {
  graphics.clear();
  graphics.fillStyle(style.glow, 0.28);
  graphics.fillCircle(x, y, 26 * scale);
  graphics.fillStyle(style.charge, 0.55);
  graphics.fillCircle(x, y, 14 * scale);
  graphics.fillStyle(style.core, 0.95);
  graphics.fillCircle(x, y, 5 * scale);
  graphics.lineStyle(2, style.mid, 0.8 * scale);
  graphics.strokeCircle(x, y, 40 * (1.4 - scale));
}

function taper(t: number) {
  if (t < TAPER_IN) return 0.45 + 0.55 * (t / TAPER_IN);
  if (t > 1 - TAPER_OUT) return 1 - ((t - (1 - TAPER_OUT)) / TAPER_OUT) * 0.65;
  return 1;
}

function fillRibbon(
  graphics: Phaser.GameObjects.Graphics,
  body: BeamBody,
  halfWidth: number,
  color: number,
  alpha: number,
) {
  const steps = Math.max(2, Math.ceil(body.distance / WAVE_STEP));
  const top: Phaser.Math.Vector2[] = [];
  const bottom: Phaser.Math.Vector2[] = [];
  const px = -body.uy;
  const py = body.ux;
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const along = t * body.distance;
    const wave = Math.sin(along * WAVE_FREQUENCY - body.phase);
    const drift = Math.sin(along * WAVE_FREQUENCY * 0.5 - body.phase * 0.7) * WAVE_DRIFT * t;
    const half = halfWidth * body.width * taper(t) * (1 + wave * WAVE_SWELL);
    const cx = body.from.x + body.ux * along + px * drift;
    const cy = body.from.y + body.uy * along + py * drift;
    top.push(new Phaser.Math.Vector2(cx + px * half, cy + py * half));
    bottom.push(new Phaser.Math.Vector2(cx - px * half, cy - py * half));
  }
  graphics.fillStyle(color, alpha);
  graphics.fillPoints([...top, ...bottom.reverse()], true);
}

function drawLaser(
  graphics: Phaser.GameObjects.Graphics,
  body: BeamBody,
  style: BeamStyle,
) {
  graphics.clear();
  if (body.distance <= 0 || body.width <= 0) return;
  fillRibbon(graphics, body, GLOW_WIDTH, style.glow, 0.25);
  fillRibbon(graphics, body, MID_WIDTH, style.mid, 0.7);
  fillRibbon(graphics, body, CORE_WIDTH, style.core, 1);
  graphics.fillStyle(style.core, 0.9 * body.width);
  graphics.fillCircle(body.from.x, body.from.y, 6 * body.width);
}

function addGlow(
  scene: Phaser.Scene,
  shot: BeamShot,
  x: number,
  y: number,
  color: number,
  radius: number,
) {
  const glow = scene.add
    .image(x, y, FX_TEXTURES.glow)
    .setTint(color)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(BEAM_DEPTH + 0.1)
    .setScale(radius / GLOW_TEXTURE_RADIUS);
  shot.objects.push(glow);
  return glow;
}

function chargeSparks(scene: Phaser.Scene, shot: BeamShot, from: Point, style: BeamStyle) {
  for (let index = 0; index < CHARGE_SPARKS; index += 1) {
    const angle = (Math.PI * 2 * index) / CHARGE_SPARKS + Math.random() * 0.6;
    const reach = 34 + Math.random() * 16;
    const spark = scene.add
      .image(from.x + Math.cos(angle) * reach, from.y + Math.sin(angle) * reach, FX_TEXTURES.spark)
      .setTint(style.mid)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(BEAM_DEPTH + 0.1);
    shot.objects.push(spark);
    scene.tweens.add({
      targets: spark,
      x: from.x,
      y: from.y,
      scale: 0.3,
      duration: CHARGE_MS,
      ease: "Quad.easeIn",
      onComplete: () => {
        if (spark.scene) spark.destroy();
      },
    });
  }
}

function beamEmbers(scene: Phaser.Scene, shot: BeamShot, line: Phaser.Geom.Line, style: BeamStyle) {
  const emitter = scene.add.particles(0, 0, FX_TEXTURES.spark, {
    emitZone: { type: "random", source: line, quantity: 1 },
    lifespan: 250,
    frequency: 12,
    quantity: 2,
    speed: { min: 20, max: 70 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 1, end: 0 },
    tint: [style.core, style.mid, style.glow],
    blendMode: Phaser.BlendModes.ADD,
  });
  emitter.setDepth(BEAM_DEPTH + 0.2);
  shot.objects.push(emitter);
  return emitter;
}

function destroyObjects(scene: Phaser.Scene, shot: BeamShot) {
  for (const object of shot.objects) {
    scene.tweens.killTweensOf(object);
    if (object.scene) object.destroy();
  }
  shot.objects.length = 0;
}

function dropShot(bucket: BeamShot[], shot: BeamShot) {
  const index = bucket.indexOf(shot);
  if (index >= 0) bucket.splice(index, 1);
}

function finishShot(
  scene: Phaser.Scene,
  bucket: BeamShot[],
  shot: BeamShot,
  body: BeamBody,
  style: BeamStyle,
  emitter: Phaser.GameObjects.Particles.ParticleEmitter,
  flare: Phaser.GameObjects.Image,
) {
  emitter.stop();
  const fade = scene.tweens.add({
    targets: body,
    width: 0,
    phase: body.phase + FADE_MS * WAVE_SPEED,
    duration: FADE_MS,
    ease: "Quad.easeIn",
    onUpdate: () => {
      if (shot.graphics.scene) drawLaser(shot.graphics, body, style);
    },
    onComplete: () => {
      dropShot(bucket, shot);
      destroyObjects(scene, shot);
      if (shot.graphics.scene) shot.graphics.destroy();
    },
  });
  scene.tweens.add({ targets: flare, alpha: 0, scale: 0, duration: FADE_MS });
  shot.motions.push(fade);
}

function releaseBeam(
  scene: Phaser.Scene,
  bucket: BeamShot[],
  shot: BeamShot,
  cast: BeamCast,
  ux: number,
  uy: number,
  impact: BeamEnd,
  span: number,
) {
  shot.graphics.setAlpha(1);
  playArenaAudio(scene, "laser");
  const body: BeamBody = { from: cast.from, ux, uy, distance: 0, width: 1, phase: 0 };
  shot.motions.push(body);
  const muzzle = addGlow(scene, shot, cast.from.x, cast.from.y, cast.style.glow, 34);
  scene.tweens.add({ targets: muzzle, alpha: 0, scale: muzzle.scale * 1.6, duration: 160 });
  const flare = addGlow(scene, shot, cast.from.x, cast.from.y, cast.style.mid, 26);
  const line = new Phaser.Geom.Line(cast.from.x, cast.from.y, cast.from.x, cast.from.y);
  const emitter = beamEmbers(scene, shot, line, cast.style);
  const reach = (distance: number) => {
    const tipX = cast.from.x + ux * distance;
    const tipY = cast.from.y + uy * distance;
    line.setTo(cast.from.x, cast.from.y, tipX, tipY);
    flare.setPosition(tipX, tipY);
  };
  const duration = Math.max(EXTEND_MS * (span / BEAM_RANGE), 40);
  const extend = scene.tweens.add({
    targets: body,
    distance: span,
    phase: (duration + HOLD_MS) * WAVE_SPEED,
    duration,
    ease: "Cubic.easeOut",
    onUpdate: () => {
      if (!shot.graphics.scene) return;
      reach(body.distance);
      drawLaser(shot.graphics, body, cast.style);
    },
    onComplete: () => {
      if (!shot.graphics.scene) return;
      body.distance = span;
      reach(span);
      drawLaser(shot.graphics, body, cast.style);
      cast.onArrive(impact);
      const hold = scene.tweens.add({
        targets: body,
        phase: body.phase + HOLD_MS * WAVE_SPEED,
        duration: HOLD_MS,
        onUpdate: () => {
          if (shot.graphics.scene) drawLaser(shot.graphics, body, cast.style);
        },
        onComplete: () => {
          if (!shot.graphics.scene) return;
          finishShot(scene, bucket, shot, body, cast.style, emitter, flare);
        },
      });
      shot.motions.push(hold);
    },
  });
  shot.motions.push(extend);
}

function castBeam(scene: Phaser.Scene, bucket: BeamShot[], cast: BeamCast) {
  const graphics = scene.add.graphics();
  graphics.setDepth(BEAM_DEPTH);
  graphics.setBlendMode(Phaser.BlendModes.ADD);
  const shot: BeamShot = { graphics, timer: null, motions: [], objects: [] };
  bucket.push(shot);
  const impact = beamImpact(
    cast.rayFrom,
    cast.direction,
    BEAM_RANGE,
    cast.blocks,
    cast.target,
    BEAM_TARGET_RADIUS,
  );
  const dx = impact.x - cast.from.x;
  const dy = impact.y - cast.from.y;
  const span = Math.hypot(dx, dy);
  const ux = span === 0 ? cast.direction.x : dx / span;
  const uy = span === 0 ? cast.direction.y : dy / span;
  const charge = { scale: 0.45 };
  shot.motions.push(charge);
  drawCharge(graphics, cast.from.x, cast.from.y, cast.style, charge.scale);
  chargeSparks(scene, shot, cast.from, cast.style);
  const grow = scene.tweens.add({
    targets: charge,
    scale: 1,
    duration: CHARGE_MS,
    onUpdate: () => {
      if (!graphics.scene) return;
      drawCharge(graphics, cast.from.x, cast.from.y, cast.style, charge.scale);
    },
  });
  shot.motions.push(grow);
  shot.timer = scene.time.delayedCall(CHARGE_MS, () => {
    shot.timer = null;
    if (!graphics.scene) return;
    scene.tweens.killTweensOf(charge);
    graphics.clear();
    releaseBeam(scene, bucket, shot, cast, ux, uy, impact, span);
  });
  return shot;
}

function clearBeams(scene: Phaser.Scene, bucket: BeamShot[]) {
  for (const shot of bucket) {
    shot.timer?.remove(false);
    for (const motion of shot.motions) scene.tweens.killTweensOf(motion);
    scene.tweens.killTweensOf(shot.graphics);
    destroyObjects(scene, shot);
    if (shot.graphics.scene) shot.graphics.destroy();
  }
  bucket.length = 0;
}

export { castBeam, clearBeams, FIRE_BEAM, WATER_BEAM };
export type { BeamShot, BeamStyle };
