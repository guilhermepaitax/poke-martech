import { playArenaAudio } from "@/game/arena/entities/audio";
import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { pixelBurst } from "@/game/arena/entities/pixel-fx";
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
  widthScale?: number;
  chargeMs?: number;
};

type BeamBody = {
  from: Point;
  ux: number;
  uy: number;
  distance: number;
  width: number;
  scale: number;
  phase: number;
};

const FIRE_BEAM: BeamStyle = {
  charge: 0xff6a1a,
  core: 0xfff6d0,
  mid: 0xffe08a,
  glow: 0xff7a18,
  impact: 0xff8a2a,
};

const FIRE_BEAM_CHARGED: BeamStyle = {
  charge: 0xff4ad8,
  core: 0xffffff,
  mid: 0xffc0f0,
  glow: 0xc45cff,
  impact: 0xff6ae0,
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
const WAVE_FREQUENCY = 0.09;
const WAVE_SPEED = 0.025;
const WAVE_SWELL = 0.18;
const WAVE_DRIFT = 2;
const TAPER_IN = 0.15;
const TAPER_OUT = 0.12;
const CHARGE_SPARKS = 7;
const MUZZLE_SPARKS = 8;
// Lado do bloco da grade em px do mundo: o feixe é desenhado em "pixels".
const BEAM_PIXEL = 4;
// Passo de amostragem menor que o bloco para não deixar furos na diagonal.
const SAMPLE_STEP = BEAM_PIXEL * 0.7;

function snap(value: number) {
  return Math.floor(value / BEAM_PIXEL) * BEAM_PIXEL;
}

// Junta blocos da grade sem repetir (repetidos somariam no blend ADD).
function pixelGrid() {
  const seen = new Set<number>();
  const cells: number[] = [];
  return {
    add(x: number, y: number) {
      const gx = snap(x);
      const gy = snap(y);
      const key = (gx / BEAM_PIXEL + 32768) * 65536 + gy / BEAM_PIXEL + 32768;
      if (seen.has(key)) return;
      seen.add(key);
      cells.push(gx, gy);
    },
    fill(graphics: Phaser.GameObjects.Graphics, color: number, alpha: number) {
      graphics.fillStyle(color, alpha);
      for (let index = 0; index < cells.length; index += 2) {
        graphics.fillRect(cells[index] ?? 0, cells[index + 1] ?? 0, BEAM_PIXEL, BEAM_PIXEL);
      }
    },
  };
}

function pixelDisc(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number,
  ring = false,
) {
  // Raio em degraus de um bloco: o círculo cresce "pulando" de pixel em pixel.
  const steps = Math.round(radius / BEAM_PIXEL);
  if (steps <= 0) return;
  const grid = pixelGrid();
  for (let row = -steps; row <= steps; row += 1) {
    for (let column = -steps; column <= steps; column += 1) {
      const distance = Math.hypot(row, column);
      if (distance > steps + 0.3) continue;
      if (ring && distance < steps - 0.7) continue;
      grid.add(x + column * BEAM_PIXEL, y + row * BEAM_PIXEL);
    }
  }
  grid.fill(graphics, color, alpha);
}

function drawCharge(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  style: BeamStyle,
  scale: number,
) {
  graphics.clear();
  pixelDisc(graphics, x, y, 26 * scale, style.glow, 0.28);
  pixelDisc(graphics, x, y, 14 * scale, style.charge, 0.55);
  pixelDisc(graphics, x, y, 5 * scale, style.core, 0.95);
  pixelDisc(graphics, x, y, 40 * (1.4 - scale), style.mid, 0.8 * scale, true);
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
  const grid = pixelGrid();
  const px = -body.uy;
  const py = body.ux;
  const steps = Math.max(2, Math.ceil(body.distance / SAMPLE_STEP));
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const along = t * body.distance;
    const wave = Math.sin(along * WAVE_FREQUENCY - body.phase);
    const drift = Math.sin(along * WAVE_FREQUENCY * 0.5 - body.phase * 0.7) * WAVE_DRIFT * t;
    const half = halfWidth * body.width * body.scale * taper(t) * (1 + wave * WAVE_SWELL);
    const cx = body.from.x + body.ux * along + px * drift;
    const cy = body.from.y + body.uy * along + py * drift;
    const slices = Math.max(1, Math.ceil((half * 2) / SAMPLE_STEP));
    for (let slice = 0; slice <= slices; slice += 1) {
      const across = -half + (half * 2 * slice) / slices;
      grid.add(cx + px * across, cy + py * across);
    }
  }
  grid.fill(graphics, color, alpha);
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
  const size = body.width * body.scale;
  pixelDisc(graphics, body.from.x, body.from.y, 6 * size, style.core, 0.9 * body.width);
  // Clarão na ponta do feixe.
  const tipX = body.from.x + body.ux * body.distance;
  const tipY = body.from.y + body.uy * body.distance;
  pixelDisc(graphics, tipX, tipY, 12 * size, style.mid, 0.5);
  pixelDisc(graphics, tipX, tipY, 6 * size, style.core, 0.8);
}

function chargeSparks(
  scene: Phaser.Scene,
  shot: BeamShot,
  from: Point,
  style: BeamStyle,
  durationMs: number,
  count: number,
) {
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count + Math.random() * 0.6;
    const reach = 34 + Math.random() * 16;
    const spark = scene.add
      .image(
        Math.round(from.x + Math.cos(angle) * reach),
        Math.round(from.y + Math.sin(angle) * reach),
        FX_TEXTURES.pixel,
      )
      .setScale(1.5)
      .setTint(style.mid)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(BEAM_DEPTH + 0.1);
    shot.objects.push(spark);
    scene.tweens.add({
      targets: spark,
      x: from.x,
      y: from.y,
      scale: 0.5,
      duration: durationMs,
      ease: "Quad.easeIn",
      onComplete: () => {
        if (spark.scene) spark.destroy();
      },
    });
  }
}

function beamEmbers(scene: Phaser.Scene, shot: BeamShot, line: Phaser.Geom.Line, style: BeamStyle) {
  const emitter = scene.add.particles(0, 0, FX_TEXTURES.pixel, {
    emitZone: { type: "random", source: line, quantity: 1 },
    lifespan: 250,
    frequency: 12,
    quantity: 2,
    speed: { min: 20, max: 70 },
    scale: 1,
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
  const scale = cast.widthScale ?? 1;
  const body: BeamBody = { from: cast.from, ux, uy, distance: 0, width: 1, scale, phase: 0 };
  shot.motions.push(body);
  const tints = [cast.style.core, cast.style.mid, cast.style.glow];
  pixelBurst(scene, cast.from, tints, Math.round(MUZZLE_SPARKS * scale), 2, 0, BEAM_DEPTH + 0.2);
  const line = new Phaser.Geom.Line(cast.from.x, cast.from.y, cast.from.x, cast.from.y);
  const emitter = beamEmbers(scene, shot, line, cast.style);
  const reach = (distance: number) => {
    const tipX = cast.from.x + ux * distance;
    const tipY = cast.from.y + uy * distance;
    line.setTo(cast.from.x, cast.from.y, tipX, tipY);
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
          finishShot(scene, bucket, shot, body, cast.style, emitter);
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
  const chargeMs = cast.chargeMs ?? CHARGE_MS;
  const widthScale = cast.widthScale ?? 1;
  const charge = { scale: 0.45 };
  shot.motions.push(charge);
  drawCharge(graphics, cast.from.x, cast.from.y, cast.style, charge.scale);
  chargeSparks(
    scene,
    shot,
    cast.from,
    cast.style,
    chargeMs,
    Math.round(CHARGE_SPARKS * widthScale),
  );
  const grow = scene.tweens.add({
    targets: charge,
    scale: 1,
    duration: chargeMs,
    onUpdate: () => {
      if (!graphics.scene) return;
      drawCharge(graphics, cast.from.x, cast.from.y, cast.style, charge.scale);
    },
  });
  shot.motions.push(grow);
  shot.timer = scene.time.delayedCall(chargeMs, () => {
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

export { castBeam, clearBeams, FIRE_BEAM, FIRE_BEAM_CHARGED, WATER_BEAM };
export type { BeamShot, BeamStyle };
