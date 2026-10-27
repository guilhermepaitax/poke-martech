// Névoa de Veneno: rajada de névoa roxa que avança crescendo e vira nuvem por
// um instante. Massa em "caroços" com miolo escuro, veios verdes tóxicos
// serpenteando, gavinhas enroladas nas bordas e bolhas estourando. Desenhada
// em `Graphics` na grade de 4px e redesenhada só a cada degrau (`FRAME_MS`).
import { BEAM_PIXEL, pixelGrid } from "@/game/arena/entities/beam";
import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { pixelBurst, pixelRing, pixelTrail } from "@/game/arena/entities/pixel-fx";
import type { SpecialFx } from "@/game/arena/entities/special-fx";
import type { Point } from "@/lib/arena/combat";
import { TOXIC_LINGER_MS, toxicFront } from "@/lib/arena/special";
import Phaser from "phaser";

type ToxicMistCast = {
  origin: Point;
  direction: Point;
  // Até onde a rajada vai (alcance ou o primeiro bloco).
  distance: number;
  // Viagem: a frente andou de `previous` a `travelled` com esse raio.
  onSweep: (previous: number, travelled: number, radius: number) => void;
  // Nuvem parada: a cada quadro, centro e raio.
  onLinger: (center: Point, radius: number) => void;
};

type Lump = {
  x: number;
  y: number;
  r: number;
};

type Bubble = {
  image: Phaser.GameObjects.Image;
  bornAt: number;
};

// Abaixo dos lutadores (profundidade 2): a névoa fica no chão e o personagem
// aparece por cima dela. Bolhas e estouros vão até MIST_DEPTH + 0.2 (< 2).
const MIST_DEPTH = 1.65;
const FRAME_MS = 90;
// Névoa vista de cima: achata o eixo vertical.
const SQUASH = 0.7;
const LUMPS = 10;
// Bolinhas de névoa atrás da frente: a rajada parece um jato alongado.
const TAIL_PUFFS = 3;
const TENDRILS = 4;
// Raio do gancho na ponta das gavinhas.
const HOOK = 14;
const SPECKS = 8;
const BUBBLE_EVERY_MS = 160;
const BUBBLE_RISE = 4;
const BUBBLE_STEPS = 4;
const BUBBLE_STEP_MS = 90;
// Abertura: a nuvem pula de tamanho em degraus antes de ficar parada.
const OPEN_SCALES = [0.85, 1];
const FADE_MS = 300;
const FADE_STEPS = 3;
const MIST_ALPHA = 0.92;

const INK = {
  edge: 0xb860f0,
  purple: 0x9a3ad8,
  dark: 0x6a1a9a,
  core: 0x3a0a4a,
  greenDark: 0x5ab82a,
  green: 0x8af03a,
} as const;

type Ink = keyof typeof INK;

const ORDER: readonly Ink[] = ["edge", "purple", "dark", "core", "greenDark", "green"];
const SPRAY_TINTS = [INK.purple, INK.edge, INK.green];
const POP_TINTS = [INK.green, INK.edge, INK.purple];

function castToxicMist(scene: Phaser.Scene, cast: ToxicMistCast): SpecialFx | null {
  const length = Math.hypot(cast.direction.x, cast.direction.y);
  if (length === 0) return null;
  const ux = cast.direction.x / length;
  const uy = cast.direction.y / length;
  const graphics = scene.add.graphics().setDepth(MIST_DEPTH);
  const anchor = scene.add
    .image(Math.round(cast.origin.x), Math.round(cast.origin.y), FX_TEXTURES.pixel)
    .setVisible(false);
  const trail = pixelTrail(scene, anchor, SPRAY_TINTS, 3, 12, MIST_DEPTH - 0.1);
  // Caroços em frações do raio, sorteados uma vez: a forma não pisca entre quadros.
  const lumps: Lump[] = Array.from({ length: LUMPS }, (_, index) => {
    const angle = (index / LUMPS) * Math.PI * 2 + Math.random() * 0.6;
    const reach = index === 0 ? 0 : 0.35 + Math.random() * 0.3;
    return { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach, r: 0.45 + Math.random() * 0.25 };
  });
  const tendrils = Array.from({ length: TENDRILS }, (_, index) => ({
    angle: (index / TENDRILS) * Math.PI * 2 + Math.random() * 0.8,
    turn: index % 2 === 0 ? 1 : -1,
  }));
  const specks = Array.from({ length: SPECKS }, () => ({
    angle: Math.random() * Math.PI * 2,
    reach: 1 + Math.random() * 0.35,
  }));
  const bubbles: Bubble[] = [];
  let elapsed = 0;
  let travelled = 0;
  let shownFrame = -1;
  let bubbleCount = 0;
  let lingering = false;
  let center = { x: cast.origin.x, y: cast.origin.y };
  let radius = toxicFront(0, cast.distance).radius;
  pixelBurst(scene, cast.origin, SPRAY_TINTS, 10, 2, -40, MIST_DEPTH + 0.1);

  const blobsAt = (cx: number, cy: number, size: number, frame: number, tail: boolean) => {
    const blobs = lumps.map((lump, index) => {
      // Cada caroço balança um bloco para um lado ou outro a cada degrau.
      const wobble = ((frame + index) % 2 === 0 ? 1 : -1) * BEAM_PIXEL;
      return {
        x: cx + lump.x * size + wobble * (index % 3 === 0 ? 1 : 0),
        y: cy + lump.y * size * SQUASH + wobble * (index % 3 === 1 ? 1 : 0),
        r: lump.r * size,
      };
    });
    if (!tail) return blobs;
    for (let puff = 1; puff <= TAIL_PUFFS; puff += 1) {
      const back = puff * size * 0.55;
      if (back > travelled) break;
      blobs.push({ x: cx - ux * back, y: cy - uy * back, r: size * (0.55 - puff * 0.12) });
    }
    return blobs;
  };

  const draw = (frame: number, cx: number, cy: number, size: number, alpha: number, tail: boolean) => {
    graphics.clear();
    const grids = Object.fromEntries(ORDER.map((ink) => [ink, pixelGrid()])) as Record<
      Ink,
      ReturnType<typeof pixelGrid>
    >;
    const blobs = blobsAt(cx, cy, size, frame, tail);
    const phase = frame * 0.5;
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (const blob of blobs) {
      left = Math.min(left, blob.x - blob.r);
      right = Math.max(right, blob.x + blob.r);
      top = Math.min(top, blob.y - blob.r * SQUASH);
      bottom = Math.max(bottom, blob.y + blob.r * SQUASH);
    }
    for (let y = Math.floor(top / BEAM_PIXEL) * BEAM_PIXEL; y <= bottom; y += BEAM_PIXEL) {
      for (let x = Math.floor(left / BEAM_PIXEL) * BEAM_PIXEL; x <= right; x += BEAM_PIXEL) {
        const px = x + BEAM_PIXEL / 2;
        const py = y + BEAM_PIXEL / 2;
        // Profundidade no caroço mais fundo e no segundo: onde empatam fica a
        // costura escura entre caroços (nuvem "encaroçada").
        let depth = -Infinity;
        let second = -Infinity;
        for (const blob of blobs) {
          const inside = blob.r - Math.hypot(px - blob.x, (py - blob.y) / SQUASH);
          if (inside > depth) {
            second = depth;
            depth = inside;
          } else if (inside > second) second = inside;
        }
        if (depth <= 0) continue;
        const dx = px - cx;
        const dy = (py - cy) / SQUASH;
        // Veio verde ondulado: a fase é torcida por um ruído de senos, e um
        // segundo seno abre falhas para não virar espiral perfeita.
        const warp = 1.8 * Math.sin(dx / 23 + phase * 0.6) * Math.cos(dy / 17 - phase * 0.4);
        const angle = Math.atan2(dy, dx);
        const vein = Math.abs(Math.sin(angle * 2 + Math.hypot(dx, dy) / 16 + phase + warp));
        const broken = Math.sin(angle * 5 + dx / 31 + phase) > 0.55;
        const veined = !broken && depth > BEAM_PIXEL && depth < size * 0.55;
        let ink: Ink;
        if (depth < BEAM_PIXEL * 1.5) ink = "edge";
        else if (veined && vein < 0.24) ink = "green";
        else if (veined && vein < 0.38) ink = "greenDark";
        else if (second > 0 && depth - second < BEAM_PIXEL && depth < size * 0.4) ink = "dark";
        else if (depth < size * 0.22) ink = "purple";
        else if (depth < size * 0.45) ink = "dark";
        else ink = "core";
        grids[ink].add(px, py);
      }
    }
    // Gavinhas: saem da borda, fazem um arco e enrolam na ponta.
    for (const tendril of tendrils) {
      const start = tendril.angle + frame * 0.12 * tendril.turn;
      let end = { x: cx, y: cy };
      // Corpo grosso (2 blocos) que afina para a ponta, saindo de dentro da massa.
      for (let u = 0; u <= 1; u += 0.03) {
        const angle = start + u * 0.8 * tendril.turn;
        const reach = size * (0.75 + 0.45 * u);
        end = { x: cx + Math.cos(angle) * reach, y: cy + Math.sin(angle) * reach * SQUASH };
        grids.purple.add(end.x, end.y);
        if (u < 0.7) {
          grids.purple.add(end.x + BEAM_PIXEL, end.y);
          grids.purple.add(end.x, end.y - BEAM_PIXEL);
        }
      }
      // Ponta enrola num gancho em volta de um centro ao lado da ponta.
      const hook = start + 0.8 * tendril.turn + (tendril.turn * Math.PI) / 2;
      const pivot = { x: end.x + Math.cos(hook) * HOOK, y: end.y + Math.sin(hook) * HOOK * SQUASH };
      for (let v = 0; v <= 1; v += 0.06) {
        const angle = hook + Math.PI + tendril.turn * v * Math.PI * 1.3;
        const curl = HOOK * (1 - v * 0.5);
        const at = { x: pivot.x + Math.cos(angle) * curl, y: pivot.y + Math.sin(angle) * curl * SQUASH };
        grids.purple.add(at.x, at.y);
        if (v < 0.6) grids.edge.add(at.x, at.y - BEAM_PIXEL);
      }
    }
    // Pontinhos verdes soltos em volta, piscando em degraus.
    specks.forEach((speck, index) => {
      if ((frame + index) % 3 === 0) return;
      const at = {
        x: cx + Math.cos(speck.angle) * size * speck.reach,
        y: cy + Math.sin(speck.angle) * size * speck.reach * SQUASH,
      };
      grids.green.add(at.x, at.y);
    });
    for (const ink of ORDER) grids[ink].fill(graphics, INK[ink], MIST_ALPHA * alpha);
  };

  const popBubble = (bubble: Bubble) => {
    const at = { x: bubble.image.x, y: bubble.image.y };
    pixelRing(scene, at, FX_TEXTURES.shards, INK.green, 2, 3, 60, MIST_DEPTH + 0.2);
    pixelBurst(scene, at, POP_TINTS, 5, 2, 0, MIST_DEPTH + 0.2);
    bubble.image.destroy();
    bubbles.splice(bubbles.indexOf(bubble), 1);
  };

  const stepBubbles = () => {
    for (const bubble of [...bubbles]) {
      const step = Math.floor((elapsed - bubble.bornAt) / BUBBLE_STEP_MS);
      if (step >= BUBBLE_STEPS) {
        popBubble(bubble);
        continue;
      }
      bubble.image.setY(Math.round(bubble.image.getData("y") as number) - step * BUBBLE_RISE);
    }
  };

  const spawnBubble = () => {
    const angle = Math.random() * Math.PI * 2;
    const reach = Math.random() * radius * 0.8;
    const x = Math.round(center.x + Math.cos(angle) * reach);
    const y = Math.round(center.y + Math.sin(angle) * reach * SQUASH);
    const image = scene.add
      .image(x, y, FX_TEXTURES.toxicBubble)
      .setScale(Math.random() < 0.3 ? 3 : 2)
      .setDepth(MIST_DEPTH + 0.1)
      .setData("y", y);
    bubbles.push({ image, bornAt: elapsed });
  };

  return {
    step(deltaMs) {
      elapsed += deltaMs;
      const frame = Math.floor(elapsed / FRAME_MS);
      stepBubbles();
      if (!lingering) {
        const front = toxicFront(elapsed, cast.distance);
        const previous = travelled;
        travelled = front.travelled;
        radius = front.radius;
        center = { x: cast.origin.x + ux * travelled, y: cast.origin.y + uy * travelled };
        anchor.setPosition(Math.round(center.x), Math.round(center.y));
        cast.onSweep(previous, travelled, radius);
        if (front.done) {
          lingering = true;
          trail.stop();
          pixelBurst(scene, center, SPRAY_TINTS, 18, 3, -50, MIST_DEPTH + 0.1);
          elapsed = 0;
          shownFrame = -1;
          return false;
        }
        if (frame !== shownFrame) {
          shownFrame = frame;
          draw(frame, center.x, center.y, radius, 1, true);
        }
        return false;
      }
      if (elapsed >= TOXIC_LINGER_MS) {
        for (const bubble of [...bubbles]) popBubble(bubble);
        pixelBurst(scene, center, POP_TINTS, 14, 2, -60, MIST_DEPTH + 0.1);
        return true;
      }
      cast.onLinger(center, radius);
      if (elapsed - bubbleCount * BUBBLE_EVERY_MS >= BUBBLE_EVERY_MS) {
        bubbleCount += 1;
        spawnBubble();
      }
      if (frame !== shownFrame) {
        shownFrame = frame;
        const open = OPEN_SCALES[frame] ?? 1;
        const left = TOXIC_LINGER_MS - elapsed;
        const fade = left < FADE_MS ? Math.ceil((left / FADE_MS) * FADE_STEPS) / FADE_STEPS : 1;
        draw(frame, center.x, center.y, radius * open, fade, false);
      }
      return false;
    },
    destroy() {
      if (trail.scene) trail.destroy();
      if (anchor.scene) anchor.destroy();
      if (graphics.scene) graphics.destroy();
      for (const bubble of bubbles) if (bubble.image.scene) bubble.image.destroy();
      bubbles.length = 0;
    },
  };
}

export { castToxicMist };
