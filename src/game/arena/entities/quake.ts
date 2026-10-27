// Terremoto: anel de terra que cresce do lutador em degraus de bloco (grade
// de 4px), soltando pedrinhas pixel pela borda.
import { BEAM_PIXEL, pixelDisc } from "@/game/arena/entities/beam";
import { pixelBurst } from "@/game/arena/entities/pixel-fx";
import type { SpecialFx } from "@/game/arena/entities/special-fx";
import type { Point } from "@/lib/arena/combat";
import { QUAKE_MS, quakeRadius } from "@/lib/arena/special";
import Phaser from "phaser";

type QuakeCast = {
  origin: Point;
  // Raio anterior e atual da borda, a cada degrau que o anel cresce.
  onRing: (previous: number, next: number) => void;
};

const QUAKE_DEPTH = 1.6;
const ROCK_DEPTH = 4;
const ROCK_TINTS = [0x8a5a2a, 0xc9a070, 0x5a3a1c];
const ROCKS_PER_STEP = 5;
// Rastro do anel some em degraus depois que ele chega no máximo.
const LINGER_MS = 240;
const LINGER_STEPS = 3;

function castQuake(scene: Phaser.Scene, cast: QuakeCast): SpecialFx {
  const origin = { x: Math.round(cast.origin.x), y: Math.round(cast.origin.y) };
  const graphics = scene.add.graphics().setDepth(QUAKE_DEPTH);
  let elapsed = 0;
  let shown = 0;
  pixelBurst(scene, origin, ROCK_TINTS, 16, 4, 260, ROCK_DEPTH);

  const draw = (radius: number, alpha: number) => {
    graphics.clear();
    // Chão rachado por dentro e a borda grossa de dois blocos.
    pixelDisc(graphics, origin.x, origin.y, radius, 0x5a3a1c, 0.16 * alpha);
    pixelDisc(graphics, origin.x, origin.y, radius, 0x5a3a1c, 0.9 * alpha, true);
    pixelDisc(graphics, origin.x, origin.y, radius - BEAM_PIXEL, 0xc9a070, 0.85 * alpha, true);
    pixelDisc(graphics, origin.x, origin.y, radius - BEAM_PIXEL * 2, 0x8a5a2a, 0.5 * alpha, true);
  };

  return {
    step(deltaMs) {
      elapsed += deltaMs;
      // Raio sobe de bloco em bloco: nada de crescer liso.
      const radius = Math.floor(quakeRadius(elapsed) / BEAM_PIXEL) * BEAM_PIXEL;
      if (radius > shown) {
        cast.onRing(shown, radius);
        for (let index = 0; index < ROCKS_PER_STEP; index += 1) {
          const angle = Math.random() * Math.PI * 2;
          const rock = { x: origin.x + Math.cos(angle) * radius, y: origin.y + Math.sin(angle) * radius };
          pixelBurst(scene, rock, ROCK_TINTS, 2, 2, 320, ROCK_DEPTH);
        }
        shown = radius;
      }
      const after = elapsed - QUAKE_MS;
      if (after >= LINGER_MS) return true;
      const alpha = after <= 0 ? 1 : 1 - Math.ceil((after / LINGER_MS) * LINGER_STEPS) / (LINGER_STEPS + 1);
      draw(shown, alpha);
      return false;
    },
    destroy() {
      if (graphics.scene) graphics.destroy();
    },
  };
}

export { castQuake };
