// Redemoinho de Fogo: funil de faixas de fogo em espiral, base fina e topo
// largo com o miolo de fumaça escura girando. Desenhado em `Graphics` na grade
// de 4px e redesenhado só a cada degrau (`FRAME_MS`): giro e balanço da cauda
// mudam em passos, como sprite. Por onde passa deixa um rastro de chamas.
import { BEAM_PIXEL, pixelGrid } from "@/game/arena/entities/beam";
import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { pixelBurst, pixelRing } from "@/game/arena/entities/pixel-fx";
import type { SpecialFx } from "@/game/arena/entities/special-fx";
import { beamImpact, type BeamEnd, type Point, type Rect } from "@/lib/arena/combat";
import {
  driveTornado,
  FIRE_TORNADO_MS,
  FIRE_TORNADO_SPEED,
  FIRE_TORNADO_TICK_MS,
} from "@/lib/arena/special";
import Phaser from "phaser";

type FireTornadoCast = {
  from: Point;
  // Direção em que o furacão anda agora (WASD do jogador, alvo da CPU).
  move: (at: Point) => Point;
  owner: () => Point | null;
  // Dono ainda canalizando? Se não, o furacão se desfaz.
  active: () => boolean;
  blocks: () => Rect[];
  // Tique de queima na posição atual (pés do furacão).
  onTick: (at: Point) => void;
  // Esbarrou num bloco (no máximo uma vez por tique).
  onBlock: (impact: BeamEnd) => void;
};

type Grid = ReturnType<typeof pixelGrid>;

// Mancha de chão queimado: blocos da grade em volta de onde o furacão passou.
// `ember` marca os blocos que ficam em brasa enquanto o chão esfria.
type TrailPatch = {
  age: number;
  cells: { x: number; y: number; edge: boolean; ember: boolean }[];
};

const FUNNEL_DEPTH = 4.5;
// Abaixo dos lutadores (2) e por cima do chão do mapa.
const TRAIL_DEPTH = 1.55;
const FRAME_MS = 70;
const LAYERS = 12;
const HEIGHT = 132;
const RADIUS_BOTTOM = 6;
const RADIUS_TOP = 46;
// Funil visto de cima em perspectiva: elipses achatadas.
const SQUASH = 0.32;
// Quanto cada degrau gira as faixas e quanto as camadas se defasam (espiral).
const SPIN_PER_FRAME = 0.55;
const LAYER_TWIST = 0.42;
// Balanço da cauda: forte embaixo, some no topo. A ponta também curva de lado.
const SWAY = 16;
const TAIL_CURL = 14;
const SAMPLE = BEAM_PIXEL * 0.7;
const WISPS = 9;
const EMBER_EVERY_MS = 110;
const EMBER_TINTS = [0xfff2a8, 0xffc23a, 0xff7a1a];
// Manchas próximas o bastante para emendar numa faixa contínua.
const TRAIL_SPACING = 12;
const TRAIL_RADIUS = 22;
const TRAIL_LIFE_MS = 4500;
// Queimado começa a sumir no fim da vida, em degraus de alpha.
const TRAIL_FADE_MS = 1500;
const TRAIL_STEPS = 3;
const TRAIL_EMBER_CHANCE = 0.08;
// Brasa: quente, depois vermelha escura, depois apaga.
const EMBER_HOT_MS = 500;
const EMBER_WARM_MS = 1400;
const SCORCH = { char: 0x140a08, edge: 0x3a2014, hot: 0xff7a1a, warm: 0xa8240e } as const;
const FADE_MS = 300;
const FADE_STEPS = 3;

const PALETTE = {
  white: 0xfff2a8,
  yellow: 0xffc23a,
  orange: 0xff7a1a,
  red: 0xd8361a,
  ember: 0xa8240e,
  smoke: 0x4a2228,
  core: 0x2e141a,
} as const;

type Ink = keyof typeof PALETTE;

// Ordem de pintura: fundo e miolo primeiro, faixas da frente por cima.
const BACK_ORDER: readonly Ink[] = ["smoke", "ember", "orange"];
const FRONT_ORDER: readonly Ink[] = ["red", "orange", "yellow", "white"];

function inks(order: readonly Ink[]) {
  return Object.fromEntries(order.map((ink) => [ink, pixelGrid()])) as Record<Ink, Grid>;
}

// Faixa clara/escura ao longo do anel: `streak` vai de -1 a 1.
function frontInk(streak: number, inner: boolean): Ink {
  if (streak > 0.75) return inner ? "yellow" : "white";
  if (streak > 0.3) return inner ? "orange" : "yellow";
  if (streak > -0.35) return inner ? "red" : "orange";
  return "red";
}

function backInk(streak: number): Ink {
  if (streak > 0.55) return "orange";
  if (streak > -0.2) return "ember";
  return "smoke";
}

function castFireTornado(scene: Phaser.Scene, cast: FireTornadoCast): SpecialFx {
  let x = cast.from.x;
  let y = cast.from.y;
  let elapsed = 0;
  let ticks = 0;
  let bumpedTick = -1;
  let shownFrame = -1;
  let embers = 0;
  let ended = false;
  let sinceTrail = TRAIL_SPACING;
  const funnel = scene.add.graphics().setDepth(FUNNEL_DEPTH);
  const ground = scene.add.graphics().setDepth(TRAIL_DEPTH);
  const trail: TrailPatch[] = [];
  pixelBurst(scene, cast.from, EMBER_TINTS, 22, 3, -160, FUNNEL_DEPTH + 0.1);

  const drawFunnel = (frame: number, fade: number) => {
    funnel.clear();
    const back = inks(BACK_ORDER);
    const core = pixelGrid();
    const swirl = pixelGrid();
    const front = inks(FRONT_ORDER);
    const bx = Math.round(x);
    const by = Math.round(y);
    for (let layer = 0; layer < LAYERS; layer += 1) {
      const t = layer / (LAYERS - 1);
      const radius = RADIUS_BOTTOM + (RADIUS_TOP - RADIUS_BOTTOM) * t ** 1.4;
      const cx = bx + Math.sin(t * 4 - frame * 0.6) * SWAY * (1 - t) ** 1.2 + TAIL_CURL * (1 - t) ** 2;
      const cy = by - t * HEIGHT;
      const phase = frame * SPIN_PER_FRAME + layer * LAYER_TWIST;
      const thickness = 1 + Math.round(t * 2);
      const rim = layer === LAYERS - 1;
      // Miolo de fumaça entre as faixas.
      for (let row = -radius * SQUASH * 0.6; row <= radius * SQUASH * 0.6; row += SAMPLE) {
        const half = radius * 0.6 * Math.sqrt(Math.max(0, 1 - (row / (radius * SQUASH * 0.6)) ** 2));
        for (let column = -half; column <= half; column += SAMPLE) core.add(cx + column, cy + row);
      }
      const step = SAMPLE / radius;
      for (let angle = 0; angle < Math.PI * 2; angle += step) {
        const streak = Math.sin(angle + phase);
        const facing = Math.sin(angle) >= 0;
        for (let band = 0; band < thickness; band += 1) {
          const r = radius - band * BEAM_PIXEL * 0.8;
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r * SQUASH;
          // Borda da boca do funil fica clara a volta inteira.
          if (rim) front[frontInk(Math.max(streak, 0.4), band > 0)].add(px, py);
          else if (facing) front[frontInk(streak, band > 0)].add(px, py);
          else back[backInk(streak)].add(px, py);
        }
      }
      if (layer !== LAYERS - 1) continue;
      // Boca do topo: fumaça escura com a espiral girando dentro.
      for (let u = 0.08; u <= 1; u += 0.02) {
        for (const offset of [0, Math.PI]) {
          const angle = u * Math.PI * 3 + phase + offset;
          const r = u * radius * 0.82;
          const at = { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r * SQUASH };
          (offset === 0 ? swirl : back.ember).add(at.x, at.y);
        }
      }
    }
    // Pedaços de fogo soltos girando em volta do topo, em degraus.
    for (let wisp = 0; wisp < WISPS; wisp += 1) {
      const angle = (wisp / WISPS) * Math.PI * 2 + frame * 0.4;
      const height = 0.45 + ((wisp * 37) % 50) / 100;
      const r = RADIUS_TOP * (0.8 + height * 0.5);
      const at = { x: bx + Math.cos(angle) * r, y: by - height * HEIGHT + Math.sin(angle) * r * SQUASH };
      const ink: Ink = wisp % 3 === 0 ? "white" : wisp % 3 === 1 ? "yellow" : "orange";
      front[ink].add(at.x, at.y);
      front[ink].add(at.x, at.y - BEAM_PIXEL);
    }
    for (const ink of BACK_ORDER) back[ink].fill(funnel, PALETTE[ink], fade);
    core.fill(funnel, PALETTE.core, 0.85 * fade);
    swirl.fill(funnel, PALETTE.orange, fade);
    for (const ink of FRONT_ORDER) front[ink].fill(funnel, PALETTE[ink], fade);
  };

  const dropTrail = () => {
    const cells: TrailPatch["cells"] = [];
    const steps = Math.ceil(TRAIL_RADIUS / BEAM_PIXEL);
    const gx = Math.floor(x / BEAM_PIXEL) * BEAM_PIXEL;
    const gy = Math.floor(y / BEAM_PIXEL) * BEAM_PIXEL;
    for (let row = -steps; row <= steps; row += 1) {
      for (let column = -steps; column <= steps; column += 1) {
        // Chão em perspectiva: mancha achatada, borda irregular.
        const distance = Math.hypot(column, row / 0.6) * BEAM_PIXEL;
        const reach = TRAIL_RADIUS * (0.65 + Math.random() * 0.35);
        if (distance > reach) continue;
        cells.push({
          x: gx + column * BEAM_PIXEL,
          y: gy + row * BEAM_PIXEL,
          edge: distance > reach - BEAM_PIXEL * 1.5,
          ember: Math.random() < TRAIL_EMBER_CHANCE,
        });
      }
    }
    trail.push({ age: 0, cells });
  };

  const drawTrail = () => {
    ground.clear();
    // Um grid por cor e degrau de alpha: blocos repetidos entre manchas somem.
    const layers = new Map<string, { grid: Grid; color: number; alpha: number }>();
    const layer = (color: number, alpha: number) => {
      const key = `${color}-${alpha}`;
      let entry = layers.get(key);
      if (!entry) {
        entry = { grid: pixelGrid(), color, alpha };
        layers.set(key, entry);
      }
      return entry.grid;
    };
    for (const patch of trail) {
      const left = TRAIL_LIFE_MS - patch.age;
      const life = left >= TRAIL_FADE_MS ? 1 : Math.ceil((left / TRAIL_FADE_MS) * TRAIL_STEPS) / TRAIL_STEPS;
      const char = layer(SCORCH.char, 0.55 * life);
      const edge = layer(SCORCH.edge, 0.5 * life);
      const ember =
        patch.age < EMBER_HOT_MS ? layer(SCORCH.hot, 1) : patch.age < EMBER_WARM_MS ? layer(SCORCH.warm, 0.9) : null;
      for (const cell of patch.cells) {
        if (cell.ember && ember) ember.add(cell.x, cell.y);
        else (cell.edge ? edge : char).add(cell.x, cell.y);
      }
    }
    // Queimado por baixo, brasas por cima.
    const ordered = [...layers.values()].sort(
      (first, second) => Number(first.color === SCORCH.hot || first.color === SCORCH.warm) -
        Number(second.color === SCORCH.hot || second.color === SCORCH.warm),
    );
    for (const entry of ordered) entry.grid.fill(ground, entry.color, entry.alpha);
  };

  const stepTrail = (deltaMs: number) => {
    for (const patch of [...trail]) {
      patch.age += deltaMs;
      if (patch.age >= TRAIL_LIFE_MS) trail.splice(trail.indexOf(patch), 1);
    }
  };

  const finish = () => {
    ended = true;
    funnel.clear();
    const at = { x: Math.round(x), y: Math.round(y) - HEIGHT / 2 };
    pixelRing(scene, at, FX_TEXTURES.shards, PALETTE.orange, 5, 3, 70, FUNNEL_DEPTH + 0.1);
    pixelBurst(scene, at, EMBER_TINTS, 30, 3, -120, FUNNEL_DEPTH + 0.1);
  };

  const move = (deltaMs: number) => {
    const owner = cast.owner();
    if (!owner) return;
    const next = driveTornado({ x, y }, cast.move({ x, y }), FIRE_TORNADO_SPEED, deltaMs, owner);
    const dx = next.x - x;
    const dy = next.y - y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) return;
    const impact = beamImpact({ x, y }, { x: dx, y: dy }, distance, cast.blocks(), null);
    // Esbarrou num bloco: para encostado e queima o bloco uma vez por tique.
    const back = impact.stop === "block" ? Math.min(2, impact.distance) : 0;
    x = impact.x - (dx / distance) * back;
    y = impact.y - (dy / distance) * back;
    sinceTrail += Math.max(0, impact.distance - back);
    if (impact.stop === "block" && bumpedTick !== ticks) {
      bumpedTick = ticks;
      cast.onBlock(impact);
    }
  };

  drawFunnel(0, 1);
  return {
    step(deltaMs) {
      elapsed += deltaMs;
      stepTrail(deltaMs);
      const frame = Math.floor(elapsed / FRAME_MS);
      if (!ended && (!cast.active() || elapsed >= FIRE_TORNADO_MS)) finish();
      if (ended) {
        if (frame !== shownFrame) {
          shownFrame = frame;
          drawTrail();
        }
        return trail.length === 0;
      }
      move(deltaMs);
      if (sinceTrail >= TRAIL_SPACING) {
        sinceTrail = 0;
        dropTrail();
      }
      while (ticks * FIRE_TORNADO_TICK_MS <= elapsed) {
        cast.onTick({ x, y });
        ticks += 1;
      }
      if (elapsed - embers * EMBER_EVERY_MS >= EMBER_EVERY_MS) {
        embers += 1;
        const height = Math.random();
        const angle = Math.random() * Math.PI * 2;
        const r = RADIUS_BOTTOM + (RADIUS_TOP - RADIUS_BOTTOM) * height;
        const at = { x: x + Math.cos(angle) * r, y: y - height * HEIGHT + Math.sin(angle) * r * SQUASH };
        pixelBurst(scene, at, EMBER_TINTS, 3, 2, -140, FUNNEL_DEPTH + 0.1);
      }
      if (frame !== shownFrame) {
        shownFrame = frame;
        const left = FIRE_TORNADO_MS - elapsed;
        const fade = left < FADE_MS ? Math.ceil((left / FADE_MS) * FADE_STEPS) / FADE_STEPS : 1;
        drawFunnel(frame, fade);
        drawTrail();
      }
      return false;
    },
    destroy() {
      if (funnel.scene) funnel.destroy();
      if (ground.scene) ground.destroy();
      trail.length = 0;
    },
  };
}

// Fogo no alvo atingido: chamas pixel que sobem pelo corpo em degraus,
// acompanhando o alvo, e brasas saltando. Uma leva por tique de acerto.
const BURN_FLAMES = 3;
const BURN_SPREAD = 18;
const BURN_STEP_MS = 60;
const BURN_RISE = 4;
const BURN_ALPHA = [1, 1, 0.66, 0.33];
const BURN_DEPTH = 6.5;

function spawnBurn(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  target: () => Point | null,
) {
  const start = target();
  if (!start) return;
  pixelBurst(scene, start, EMBER_TINTS, 8, 2, -180, BURN_DEPTH + 0.1);
  for (let index = 0; index < BURN_FLAMES; index += 1) {
    const offset = {
      x: (Math.random() - 0.5) * BURN_SPREAD * 2,
      y: (Math.random() - 0.2) * BURN_SPREAD,
    };
    const flame = scene.add
      .image(Math.round(start.x + offset.x), Math.round(start.y + offset.y), FX_TEXTURES.flame)
      .setScale(2)
      .setDepth(BURN_DEPTH);
    bucket.push(flame);
    const release = () => {
      const at = bucket.indexOf(flame);
      if (at >= 0) bucket.splice(at, 1);
      if (flame.scene) flame.destroy();
    };
    BURN_ALPHA.forEach((alpha, step) => {
      scene.time.delayedCall((step + 1) * BURN_STEP_MS, () => {
        const at = target();
        if (!flame.scene || !at) return;
        flame
          .setPosition(Math.round(at.x + offset.x), Math.round(at.y + offset.y - (step + 1) * BURN_RISE))
          .setTexture((step + index) % 2 === 0 ? FX_TEXTURES.flameAlt : FX_TEXTURES.flame)
          .setAlpha(alpha);
      });
    });
    scene.time.delayedCall((BURN_ALPHA.length + 1) * BURN_STEP_MS, release);
  }
}

export { castFireTornado, spawnBurn };
