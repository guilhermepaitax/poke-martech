import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { crackSize } from "@/lib/arena/combat";
import Phaser from "phaser";

const CRACK_FADE_DELAY_MS = 1400;
const CRACK_FADE_MS = 1800;
const CRACK_DRAW_MS = 120;
const SCORCH_FADE_DELAY_MS = 1800;
const SCORCH_FADE_MS = 2200;
const DUST_MS = 320;
const GROUND_SQUASH = 0.68;
const SCORCH_DEPTH = 0.4;
const CRACK_DEPTH = 0.5;
const DUST_DEPTH = 0.6;
const CRACK_COLOR = 0x2a1a10;
const CRACK_HIGHLIGHT = 0xc9a27a;
const SCORCH_COLOR = 0x3a2414;
const DUST_COLOR = 0xb89670;

type Polyline = { x: number; y: number }[];

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function strokePartial(
  graphics: Phaser.GameObjects.Graphics,
  points: Polyline,
  progress: number,
  offsetY: number,
) {
  const first = points[0];
  if (!first || points.length < 2 || progress <= 0) return;
  const reach = progress * (points.length - 1);
  graphics.beginPath();
  graphics.moveTo(first.x, first.y + offsetY);
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const previous = points[index - 1];
    if (!point || !previous) continue;
    const share = Math.min(1, reach - (index - 1));
    if (share <= 0) break;
    graphics.lineTo(
      previous.x + (point.x - previous.x) * share,
      previous.y + (point.y - previous.y) * share + offsetY,
    );
  }
  graphics.strokePath();
}

function buildBranch(angle: number, length: number, rng: () => number) {
  const trunk: Polyline = [
    {
      x: Math.cos(angle) * length * 0.08 * rng(),
      y: Math.sin(angle) * length * 0.08 * rng(),
    },
  ];
  const forks: Polyline[] = [];
  let current = angle;
  const segments = 3 + Math.floor(rng() * 2);
  for (let index = 0; index < segments; index += 1) {
    const previous = trunk[trunk.length - 1];
    if (!previous) break;
    current += (rng() - 0.5) * 0.8;
    const step = (length / segments) * (0.75 + rng() * 0.4);
    const next = {
      x: previous.x + Math.cos(current) * step,
      y: previous.y + Math.sin(current) * step,
    };
    trunk.push(next);
    if (rng() < 0.45) {
      const branch = current + (rng() < 0.5 ? 0.9 : -0.9);
      const fork = step * (0.45 + rng() * 0.45);
      forks.push([
        next,
        {
          x: next.x + Math.cos(branch) * fork,
          y: next.y + Math.sin(branch) * fork,
        },
      ]);
    }
  }
  return { trunk, forks };
}

function paintCracks(
  graphics: Phaser.GameObjects.Graphics,
  branches: { trunk: Polyline; forks: Polyline[] }[],
  width: number,
  progress: number,
) {
  graphics.clear();
  const forkProgress = Math.max(0, progress * 2 - 1);
  graphics.lineStyle(width, CRACK_HIGHLIGHT, 0.35);
  for (const branch of branches) {
    strokePartial(graphics, branch.trunk, progress, 1.5);
    branch.forks.forEach((fork) => strokePartial(graphics, fork, forkProgress, 1.5));
  }
  graphics.lineStyle(width, CRACK_COLOR, 0.92);
  for (const branch of branches) {
    strokePartial(graphics, branch.trunk, progress, 0);
    branch.forks.forEach((fork) => strokePartial(graphics, fork, forkProgress, 0));
  }
}

function track(
  bucket: Phaser.GameObjects.GameObject[],
  object: Phaser.GameObjects.GameObject,
) {
  bucket.push(object);
  return () => {
    const index = bucket.indexOf(object);
    if (index >= 0) bucket.splice(index, 1);
    if (object.scene) object.destroy();
  };
}

function spawnScorch(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  x: number,
  y: number,
  radius: number,
) {
  const scale = (radius * 1.3) / 64;
  const scorch = scene.add
    .image(x, y, FX_TEXTURES.scorch)
    .setTint(SCORCH_COLOR)
    .setDepth(SCORCH_DEPTH)
    .setScale(scale * 0.6, scale * 0.6 * GROUND_SQUASH)
    .setAlpha(0.6);
  const release = track(bucket, scorch);
  scene.tweens.add({
    targets: scorch,
    scaleX: scale,
    scaleY: scale * GROUND_SQUASH,
    duration: CRACK_DRAW_MS,
    ease: "Quad.easeOut",
  });
  scene.tweens.add({
    targets: scorch,
    alpha: 0,
    delay: SCORCH_FADE_DELAY_MS,
    duration: SCORCH_FADE_MS,
    onComplete: release,
  });
}

function spawnDust(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  x: number,
  y: number,
  count: number,
) {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const reach = 18 + Math.random() * 26;
    const chip = scene.add
      .image(x, y, FX_TEXTURES.spark)
      .setTint(DUST_COLOR)
      .setDepth(DUST_DEPTH)
      .setScale(0.6 + Math.random() * 0.7);
    const release = track(bucket, chip);
    const endX = x + Math.cos(angle) * reach;
    const endY = y + Math.sin(angle) * reach * GROUND_SQUASH;
    const lift = 10 + Math.random() * 14;
    const hop = { t: 0 };
    scene.tweens.add({
      targets: hop,
      t: 1,
      duration: DUST_MS,
      ease: "Quad.easeOut",
      onUpdate: () => {
        if (!chip.scene) return;
        chip.setPosition(
          x + (endX - x) * hop.t,
          y + (endY - y) * hop.t - Math.sin(hop.t * Math.PI) * lift,
        );
        chip.setAlpha(1 - hop.t * hop.t);
      },
      onComplete: release,
    });
  }
}

function spawnCracks(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  x: number,
  y: number,
  damage: number,
) {
  const size = crackSize(damage);
  spawnScorch(scene, bucket, x, y, size.radius);
  const graphics = scene.add.graphics();
  graphics.setPosition(x, y);
  graphics.setDepth(CRACK_DEPTH);
  graphics.setScale(1, GROUND_SQUASH);
  const rng = createRng(Math.floor(Math.random() * 0xffffffff));
  const branches = Array.from({ length: size.branches }, (_, index) => {
    const angle = (Math.PI * 2 * index) / size.branches + (rng() - 0.5) * 0.55;
    return buildBranch(angle, size.radius * (0.65 + rng() * 0.45), rng);
  });
  const width = size.radius >= 80 ? 3 : 2;
  const release = track(bucket, graphics);
  const draw = { progress: 0 };
  scene.tweens.add({
    targets: draw,
    progress: 1,
    duration: CRACK_DRAW_MS,
    ease: "Quad.easeOut",
    onUpdate: () => {
      if (graphics.scene) paintCracks(graphics, branches, width, draw.progress);
    },
    onComplete: () => {
      if (graphics.scene) paintCracks(graphics, branches, width, 1);
    },
  });
  scene.tweens.add({
    targets: graphics,
    alpha: 0,
    delay: CRACK_FADE_DELAY_MS,
    duration: CRACK_FADE_MS,
    onComplete: release,
  });
  spawnDust(scene, bucket, x, y, Math.min(10, 5 + Math.floor(size.branches / 2)));
}

function clearCracks(scene: Phaser.Scene, bucket: Phaser.GameObjects.GameObject[]) {
  for (const object of bucket) {
    scene.tweens.killTweensOf(object);
    if (object.scene) object.destroy();
  }
  bucket.length = 0;
}

export { buildBranch, clearCracks, createRng, spawnCracks, spawnDust, strokePartial, track };
export type { Polyline };
