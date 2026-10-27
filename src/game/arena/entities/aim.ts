import { BEAM_PIXEL, pixelGrid } from "@/game/arena/entities/beam";
import { aimReach, coneWidth, type AimSpec, type ConeAim } from "@/lib/arena/aim";
import { AIM_LENGTH, aimTip, type Point } from "@/lib/arena/combat";
import Phaser from "phaser";

// Mira com formato (`AimSpec`) e força opcional (0 a 1, null = sem clique).
type AimShape = {
  spec: AimSpec;
  power: number | null;
  // Cor do preenchimento da força.
  tone: number;
};

const AIM_COLOR = 0xffe08a;
const AIM_DEPTH = 1.5;
const DASH = 8;
const GAP = 6;
const ARROW = 12;
// Cone desenhado na grade de 4px, como os efeitos: amostra mais fina que o bloco.
const CONE_SAMPLE = BEAM_PIXEL * 0.75;
const CONE_EDGE = BEAM_PIXEL;
const CONE_FILL_ALPHA = 0.14;
const CONE_EDGE_ALPHA = 0.55;
const POWER_FILL_ALPHA = 0.34;
const POWER_FRONT = BEAM_PIXEL * 2;

function createAim(scene: Phaser.Scene) {
  const graphics = scene.add.graphics();
  graphics.setDepth(AIM_DEPTH);
  return graphics;
}

function strokeCircle(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
) {
  graphics.beginPath();
  graphics.arc(x, y, radius, 0, Math.PI * 2, false);
  graphics.strokePath();
}

function drawArrow(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  ux: number,
  uy: number,
) {
  const angle = Math.atan2(uy, ux);
  const spread = 0.42;
  graphics.fillStyle(AIM_COLOR, 1);
  graphics.fillTriangle(
    x,
    y,
    x - Math.cos(angle - spread) * ARROW,
    y - Math.sin(angle - spread) * ARROW,
    x - Math.cos(angle + spread) * ARROW,
    y - Math.sin(angle + spread) * ARROW,
  );
}

function drawDashedLine(
  graphics: Phaser.GameObjects.Graphics,
  fromX: number,
  fromY: number,
  ux: number,
  uy: number,
  length: number,
) {
  const usable = Math.max(length - ARROW, 0);
  graphics.lineStyle(2, AIM_COLOR, 1);
  let traveled = 0;
  while (traveled < usable) {
    const end = Math.min(traveled + DASH, usable);
    graphics.beginPath();
    graphics.moveTo(fromX + ux * traveled, fromY + uy * traveled);
    graphics.lineTo(fromX + ux * end, fromY + uy * end);
    graphics.strokePath();
    traveled += DASH + GAP;
  }
}

function drawReticle(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
) {
  graphics.lineStyle(2, AIM_COLOR, 1);
  strokeCircle(graphics, x, y, 14);
  strokeCircle(graphics, x, y, 3);
  graphics.beginPath();
  graphics.moveTo(x - 10, y);
  graphics.lineTo(x - 5, y);
  graphics.moveTo(x + 5, y);
  graphics.lineTo(x + 10, y);
  graphics.moveTo(x, y - 10);
  graphics.lineTo(x, y - 5);
  graphics.moveTo(x, y + 5);
  graphics.lineTo(x, y + 10);
  graphics.strokePath();
}

function drawAim(
  graphics: Phaser.GameObjects.Graphics,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) {
  graphics.clear();
  const tip = aimTip({ x: fromX, y: fromY }, { x: toX, y: toY }, AIM_LENGTH);
  if (!tip) return;
  const dx = tip.x - fromX;
  const dy = tip.y - fromY;
  const length = Math.hypot(dx, dy);
  if (length === 0) return;
  const ux = dx / length;
  const uy = dy / length;
  drawDashedLine(graphics, fromX, fromY, ux, uy, length);
  drawArrow(graphics, tip.x, tip.y, ux, uy);
  if (!tip.reaches) drawReticle(graphics, toX, toY);
}

// Cone: área do alcance máximo bem clara; com o clique segurado, a parte até
// o alcance da força atual se enche na cor do ataque e a frente vira uma
// faixa clara (onde o ataque vai cair).
function drawCone(
  graphics: Phaser.GameObjects.Graphics,
  from: Point,
  direction: Point,
  spec: ConeAim,
  power: number | null,
  tone: number,
) {
  const length = Math.hypot(direction.x, direction.y);
  if (length === 0) return;
  const ux = direction.x / length;
  const uy = direction.y / length;
  const reach = power === null ? null : aimReach(spec, power);
  const base = pixelGrid();
  const edge = pixelGrid();
  const filled = pixelGrid();
  const front = pixelGrid();
  for (let along = 0; along <= spec.range; along += CONE_SAMPLE) {
    const half = coneWidth(spec, along) / 2;
    for (let side = -half; side <= half; side += CONE_SAMPLE) {
      const x = from.x + ux * along - uy * side;
      const y = from.y + uy * along + ux * side;
      if (reach !== null && Math.abs(along - reach) <= POWER_FRONT / 2) front.add(x, y);
      else if (half - Math.abs(side) < CONE_EDGE || spec.range - along < CONE_EDGE) edge.add(x, y);
      else if (reach !== null && along <= reach) filled.add(x, y);
      else base.add(x, y);
    }
  }
  base.fill(graphics, AIM_COLOR, CONE_FILL_ALPHA);
  filled.fill(graphics, tone, POWER_FILL_ALPHA);
  edge.fill(graphics, AIM_COLOR, CONE_EDGE_ALPHA);
  front.fill(graphics, power === 1 ? 0xffffff : tone, 0.9);
}

// Mira com formato próprio; sem formato, a seta tracejada de sempre.
function drawAimShape(
  graphics: Phaser.GameObjects.Graphics,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  shape: AimShape | null,
) {
  if (!shape) {
    drawAim(graphics, fromX, fromY, toX, toY);
    return;
  }
  graphics.clear();
  const direction = { x: toX - fromX, y: toY - fromY };
  if (shape.spec.kind === "cone") {
    drawCone(graphics, { x: fromX, y: fromY }, direction, shape.spec, shape.power, shape.tone);
  }
}

function clearAim(graphics: Phaser.GameObjects.Graphics) {
  graphics.clear();
}

export { clearAim, createAim, drawAim, drawAimShape };
export type { AimShape };
