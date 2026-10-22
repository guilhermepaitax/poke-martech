import { cssColorNumber } from "@/game/arena/css-color";
import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import Phaser from "phaser";

const GROUND_DEPTH = 1;
const WAVE_DEPTH = 1.05;
const PLATE_DEPTH = 3;
const RING_WIDTH = 70;
const RING_HEIGHT = 18;
const SHADOW_WIDTH = 70;
const SHADOW_HEIGHT = 22;
const BAR_WIDTH = 70;
const BAR_HEIGHT = 8;
const BAR_INSET = 2;
const BAR_OFFSET_Y = 20;
const NAME_OFFSET_Y = 25;
const SPIN_DASHES = 3;
const SPIN_SPAN = 0.7;
const SPIN_STEPS = 8;
const SPIN_IDLE_SPEED = 0.0012;
const SPIN_CHARGE_SPEED = 0.012;
const PULSE_IDLE_MS = 320;
const PULSE_CHARGE_MS = 70;
const COLOR_EASE = 0.22;
const SPARK_EVERY_MS = 55;
const SPARK_REACH = 58;
const SPARK_RISE = 26;
const SPARK_MS = 380;
const WAVE_GROW = 2.4;
const WAVE_MS = 520;
const WAVE_STAGGER_MS = 110;

type MarkerState = "idle" | "attack" | "hurt" | "charge1" | "charge2" | "dead";

type MarkerSide = "player" | "opponent";

type MarkerPalette = Record<MarkerState, number>;

type PlayerMarker = {
  ground: Phaser.GameObjects.Container;
  plate: Phaser.GameObjects.Container;
  hpFill: Phaser.GameObjects.Rectangle;
  ring: Phaser.GameObjects.Ellipse;
  spinner: Phaser.GameObjects.Graphics;
  palette: MarkerPalette;
  color: number;
  transient: { state: MarkerState; until: number } | null;
  charge: { level: 0 | 1 | 2; progress: number } | null;
  dead: boolean;
  lastSparkAt: number;
  fx: Phaser.GameObjects.GameObject[];
};

type RingWave = {
  color: number;
  count?: number;
  grow?: number;
  width?: number;
};

let cachedFont: string | null = null;
let cachedPixelFont: string | null = null;
let cachedTitleFont: string | null = null;

function arenaFont() {
  if (cachedFont) return cachedFont;
  if (typeof document === "undefined") {
    cachedFont = "sans-serif";
    return cachedFont;
  }
  const font = getComputedStyle(document.body).fontFamily.trim();
  cachedFont = font || "sans-serif";
  return cachedFont;
}

function setPixelFont(family: string) {
  const trimmed = family.trim();
  cachedPixelFont = trimmed ? `${trimmed}, monospace` : null;
}

function pixelFont() {
  return cachedPixelFont ?? "monospace";
}

function setTitleFont(family: string) {
  const trimmed = family.trim();
  cachedTitleFont = trimmed ? `${trimmed}, sans-serif` : null;
}

function titleFont() {
  return cachedTitleFont ?? arenaFont();
}

function markerPalette(side: MarkerSide): MarkerPalette {
  return {
    idle:
      side === "player"
        ? cssColorNumber("--accent", 0xe2a322)
        : cssColorNumber("--energy-water", 0x3aa0e8),
    attack: 0xfff6d0,
    hurt: cssColorNumber("--destructive", 0xd4534a),
    charge1: cssColorNumber("--energy-fire", 0xe36a3a),
    charge2: cssColorNumber("--energy-psychic", 0xb45ccf),
    dead: cssColorNumber("--energy-colorless", 0x8b949e),
  };
}

function hpFillWidth(hp: number, maxHp: number) {
  const span = BAR_WIDTH - BAR_INSET * 2;
  if (maxHp <= 0) return 0;
  const ratio = Math.min(Math.max(hp / maxHp, 0), 1);
  return span * ratio;
}

function createMarker(
  scene: Phaser.Scene,
  x: number,
  feetY: number,
  name: string,
  hp: number,
  maxHp: number,
  side: MarkerSide = "player",
): PlayerMarker {
  const palette = markerPalette(side);
  const shadow = scene.add.ellipse(0, 3, SHADOW_WIDTH, SHADOW_HEIGHT, 0x120c08, 0.4);
  const ringShade = scene.add.ellipse(0, 1, RING_WIDTH + 6, RING_HEIGHT + 4, 0x2a1a0c, 0);
  ringShade.setStrokeStyle(4, 0x2a1a0c, 0.4);
  const ring = scene.add.ellipse(0, 0, RING_WIDTH, RING_HEIGHT, palette.idle, 0);
  ring.setStrokeStyle(2, palette.idle, 1);
  ring.setSmoothness(32);
  ringShade.setSmoothness(32);
  const spinner = scene.add.graphics();
  const ground = scene.add.container(x, feetY, [shadow, ringShade, ring, spinner]);
  ground.setDepth(GROUND_DEPTH);

  const hpTrack = scene.add.rectangle(0, BAR_OFFSET_Y, BAR_WIDTH, BAR_HEIGHT, 0x111429, 1);
  const fillWidth = hpFillWidth(hp, maxHp);
  const hpFill = scene.add.rectangle(
    -BAR_WIDTH / 2 + BAR_INSET + fillWidth / 2,
    BAR_OFFSET_Y,
    fillWidth,
    BAR_HEIGHT - BAR_INSET * 2,
    0x62d26f,
    1,
  );
  const nameLabel = scene.add
    .text(0, NAME_OFFSET_Y, name, {
      fontFamily: arenaFont(),
      fontSize: "12px",
      color: "#f7f3ea",
    })
    .setOrigin(0.5, 0)
    .setStroke("#2a1c10", 3);
  const plate = scene.add.container(x, feetY, [hpTrack, hpFill, nameLabel]);
  plate.setDepth(PLATE_DEPTH);

  return {
    ground,
    plate,
    hpFill,
    ring,
    spinner,
    palette,
    color: palette.idle,
    transient: null,
    charge: null,
    dead: false,
    lastSparkAt: 0,
    fx: [],
  };
}

function setMarkerHp(marker: PlayerMarker, hp: number, maxHp: number) {
  const fillWidth = hpFillWidth(hp, maxHp);
  marker.hpFill.setVisible(fillWidth > 0);
  if (fillWidth <= 0) return;
  marker.hpFill.setSize(fillWidth, BAR_HEIGHT - BAR_INSET * 2);
  marker.hpFill.setPosition(-BAR_WIDTH / 2 + BAR_INSET + fillWidth / 2, BAR_OFFSET_Y);
}

function flashMarker(marker: PlayerMarker, state: MarkerState, durationMs: number) {
  marker.transient = { state, until: marker.ground.scene.time.now + durationMs };
}

function setMarkerCharge(
  marker: PlayerMarker,
  charge: { level: 0 | 1 | 2; progress: number } | null,
) {
  marker.charge = charge;
}

function setMarkerDead(marker: PlayerMarker) {
  marker.dead = true;
  marker.charge = null;
  marker.transient = null;
}

function markerState(marker: PlayerMarker, now: number): MarkerState {
  if (marker.dead) return "dead";
  if (marker.transient && now < marker.transient.until) return marker.transient.state;
  if (marker.charge?.level === 2) return "charge2";
  if (marker.charge) return "charge1";
  return "idle";
}

function mixColor(from: number, to: number, amount: number) {
  const channel = (shift: number) => {
    const a = (from >> shift) & 0xff;
    const b = (to >> shift) & 0xff;
    return Math.round(a + (b - a) * amount) & 0xff;
  };
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

function track(bucket: Phaser.GameObjects.GameObject[], object: Phaser.GameObjects.GameObject) {
  bucket.push(object);
  return () => {
    const index = bucket.indexOf(object);
    if (index >= 0) bucket.splice(index, 1);
    if (object.scene) object.destroy();
  };
}

function spawnRingWave(scene: Phaser.Scene, marker: PlayerMarker, wave: RingWave) {
  const count = wave.count ?? 1;
  const grow = wave.grow ?? WAVE_GROW;
  for (let index = 0; index < count; index += 1) {
    const ellipse = scene.add
      .ellipse(marker.ground.x, marker.ground.y, RING_WIDTH, RING_HEIGHT, wave.color, 0)
      .setStrokeStyle(wave.width ?? 3, wave.color, 1)
      .setSmoothness(32)
      .setDepth(WAVE_DEPTH)
      .setBlendMode(Phaser.BlendModes.ADD);
    const release = track(marker.fx, ellipse);
    scene.tweens.add({
      targets: ellipse,
      scale: grow + index * 0.35,
      alpha: 0,
      delay: index * WAVE_STAGGER_MS,
      duration: WAVE_MS,
      ease: "Cubic.easeOut",
      onUpdate: () => {
        if (marker.ground.scene) ellipse.setPosition(marker.ground.x, marker.ground.y);
      },
      onComplete: release,
    });
  }
}

function drawSpinner(marker: PlayerMarker, angle: number, scale: number, color: number) {
  const graphics = marker.spinner;
  graphics.clear();
  if (marker.dead) return;
  const rx = (RING_WIDTH / 2 + 5) * scale;
  const ry = (RING_HEIGHT / 2 + 3) * scale;
  graphics.lineStyle(marker.charge ? 3 : 2, color, marker.charge ? 1 : 0.7);
  for (let dash = 0; dash < SPIN_DASHES; dash += 1) {
    const start = angle + (Math.PI * 2 * dash) / SPIN_DASHES;
    const points: Phaser.Math.Vector2[] = [];
    for (let step = 0; step <= SPIN_STEPS; step += 1) {
      const theta = start + (SPIN_SPAN * step) / SPIN_STEPS;
      points.push(new Phaser.Math.Vector2(Math.cos(theta) * rx, Math.sin(theta) * ry));
    }
    graphics.strokePoints(points, false);
  }
}

function spawnChargeSpark(scene: Phaser.Scene, marker: PlayerMarker, color: number) {
  const angle = Math.random() * Math.PI * 2;
  const x = marker.ground.x + Math.cos(angle) * SPARK_REACH;
  const y = marker.ground.y + Math.sin(angle) * SPARK_REACH * 0.35;
  const spark = scene.add
    .image(x, y, FX_TEXTURES.spark)
    .setTint(color)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(PLATE_DEPTH - 0.5)
    .setScale(1.3);
  const release = track(marker.fx, spark);
  scene.tweens.add({
    targets: spark,
    x: marker.ground.x,
    y: marker.ground.y - SPARK_RISE,
    scale: 0.3,
    alpha: 0.2,
    duration: SPARK_MS,
    ease: "Quad.easeIn",
    onComplete: release,
  });
}

function animateMarker(marker: PlayerMarker, now: number) {
  const scene = marker.ground.scene;
  if (!scene) return;
  const state = markerState(marker, now);
  const target = marker.palette[state];
  marker.color = mixColor(marker.color, target, COLOR_EASE);
  const charge = marker.charge;
  const pulseMs = charge ? PULSE_CHARGE_MS : PULSE_IDLE_MS;
  const pulse = Math.sin(now / pulseMs);
  const squeeze = charge ? 1 - charge.progress * 0.12 : 1;
  const scale = marker.dead ? 1 : squeeze * (1 + pulse * (charge ? 0.05 : 0.035));
  marker.ring.setScale(scale);
  marker.ring.setStrokeStyle(charge ? 3 : 2, marker.color, marker.dead ? 0.5 : 1);
  marker.ring.setFillStyle(marker.color, charge ? 0.12 + charge.progress * 0.18 : 0);
  const speed = charge
    ? SPIN_IDLE_SPEED + (SPIN_CHARGE_SPEED - SPIN_IDLE_SPEED) * charge.progress
    : SPIN_IDLE_SPEED;
  drawSpinner(marker, (now * speed) % (Math.PI * 2), scale, marker.color);
  if (charge && now - marker.lastSparkAt >= SPARK_EVERY_MS / (1 + charge.level)) {
    marker.lastSparkAt = now;
    spawnChargeSpark(scene, marker, marker.color);
  }
}

function syncMarker(marker: PlayerMarker, x: number, y: number) {
  marker.ground.setPosition(x, y);
  marker.plate.setPosition(x, y);
  animateMarker(marker, marker.ground.scene?.time.now ?? 0);
}

function clearMarkerFx(scene: Phaser.Scene, marker: PlayerMarker) {
  for (const object of marker.fx) {
    scene.tweens.killTweensOf(object);
    if (object.scene) object.destroy();
  }
  marker.fx.length = 0;
}

export {
  arenaFont,
  clearMarkerFx,
  createMarker,
  flashMarker,
  pixelFont,
  setMarkerCharge,
  setMarkerDead,
  setMarkerHp,
  setPixelFont,
  setTitleFont,
  spawnRingWave,
  syncMarker,
  titleFont,
};
export type { MarkerSide, MarkerState, PlayerMarker, RingWave };
