// Raio do Choque do Trovão e faíscas do Soco Trovão. Desenhados em `Graphics`
// na grade de blocos de 4px (como o feixe), sem ADD: o zigue-zague troca de
// forma em degraus a cada piscada em vez de ondular liso.
import { BEAM_PIXEL, pixelGrid } from "@/game/arena/entities/beam";
import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { pixelBurst, pixelRing } from "@/game/arena/entities/pixel-fx";
import {
  BEAM_TARGET_RADIUS,
  beamImpact,
  BOLT_RADIUS,
  BOLT_RANGE,
  BOLT_WINDUP_MS,
  boltPath,
  type BeamEnd,
  type Point,
  type Rect,
} from "@/lib/arena/combat";
import Phaser from "phaser";

type BoltStyle = {
  core: number;
  mid: number;
  edge: number;
  impact: number;
};

type BoltShot = {
  graphics: Phaser.GameObjects.Graphics;
  timers: Phaser.Time.TimerEvent[];
};

type BoltCast = {
  // Mão de quem lança, lida a cada quadro do estalo (acompanha quem anda).
  origin: () => Point | null;
  direction: Point;
  style: BoltStyle;
  // Espessura do raio em blocos (1 normal, 2 carregado).
  thickness: number;
  blocks: () => Rect[];
  target: () => Point | null;
  onArrive: (impact: BeamEnd) => void;
};

const THUNDER_BOLT: BoltStyle = {
  core: 0xffffff,
  mid: 0xffe14a,
  edge: 0x4ab8ff,
  impact: 0xffe14a,
};

const THUNDER_BOLT_CHARGED: BoltStyle = {
  core: 0xffffff,
  mid: 0xd8b8ff,
  edge: 0x7a4aff,
  impact: 0xb48aff,
};

const BOLT_DEPTH = 5;
// Passo de amostragem menor que o bloco para não deixar furos na diagonal.
const SAMPLE_STEP = BEAM_PIXEL * 0.7;
const CRACKLE_MS = 40;
const CRACKLE_ARCS = 3;
const CRACKLE_REACH = 22;
const FLICKERS = 3;
const FLICKER_MS = 55;
// Alpha de cada piscada: o raio some em degraus.
const FLICKER_ALPHA = [1, 0.75, 0.45];
const FORK_CHANCE = 0.45;
const FORK_LENGTH = 44;
const MUZZLE_SPARKS = 6;
const IMPACT_SPARKS = 12;
const RING_STEPS = 3;
const RING_STEP_MS = 60;
const RING_SCALE = 3;
const SHOCK_ARCS = 4;
const SHOCK_REACH_MIN = 26;
const SHOCK_REACH_MAX = 42;
const SHOCK_FLICKERS = 3;
const SHOCK_SPARKS = 10;

// Pinta a linha quebrada na grade, engrossando `radius` blocos em volta.
function fillPath(
  graphics: Phaser.GameObjects.Graphics,
  points: Point[],
  radius: number,
  color: number,
  alpha: number,
) {
  const grid = pixelGrid();
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    if (!from || !to) continue;
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(length / SAMPLE_STEP));
    for (let step = 0; step <= steps; step += 1) {
      const x = from.x + ((to.x - from.x) * step) / steps;
      const y = from.y + ((to.y - from.y) * step) / steps;
      for (let row = -radius; row <= radius; row += 1) {
        for (let column = -radius; column <= radius; column += 1) {
          if (Math.hypot(row, column) > radius + 0.3) continue;
          grid.add(x + column * BEAM_PIXEL, y + row * BEAM_PIXEL);
        }
      }
    }
  }
  grid.fill(graphics, color, alpha);
}

function drawArc(
  graphics: Phaser.GameObjects.Graphics,
  points: Point[],
  style: BoltStyle,
  thickness: number,
  alpha: number,
) {
  fillPath(graphics, points, thickness + 1, style.edge, alpha * 0.55);
  fillPath(graphics, points, thickness, style.mid, alpha);
  fillPath(graphics, points, thickness - 1, style.core, alpha);
}

// Galhos curtos saindo de vértices do raio principal.
function forks(points: Point[], ux: number, uy: number) {
  const branches: Point[][] = [];
  for (let index = 1; index < points.length - 1; index += 1) {
    const start = points[index];
    if (!start || Math.random() > FORK_CHANCE) continue;
    const angle = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const end = {
      x: start.x + (ux * cos - uy * sin) * FORK_LENGTH,
      y: start.y + (ux * sin + uy * cos) * FORK_LENGTH,
    };
    branches.push(boltPath(start, end, Math.random, 8));
  }
  return branches;
}

function drawBolt(
  graphics: Phaser.GameObjects.Graphics,
  from: Point,
  to: Point,
  style: BoltStyle,
  thickness: number,
  alpha: number,
) {
  graphics.clear();
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const ux = length === 0 ? 1 : (to.x - from.x) / length;
  const uy = length === 0 ? 0 : (to.y - from.y) / length;
  const points = boltPath(from, to, Math.random);
  for (const branch of forks(points, ux, uy)) drawArc(graphics, branch, style, 1, alpha * 0.8);
  drawArc(graphics, points, style, thickness, alpha);
}

// Arcos curtos saindo de um ponto em direções aleatórias.
function drawCrackle(
  graphics: Phaser.GameObjects.Graphics,
  at: Point,
  style: BoltStyle,
  arcs: number,
  reachMin: number,
  reachMax: number,
) {
  graphics.clear();
  for (let index = 0; index < arcs; index += 1) {
    const angle = (Math.PI * 2 * (index + Math.random())) / arcs;
    const reach = reachMin + Math.random() * (reachMax - reachMin);
    const end = { x: at.x + Math.cos(angle) * reach, y: at.y + Math.sin(angle) * reach };
    drawArc(graphics, boltPath(at, end, Math.random, 6), style, 1, 1);
  }
}

function dropShot(bucket: BoltShot[], shot: BoltShot) {
  const index = bucket.indexOf(shot);
  if (index >= 0) bucket.splice(index, 1);
  for (const timer of shot.timers) timer.remove(false);
  shot.timers.length = 0;
  if (shot.graphics.scene) shot.graphics.destroy();
}

function strike(scene: Phaser.Scene, bucket: BoltShot[], shot: BoltShot, cast: BoltCast) {
  const from = cast.origin();
  if (!from || !shot.graphics.scene) {
    dropShot(bucket, shot);
    return;
  }
  const impact = beamImpact(
    from,
    cast.direction,
    BOLT_RANGE,
    cast.blocks(),
    cast.target(),
    BEAM_TARGET_RADIUS + BOLT_RADIUS,
  );
  const { style, thickness } = cast;
  const tints = [style.core, style.mid, style.edge];
  pixelBurst(scene, from, tints, MUZZLE_SPARKS * thickness, 2, 0, BOLT_DEPTH + 0.2);
  drawBolt(shot.graphics, from, impact, style, thickness, FLICKER_ALPHA[0] ?? 1);
  if (impact.stop !== "range") {
    pixelRing(
      scene,
      impact,
      FX_TEXTURES.shards,
      style.impact,
      RING_SCALE + thickness - 1,
      RING_STEPS,
      RING_STEP_MS,
      BOLT_DEPTH + 0.1,
    );
    pixelBurst(scene, impact, tints, IMPACT_SPARKS * thickness, 3, 0, BOLT_DEPTH + 0.2);
  }
  cast.onArrive(impact);
  for (let flicker = 1; flicker <= FLICKERS; flicker += 1) {
    shot.timers.push(
      scene.time.delayedCall(flicker * FLICKER_MS, () => {
        if (!shot.graphics.scene) return;
        const alpha = FLICKER_ALPHA[flicker];
        if (alpha === undefined) {
          dropShot(bucket, shot);
          return;
        }
        drawBolt(shot.graphics, from, impact, style, thickness, alpha);
      }),
    );
  }
}

function castBolt(scene: Phaser.Scene, bucket: BoltShot[], cast: BoltCast) {
  const graphics = scene.add.graphics().setDepth(BOLT_DEPTH);
  const shot: BoltShot = { graphics, timers: [] };
  bucket.push(shot);
  // Estalo na mão: arcos curtos redesenhados em degraus até o raio cair.
  const crackles = Math.max(1, Math.round(BOLT_WINDUP_MS / CRACKLE_MS));
  for (let step = 0; step < crackles; step += 1) {
    shot.timers.push(
      scene.time.delayedCall(step * CRACKLE_MS, () => {
        const at = cast.origin();
        if (!at || !graphics.scene) return;
        drawCrackle(graphics, at, cast.style, CRACKLE_ARCS, CRACKLE_REACH * 0.5, CRACKLE_REACH);
      }),
    );
  }
  shot.timers.push(
    scene.time.delayedCall(BOLT_WINDUP_MS, () => strike(scene, bucket, shot, cast)),
  );
  return shot;
}

// Faíscas do Soco Trovão: arcos curtos em volta do alvo que piscam e somem.
function spawnShockSparks(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  at: Point,
  style: BoltStyle,
) {
  const graphics = scene.add.graphics().setDepth(BOLT_DEPTH + 1);
  bucket.push(graphics);
  const release = () => {
    const index = bucket.indexOf(graphics);
    if (index >= 0) bucket.splice(index, 1);
    if (graphics.scene) graphics.destroy();
  };
  drawCrackle(graphics, at, style, SHOCK_ARCS, SHOCK_REACH_MIN, SHOCK_REACH_MAX);
  pixelBurst(scene, at, [style.core, style.mid, style.edge], SHOCK_SPARKS, 3, 0, BOLT_DEPTH + 1.1);
  for (let flicker = 1; flicker <= SHOCK_FLICKERS; flicker += 1) {
    scene.time.delayedCall(flicker * FLICKER_MS, () => {
      if (!graphics.scene) return;
      if (flicker === SHOCK_FLICKERS) {
        release();
        return;
      }
      drawCrackle(graphics, at, style, SHOCK_ARCS, SHOCK_REACH_MIN, SHOCK_REACH_MAX);
      graphics.setAlpha(1 - flicker / SHOCK_FLICKERS);
    });
  }
}

function clearBolts(bucket: BoltShot[]) {
  for (const shot of [...bucket]) dropShot(bucket, shot);
  bucket.length = 0;
}

export { castBolt, clearBolts, drawBolt, spawnShockSparks, THUNDER_BOLT, THUNDER_BOLT_CHARGED };
export type { BoltShot, BoltStyle };
