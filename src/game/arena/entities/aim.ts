import { AIM_LENGTH, aimTip } from "@/lib/arena/combat";
import Phaser from "phaser";

const AIM_COLOR = 0xffe08a;
const AIM_DEPTH = 1.5;
const DASH = 8;
const GAP = 6;
const ARROW = 12;

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

function clearAim(graphics: Phaser.GameObjects.Graphics) {
  graphics.clear();
}

export { clearAim, createAim, drawAim };
