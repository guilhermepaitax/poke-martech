// Surfar: parede de água que avança na mira. Corpo, crista e espuma são
// desenhados em `Graphics` na grade de 4px, com a crista ondulando em degraus.
import { BEAM_PIXEL, pixelGrid } from "@/game/arena/entities/beam";
import { pixelBurst } from "@/game/arena/entities/pixel-fx";
import type { SpecialFx } from "@/game/arena/entities/special-fx";
import type { Point } from "@/lib/arena/combat";
import { SURF_SPEED, surfWidth } from "@/lib/arena/special";
import Phaser from "phaser";

type SurfCast = {
  origin: Point;
  direction: Point;
  // Até onde a onda vai (alcance ou o primeiro bloco no caminho).
  distance: number;
  // Frente da onda andou de `previous` até `travelled` px.
  onStep: (previous: number, travelled: number) => void;
};

// Abaixo dos lutadores (profundidade 2): a onda corre pelo chão e o
// personagem aparece por cima, como na Névoa de Veneno.
const SURF_DEPTH = 1.65;
// Espessura (px atrás da frente) de cada camada: rastro, corpo, meio e espuma.
const WAKE_DEPTH = 64;
const BODY_DEPTH = 36;
const MID_DEPTH = 20;
const FOAM_DEPTH = 8;
const SAMPLE = BEAM_PIXEL * 0.7;
const WOBBLE_BLOCKS = 3;
const WOBBLE_WAVELENGTH = 40;
// Troca a forma da crista a cada tantos ms (degraus, não ondulação lisa).
const WOBBLE_MS = 90;
const SPRAY_EVERY = 40;
const FOAM_TINTS = [0xffffff, 0xbfeaff, 0x6cc4ff];
// Bordas da onda afinam para não parecer um retângulo.
const EDGE_TAPER = 0.25;

function castSurf(scene: Phaser.Scene, cast: SurfCast): SpecialFx | null {
  const length = Math.hypot(cast.direction.x, cast.direction.y);
  if (length === 0) return null;
  const ux = cast.direction.x / length;
  const uy = cast.direction.y / length;
  const graphics = scene.add.graphics().setDepth(SURF_DEPTH);
  let travelled = 0;
  let elapsed = 0;
  let sprayed = 0;

  const draw = () => {
    graphics.clear();
    const wake = pixelGrid();
    const body = pixelGrid();
    const mid = pixelGrid();
    const foam = pixelGrid();
    const phase = Math.floor(elapsed / WOBBLE_MS);
    const half = surfWidth(travelled) / 2;
    for (let side = -half; side <= half; side += SAMPLE) {
      const edge = 1 - Math.abs(side) / half;
      const taper = Math.min(1, edge / EDGE_TAPER);
      const wobble =
        Math.round(Math.sin(side / WOBBLE_WAVELENGTH + phase) * WOBBLE_BLOCKS * taper) * BEAM_PIXEL;
      const front = travelled + wobble;
      const layers: [ReturnType<typeof pixelGrid>, number][] = [
        [wake, WAKE_DEPTH * taper],
        [body, BODY_DEPTH * taper],
        [mid, MID_DEPTH * taper],
        [foam, FOAM_DEPTH],
      ];
      for (const [grid, depth] of layers) {
        for (let back = 0; back <= depth; back += SAMPLE) {
          const along = front - back;
          if (along < 0) continue;
          grid.add(cast.origin.x + ux * along - uy * side, cast.origin.y + uy * along + ux * side);
        }
      }
    }
    wake.fill(graphics, 0x1f6fc4, 0.35);
    body.fill(graphics, 0x1f6fc4, 0.85);
    mid.fill(graphics, 0x6cc4ff, 0.9);
    foam.fill(graphics, 0xffffff, 1);
  };

  return {
    step(deltaMs) {
      elapsed += deltaMs;
      const previous = travelled;
      travelled = Math.min(cast.distance, travelled + (SURF_SPEED * deltaMs) / 1000);
      cast.onStep(previous, travelled);
      if (travelled - sprayed >= SPRAY_EVERY) {
        sprayed = travelled;
        const side = (Math.random() - 0.5) * surfWidth(travelled);
        const at = {
          x: cast.origin.x + ux * travelled - uy * side,
          y: cast.origin.y + uy * travelled + ux * side,
        };
        pixelBurst(scene, at, FOAM_TINTS, 4, 2, 160, SURF_DEPTH + 0.1);
      }
      if (travelled >= cast.distance) {
        const end = { x: cast.origin.x + ux * travelled, y: cast.origin.y + uy * travelled };
        pixelBurst(scene, end, FOAM_TINTS, 22, 3, 220, SURF_DEPTH + 0.1);
        return true;
      }
      draw();
      return false;
    },
    destroy() {
      if (graphics.scene) graphics.destroy();
    },
  };
}

export { castSurf };
