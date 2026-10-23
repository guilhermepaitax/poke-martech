// Água animada em pixel art (docs/arena-pixel-fx.md): reflexo em blocos que
// muda em degraus, brilhos, ondinhas, peixe saltando e espirros dos lutadores.
import { playArenaAudio } from "@/game/arena/entities/audio";
import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { pixelBurst, pixelRing, snapAngle } from "@/game/arena/entities/pixel-fx";
import type { Player } from "@/game/arena/entities/player";
import type { Point, Rect } from "@/lib/arena/combat";
import { toWorldRect, zoneAt, type TerrainZone, type WorldSize } from "@/lib/arena/terrain";
import Phaser from "phaser";

const SHIMMER_DEPTH = 0.2;
const WAVE_DEPTH = 0.25;
const GLINT_DEPTH = 0.3;
const FISH_DEPTH = 0.7;
const SPLASH_DEPTH = 1.02;
// Bloco do reflexo e das ondas: múltiplo da grade de 4px do mundo.
const SHIMMER_BLOCK = 8;
const WAVE_BLOCK = 4;
const SHIMMER_STEP_MS = 260;
const SHIMMER_ALPHA = 0.22;
const SHIMMER_THRESHOLD = 1.35;
const WAVE_STEP_MS = 180;
const WAVE_LIFE_STEPS = 10;
const WAVES_PER_AREA = 1 / 26000;
const GLINT_STEP_MS = 140;
const GLINTS_PER_AREA = 1 / 30000;
const ART_SCALE = 3;
const FISH_MIN_MS = 3500;
const FISH_MAX_MS = 7000;
const FISH_STEPS = 12;
const FISH_STEP_MS = 55;
const FISH_HOP = 70;
const FISH_HEIGHT = 46;
const RIPPLE_MS = 260;
// Altura da linha d'água acima dos pés (fração da célula) e como fica o que está embaixo.
const SUBMERGE_RATIO = 0.1;
const UNDERWATER_ALPHA = 0.45;
const UNDERWATER_TINT = 0x7fc8ff;
const WATER_TINTS = [0xffffff, 0xbfeaff, 0x5fc4ff];
const SPOT_TRIES = 24;

type Wave = {
  x: number;
  y: number;
  length: number;
  dir: 1 | -1;
  age: number;
};

type Glint = {
  image: Phaser.GameObjects.Image;
  step: number;
};

type WaterFx = {
  zones: readonly TerrainZone[];
  size: WorldSize;
  // Áreas de água no mundo (sem rocha por cima), usadas pelas animações.
  areas: Rect[];
  cells: Point[];
  shimmer: Phaser.GameObjects.Graphics;
  waves: Phaser.GameObjects.Graphics;
  waveList: Wave[];
  glints: Glint[];
  phase: number;
  timers: Phaser.Time.TimerEvent[];
  fish: boolean;
  fishAt: number;
  ripples: WeakMap<Player, number>;
  // Cópia do sprite com só a parte abaixo da linha d'água, translúcida.
  underwater: Map<Player, Phaser.GameObjects.Image>;
};

function waterAt(fx: WaterFx, point: Point) {
  return zoneAt(point, fx.zones, fx.size) === "water";
}

// Ponto aleatório em água de verdade (rocha por cima não conta).
function randomWaterPoint(fx: WaterFx, margin = 0): Point | null {
  const total = fx.areas.reduce((sum, area) => sum + area.width * area.height, 0);
  if (total <= 0) return null;
  for (let attempt = 0; attempt < SPOT_TRIES; attempt += 1) {
    let roll = Math.random() * total;
    const area = fx.areas.find((rect) => (roll -= rect.width * rect.height) <= 0) ?? fx.areas[0];
    if (!area) return null;
    const point = {
      x: area.x + margin + Math.random() * Math.max(area.width - margin * 2, 0),
      y: area.y + margin + Math.random() * Math.max(area.height - margin * 2, 0),
    };
    if (waterAt(fx, point)) return point;
  }
  return null;
}

function snap(value: number, block: number) {
  return Math.floor(value / block) * block;
}

function createWaterFx(scene: Phaser.Scene, zones: readonly TerrainZone[], fish = false): WaterFx | null {
  const water = zones.filter((zone) => zone.kind === "water");
  if (water.length === 0) return null;
  const fx: WaterFx = {
    zones,
    size: { width: 0, height: 0 },
    areas: [],
    cells: [],
    shimmer: scene.add.graphics().setDepth(SHIMMER_DEPTH),
    waves: scene.add.graphics().setDepth(WAVE_DEPTH),
    waveList: [],
    glints: [],
    phase: 0,
    timers: [],
    fish,
    fishAt: 0,
    ripples: new WeakMap(),
    underwater: new Map(),
  };
  fx.timers.push(
    scene.time.addEvent({ delay: SHIMMER_STEP_MS, loop: true, callback: () => stepShimmer(fx) }),
    scene.time.addEvent({ delay: WAVE_STEP_MS, loop: true, callback: () => stepWaves(fx) }),
    scene.time.addEvent({ delay: GLINT_STEP_MS, loop: true, callback: () => stepGlints(fx) }),
  );
  return fx;
}

// Recalcula as áreas no tamanho novo do mundo e recria ondas e brilhos.
function layoutWaterFx(scene: Phaser.Scene, fx: WaterFx, size: WorldSize) {
  fx.size = size;
  fx.areas = fx.zones.filter((zone) => zone.kind === "water").map((zone) => toWorldRect(zone.rect, size));
  fx.cells = [];
  for (const area of fx.areas) {
    for (let y = snap(area.y, SHIMMER_BLOCK); y < area.y + area.height; y += SHIMMER_BLOCK) {
      for (let x = snap(area.x, SHIMMER_BLOCK); x < area.x + area.width; x += SHIMMER_BLOCK) {
        const center = { x: x + SHIMMER_BLOCK / 2, y: y + SHIMMER_BLOCK / 2 };
        if (waterAt(fx, center)) fx.cells.push({ x, y });
      }
    }
  }
  const area = fx.areas.reduce((sum, rect) => sum + rect.width * rect.height, 0);
  fx.waveList = Array.from({ length: Math.round(area * WAVES_PER_AREA) }, () => freshWave(fx)).filter(
    (wave): wave is Wave => wave !== null,
  );
  fx.glints.forEach((glint) => glint.image.destroy());
  fx.glints = Array.from({ length: Math.round(area * GLINTS_PER_AREA) }, (_, index) => ({
    image: scene.add
      .image(0, 0, FX_TEXTURES.waterGlint)
      .setScale(ART_SCALE)
      .setDepth(GLINT_DEPTH)
      .setVisible(false),
    // Começam fora de fase para não piscarem juntos.
    step: -index * 3,
  }));
  stepShimmer(fx);
  stepWaves(fx);
}

// Reflexo: blocos claros onde duas ondas senoidais se somam; muda em degraus.
function stepShimmer(fx: WaterFx) {
  fx.phase += 1;
  const t = fx.phase * 0.55;
  fx.shimmer.clear();
  fx.shimmer.fillStyle(0xd8f3ff, SHIMMER_ALPHA);
  for (const cell of fx.cells) {
    const value = Math.sin(cell.x * 0.045 + t) + Math.sin(cell.y * 0.07 - t * 0.8 + cell.x * 0.02);
    if (value > SHIMMER_THRESHOLD) fx.shimmer.fillRect(cell.x, cell.y, SHIMMER_BLOCK, SHIMMER_BLOCK);
  }
}

function freshWave(fx: WaterFx): Wave | null {
  const at = randomWaterPoint(fx, 24);
  if (!at) return null;
  return {
    x: snap(at.x, WAVE_BLOCK),
    y: snap(at.y, WAVE_BLOCK),
    length: 3 + Math.floor(Math.random() * 4),
    dir: Math.random() < 0.5 ? 1 : -1,
    age: Math.floor(Math.random() * WAVE_LIFE_STEPS),
  };
}

// Ondinhas: traço de blocos que anda 4px por degrau, encolhe e renasce.
function stepWaves(fx: WaterFx) {
  fx.waves.clear();
  fx.waveList = fx.waveList.map((wave) => {
    const next = { ...wave, x: wave.x + wave.dir * WAVE_BLOCK, age: wave.age + 1 };
    return next.age >= WAVE_LIFE_STEPS ? (freshWave(fx) ?? next) : next;
  });
  for (const wave of fx.waveList) {
    const fading = wave.age >= WAVE_LIFE_STEPS - 3 ? 1 : 0;
    const length = Math.max(1, wave.length - fading * (wave.age - (WAVE_LIFE_STEPS - 4)));
    fx.waves.fillStyle(0xffffff, 0.55);
    for (let block = 0; block < length; block += 1) {
      const x = wave.x + block * WAVE_BLOCK;
      if (!waterAt(fx, { x, y: wave.y })) continue;
      fx.waves.fillRect(x, wave.y, WAVE_BLOCK, WAVE_BLOCK);
    }
    // Sombra de 1 bloco embaixo, deslocada: dá volume à crista.
    fx.waves.fillStyle(0x1f6fc4, 0.35);
    fx.waves.fillRect(wave.x + WAVE_BLOCK, wave.y + WAVE_BLOCK, Math.max(length - 2, 1) * WAVE_BLOCK, WAVE_BLOCK);
  }
}

// Brilho: ponto → cruz → ponto → some e reaparece em outro lugar.
function stepGlints(fx: WaterFx) {
  for (const glint of fx.glints) {
    glint.step += 1;
    if (glint.step <= 0) continue;
    if (glint.step === 1) {
      const at = randomWaterPoint(fx, 12);
      if (!at) continue;
      glint.image.setPosition(Math.round(at.x), Math.round(at.y));
    }
    if (glint.step === 1 || glint.step === 3) {
      glint.image.setTexture(FX_TEXTURES.waterGlint).setVisible(true);
    } else if (glint.step === 2) {
      glint.image.setTexture(FX_TEXTURES.waterGlintAlt);
    } else if (glint.step === 4) {
      glint.image.setVisible(false);
    } else if (glint.step > 4 + Math.random() * 30) {
      glint.step = 0;
    }
  }
}

// Peixe salta em arco de degraus, girando em 8 passos, com espirro nas pontas.
function jumpFish(scene: Phaser.Scene, fx: WaterFx) {
  const from = randomWaterPoint(fx, 40);
  if (!from) return;
  const dir = Math.random() < 0.5 ? 1 : -1;
  const to = { x: from.x + dir * FISH_HOP, y: from.y };
  if (!waterAt(fx, to)) return;
  const fish = scene.add
    .image(Math.round(from.x), Math.round(from.y), FX_TEXTURES.fish)
    .setScale(ART_SCALE)
    .setFlipX(dir < 0)
    .setDepth(FISH_DEPTH);
  waterSplash(scene, from, 1);
  for (let step = 1; step <= FISH_STEPS; step += 1) {
    scene.time.delayedCall(step * FISH_STEP_MS, () => {
      if (!fish.scene) return;
      if (step === FISH_STEPS) {
        fish.destroy();
        waterSplash(scene, to, 1);
        return;
      }
      const t = step / FISH_STEPS;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y - Math.sin(t * Math.PI) * FISH_HEIGHT;
      // Sobe de nariz para cima e desce de nariz para baixo.
      const tilt = (t - 0.5) * Math.PI * 0.9 * dir;
      fish
        .setPosition(Math.round(x), Math.round(y))
        .setRotation(snapAngle(tilt, 8))
        .setTexture(step % 2 === 0 ? FX_TEXTURES.fish : FX_TEXTURES.fishAlt);
    });
  }
}

function waterSplash(scene: Phaser.Scene, at: Point, size: number) {
  pixelRing(scene, at, FX_TEXTURES.waterRipple, 0xd8f3ff, 2 + size, 3, 90, SPLASH_DEPTH);
  pixelBurst(scene, at, WATER_TINTS, 6 + size * 3, 2, 420, SPLASH_DEPTH);
}

// Impacto de golpe na água (no lugar das rachaduras do chão).
function spawnWaterSplash(scene: Phaser.Scene, at: Point, damage: number) {
  waterSplash(scene, at, Math.min(3, 1 + Math.floor(damage / 10)));
}

// Linha d'água: acima dela o sprite normal; abaixo, a cópia translúcida e azulada.
function submerge(scene: Phaser.Scene, fx: WaterFx, player: Player, inWater: boolean) {
  const sprite = player.sprite;
  const copy = fx.underwater.get(player);
  if (!inWater) {
    if (sprite.isCropped) sprite.setCrop();
    copy?.setVisible(false);
    return;
  }
  const frameWidth = sprite.frame.width;
  const frameHeight = sprite.frame.height;
  const feet = frameHeight / 2 + player.fighter.tuning.feetOffsetY / Math.max(sprite.scaleY, 0.01);
  const line = Math.max(1, Math.min(frameHeight, Math.round(feet - frameHeight * SUBMERGE_RATIO)));
  sprite.setCrop(0, 0, frameWidth, line);
  const under =
    copy ??
    scene.add.image(0, 0, sprite.texture.key).setTint(UNDERWATER_TINT);
  if (!copy) fx.underwater.set(player, under);
  under
    .setTexture(sprite.texture.key, sprite.frame.name)
    .setPosition(sprite.x, sprite.y)
    .setScale(sprite.scaleX, sprite.scaleY)
    .setFlip(sprite.flipX, sprite.flipY)
    .setDepth(sprite.depth - 0.01)
    // Acompanha o sprite quando ele pisca ou fica apagado (derrota).
    .setAlpha(UNDERWATER_ALPHA * sprite.alpha)
    .setCrop(0, line, frameWidth, frameHeight - line)
    .setVisible(sprite.visible && line < frameHeight);
}

// Chamado a cada quadro por lutador: espirro e som ao entrar, ondinha nadando.
function syncFighterWater(scene: Phaser.Scene, fx: WaterFx, player: Player, inWater: boolean) {
  const feet = { x: player.sprite.x, y: player.sprite.y + player.fighter.tuning.feetOffsetY };
  if (inWater !== player.inWater) {
    waterSplash(scene, feet, 2);
    if (inWater) playArenaAudio(scene, "waterIn");
  }
  submerge(scene, fx, player, inWater);
  if (!inWater) return;
  const now = scene.time.now;
  const velocity = player.sprite.body?.velocity;
  const moving = velocity ? Math.hypot(velocity.x, velocity.y) > 1 : false;
  if (now < (fx.ripples.get(player) ?? 0)) return;
  fx.ripples.set(player, now + (moving ? RIPPLE_MS : RIPPLE_MS * 3));
  pixelRing(scene, feet, FX_TEXTURES.waterRipple, 0xd8f3ff, ART_SCALE, 3, 110, SPLASH_DEPTH);
}

function stepWaterFx(scene: Phaser.Scene, fx: WaterFx) {
  if (!fx.fish) return;
  const now = scene.time.now;
  if (fx.fishAt === 0) fx.fishAt = now + FISH_MIN_MS;
  if (now < fx.fishAt) return;
  fx.fishAt = now + FISH_MIN_MS + Math.random() * (FISH_MAX_MS - FISH_MIN_MS);
  jumpFish(scene, fx);
}

function destroyWaterFx(fx: WaterFx) {
  fx.timers.forEach((timer) => timer.remove());
  fx.glints.forEach((glint) => glint.image.destroy());
  fx.underwater.forEach((image) => image.destroy());
  fx.shimmer.destroy();
  fx.waves.destroy();
}

export {
  createWaterFx,
  destroyWaterFx,
  layoutWaterFx,
  spawnWaterSplash,
  stepWaterFx,
  syncFighterWater,
  waterSplash,
};
export type { WaterFx };
