import { BUBBLE_ART_SIZE, FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import {
  BEAM_TARGET_RADIUS,
  beamImpact,
  BUBBLE_RADIUS,
  BUBBLE_RANGE,
  BUBBLE_SPEED,
  bubblePosition,
  type BeamEnd,
  type Point,
  type Rect,
} from "@/lib/arena/combat";
import Phaser from "phaser";

type BubbleStyle = {
  // Quadros da pixel art, alternados enquanto a bolha avança.
  frames: readonly [string, string];
  core: number;
  glow: number;
  impact: number;
};

type BubbleShot = {
  from: Point;
  direction: Point;
  sway: number;
  x: number;
  y: number;
  travelled: number;
  radius: number;
  style: BubbleStyle;
  target: () => Point | null;
  onArrive: (impact: BeamEnd) => void;
  objects: Phaser.GameObjects.GameObject[];
  bubble: Phaser.GameObjects.Image;
};

type BubbleLaunchOptions = {
  from: Point;
  direction: Point;
  sway: number;
  style: BubbleStyle;
  target: () => Point | null;
  onArrive: (impact: BeamEnd) => void;
  scale?: number;
};

const WATER_BUBBLE: BubbleStyle = {
  frames: [FX_TEXTURES.bubble, FX_TEXTURES.bubbleAlt],
  core: 0xbfe8ff,
  glow: 0x3aa0e8,
  impact: 0x8fd4ff,
};

const WATER_BUBBLE_CHARGED: BubbleStyle = {
  frames: [FX_TEXTURES.bubbleCharged, FX_TEXTURES.bubbleChargedAlt],
  core: 0xe6f6ff,
  glow: 0x6a7dff,
  impact: 0xb8c4ff,
};

const BUBBLE_DEPTH = 5;
// Px percorridos por quadro da animação (bolha "respirando").
const FRAME_DISTANCE = 36;
const POP_STEPS = 3;
const POP_STEP_MS = 70;
const MUZZLE_DROPS = 4;
const SPLASH_DROPS = 10;

// Escala inteira para os pixels da arte ficarem do mesmo tamanho.
function pixelScale(radius: number) {
  return Math.max(2, Math.round((radius * 2) / BUBBLE_ART_SIZE));
}

function pixelBurst(
  scene: Phaser.Scene,
  at: Point,
  style: BubbleStyle,
  count: number,
  scale: number,
  gravity: number,
) {
  const burst = scene.add.particles(Math.round(at.x), Math.round(at.y), FX_TEXTURES.pixel, {
    lifespan: { min: 180, max: 340 },
    speed: { min: 50, max: 140 },
    gravityY: gravity,
    scale: { start: scale / 2, end: scale / 4 },
    alpha: { start: 1, end: 0 },
    tint: [style.core, style.glow, 0xffffff],
    emitting: false,
  });
  burst.setDepth(BUBBLE_DEPTH + 0.2);
  burst.explode(count);
  scene.time.delayedCall(400, () => {
    if (burst.scene) burst.destroy();
  });
}

function launchBubble(
  scene: Phaser.Scene,
  bucket: BubbleShot[],
  launch: BubbleLaunchOptions,
) {
  const length = Math.hypot(launch.direction.x, launch.direction.y);
  if (length === 0) return null;
  const radius = BUBBLE_RADIUS * (launch.scale ?? 1);
  const { x, y } = launch.from;
  const scale = pixelScale(radius);
  const bubble = scene.add
    .image(Math.round(x), Math.round(y), launch.style.frames[0])
    .setDepth(BUBBLE_DEPTH)
    .setScale(scale);
  pixelBurst(scene, launch.from, launch.style, MUZZLE_DROPS, scale, 0);
  const shot: BubbleShot = {
    from: { x, y },
    direction: { x: launch.direction.x / length, y: launch.direction.y / length },
    sway: launch.sway,
    x,
    y,
    travelled: 0,
    radius,
    style: launch.style,
    target: launch.target,
    onArrive: launch.onArrive,
    objects: [bubble],
    bubble,
  };
  bucket.push(shot);
  return shot;
}

function destroyShot(scene: Phaser.Scene, shot: BubbleShot) {
  for (const object of shot.objects) {
    scene.tweens.killTweensOf(object);
    if (object.scene) object.destroy();
  }
  shot.objects.length = 0;
}

// Estouro em degraus (sem interpolação suave): o anel cresce em passos inteiros.
function popBubble(scene: Phaser.Scene, shot: BubbleShot, at: Point) {
  const scale = shot.bubble.scale;
  const ring = scene.add
    .image(Math.round(at.x), Math.round(at.y), FX_TEXTURES.bubblePop)
    .setTint(shot.style.impact)
    .setDepth(BUBBLE_DEPTH + 0.1)
    .setScale(scale);
  for (let step = 1; step <= POP_STEPS; step += 1) {
    scene.time.delayedCall(step * POP_STEP_MS, () => {
      if (!ring.scene) return;
      if (step === POP_STEPS) {
        ring.destroy();
        return;
      }
      ring.setScale(scale + step).setAlpha(1 - step / POP_STEPS);
    });
  }
  pixelBurst(scene, at, shot.style, SPLASH_DROPS, scale, 320);
}

function stepBubbles(
  scene: Phaser.Scene,
  bucket: BubbleShot[],
  deltaMs: number,
  blocks: Rect[],
) {
  if (deltaMs <= 0) return;
  for (const shot of [...bucket]) {
    const advance = Math.min((BUBBLE_SPEED * deltaMs) / 1000, BUBBLE_RANGE - shot.travelled);
    const next = bubblePosition(shot.from, shot.direction, shot.travelled + advance, shot.sway);
    const dx = next.x - shot.x;
    const dy = next.y - shot.y;
    const step = Math.hypot(dx, dy);
    const impact =
      step > 0
        ? beamImpact(
            shot,
            { x: dx / step, y: dy / step },
            step,
            blocks,
            shot.target(),
            BEAM_TARGET_RADIUS + shot.radius,
          )
        : { x: shot.x, y: shot.y, distance: 0, stop: "range" as const };
    shot.travelled += step > 0 ? advance * (impact.distance / step) : advance;
    shot.x = impact.x;
    shot.y = impact.y;
    shot.bubble
      .setPosition(Math.round(impact.x), Math.round(impact.y))
      .setTexture(shot.style.frames[Math.floor(shot.travelled / FRAME_DISTANCE) % 2] ?? shot.style.frames[0]);
    if (impact.stop === "range" && shot.travelled < BUBBLE_RANGE) continue;
    bucket.splice(bucket.indexOf(shot), 1);
    popBubble(scene, shot, impact);
    destroyShot(scene, shot);
    shot.onArrive(impact);
  }
}

function clearBubbles(scene: Phaser.Scene, bucket: BubbleShot[]) {
  for (const shot of bucket) destroyShot(scene, shot);
  bucket.length = 0;
}

export { clearBubbles, launchBubble, stepBubbles, WATER_BUBBLE, WATER_BUBBLE_CHARGED };
export type { BubbleShot, BubbleStyle };
