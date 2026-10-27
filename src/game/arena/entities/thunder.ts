// Trovão: marca pixelada pisca no chão e, depois do aviso, um raio grosso cai
// do céu (mesmo zigue-zague em grade de 4px do Choque do Trovão).
import { pixelDisc } from "@/game/arena/entities/beam";
import { drawBolt, type BoltStyle } from "@/game/arena/entities/bolt";
import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { pixelBurst, pixelRing } from "@/game/arena/entities/pixel-fx";
import type { SpecialFx } from "@/game/arena/entities/special-fx";
import type { Point } from "@/lib/arena/combat";
import { THUNDER_DELAY_MS, THUNDER_RADIUS } from "@/lib/arena/special";
import Phaser from "phaser";

type ThunderCast = {
  at: Point;
  onStrike: (at: Point) => void;
};

const SKY_BOLT: BoltStyle = {
  core: 0xffffff,
  mid: 0xffe14a,
  edge: 0x4ab8ff,
  impact: 0xffe14a,
};

const MARK_DEPTH = 1.6;
const BOLT_DEPTH = 8;
const SKY_HEIGHT = 460;
const SKY_DRIFT = 60;
const BOLT_THICKNESS = 3;
const BLINK_MS = 100;
const FLICKERS = [1, 0.8, 1, 0.5, 0.25];
const FLICKER_MS = 50;

function castThunder(scene: Phaser.Scene, cast: ThunderCast): SpecialFx {
  const at = { x: Math.round(cast.at.x), y: Math.round(cast.at.y) };
  const mark = scene.add.graphics().setDepth(MARK_DEPTH);
  const bolt = scene.add.graphics().setDepth(BOLT_DEPTH);
  const sky = { x: at.x + (Math.random() - 0.5) * SKY_DRIFT, y: at.y - SKY_HEIGHT };
  let elapsed = 0;
  let struck = false;
  let flickerShown = -1;

  const drawMark = () => {
    mark.clear();
    // Pisca mais rápido perto da queda.
    const urgent = elapsed > THUNDER_DELAY_MS * 0.6;
    const on = Math.floor(elapsed / (urgent ? BLINK_MS / 2 : BLINK_MS)) % 2 === 0;
    const alpha = on ? 0.9 : 0.4;
    pixelDisc(mark, at.x, at.y, THUNDER_RADIUS, 0xffe14a, 0.14);
    pixelDisc(mark, at.x, at.y, THUNDER_RADIUS, 0xffe14a, alpha, true);
    // Raio interno encolhe em degraus até a hora do golpe.
    const progress = Math.min(1, elapsed / THUNDER_DELAY_MS);
    pixelDisc(mark, at.x, at.y, THUNDER_RADIUS * (1 - progress) + 8, 0xffffff, alpha, true);
  };

  drawMark();
  return {
    step(deltaMs) {
      elapsed += deltaMs;
      if (!struck && elapsed >= THUNDER_DELAY_MS) {
        struck = true;
        mark.clear();
        pixelDisc(mark, at.x, at.y, THUNDER_RADIUS, 0x4ab8ff, 0.3);
        pixelRing(scene, at, FX_TEXTURES.shards, SKY_BOLT.impact, 5, 4, 60, BOLT_DEPTH - 0.1);
        pixelBurst(scene, at, [SKY_BOLT.core, SKY_BOLT.mid, SKY_BOLT.edge], 28, 4, 0, BOLT_DEPTH + 0.1);
        scene.cameras.main.shake(220, 0.01);
        cast.onStrike(at);
      }
      if (!struck) {
        drawMark();
        return false;
      }
      const flicker = Math.floor((elapsed - THUNDER_DELAY_MS) / FLICKER_MS);
      const alpha = FLICKERS[flicker];
      if (alpha === undefined) return true;
      // Só troca a forma do raio quando muda a piscada.
      if (flicker !== flickerShown) {
        flickerShown = flicker;
        drawBolt(bolt, sky, at, SKY_BOLT, BOLT_THICKNESS, alpha);
        mark.setAlpha(alpha);
      }
      return false;
    },
    destroy() {
      if (mark.scene) mark.destroy();
      if (bolt.scene) bolt.destroy();
    },
  };
}

export { castThunder };
