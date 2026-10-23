// Peças comuns dos efeitos em pixel art (padrão em docs/arena-pixel-fx.md):
// texturas pequenas com filtro NEAREST, escala inteira, posição arredondada,
// tamanho/ângulo mudando em degraus e partículas de `fx-pixel` sem ADD/glow.
import { FX_TEXTURES, PIXEL_ART_SIZE } from "@/game/arena/entities/fx-textures";
import type { Point } from "@/lib/arena/combat";
import Phaser from "phaser";

const BURST_LIFE_MS = 400;
// Lado em px da textura `fx-pixel`.
const PIXEL_TEXTURE_SIZE = 4;

// Escala inteira para os pixels da arte ficarem do mesmo tamanho.
function pixelScale(radius: number, artSize = PIXEL_ART_SIZE) {
  return Math.max(2, Math.round((radius * 2) / artSize));
}

// Gira em degraus fixos em vez de suave, como sprite de cartucho.
function snapAngle(rotation: number, steps: number) {
  const step = (Math.PI * 2) / steps;
  return Math.round(rotation / step) * step;
}

// Rastro de "pixels" do tamanho de um pixel da arte (escala fixa, sem interpolar).
function pixelTrail(
  scene: Phaser.Scene,
  follow: Phaser.GameObjects.Image,
  tints: number[],
  scale: number,
  spread: number,
  depth: number,
) {
  const emitter = scene.add.particles(0, 0, FX_TEXTURES.pixel, {
    follow,
    emitZone: {
      type: "random",
      source: new Phaser.Geom.Circle(0, 0, spread),
      quantity: 1,
    },
    lifespan: { min: 200, max: 360 },
    frequency: 30,
    quantity: 1,
    speed: { min: 4, max: 18 },
    scale: scale / PIXEL_TEXTURE_SIZE,
    alpha: { start: 1, end: 0 },
    tint: tints,
  });
  emitter.setDepth(depth);
  return emitter;
}

function pixelBurst(
  scene: Phaser.Scene,
  at: Point,
  tints: number[],
  count: number,
  scale: number,
  gravity: number,
  depth: number,
) {
  const burst = scene.add.particles(Math.round(at.x), Math.round(at.y), FX_TEXTURES.pixel, {
    lifespan: { min: 180, max: 340 },
    speed: { min: 50, max: 140 },
    gravityY: gravity,
    scale: { start: scale / 2, end: scale / 4 },
    alpha: { start: 1, end: 0 },
    tint: tints,
    emitting: false,
  });
  burst.setDepth(depth);
  burst.explode(count);
  scene.time.delayedCall(BURST_LIFE_MS, () => {
    if (burst.scene) burst.destroy();
  });
}

// Anel que cresce em degraus inteiros (sem interpolação suave) e some.
function pixelRing(
  scene: Phaser.Scene,
  at: Point,
  texture: string,
  tint: number,
  scale: number,
  steps: number,
  stepMs: number,
  depth: number,
) {
  const ring = scene.add
    .image(Math.round(at.x), Math.round(at.y), texture)
    .setTint(tint)
    .setDepth(depth)
    .setScale(scale);
  for (let step = 1; step <= steps; step += 1) {
    scene.time.delayedCall(step * stepMs, () => {
      if (!ring.scene) return;
      if (step === steps) {
        ring.destroy();
        return;
      }
      ring.setScale(scale + step).setAlpha(1 - step / steps);
    });
  }
}

export { pixelBurst, pixelRing, pixelScale, pixelTrail, snapAngle };
