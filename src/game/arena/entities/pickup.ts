import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { playerAnchor, type Player } from "@/game/arena/entities/player";
import type { Point } from "@/lib/arena/combat";
import {
  MYSTERY_COLOR,
  PICKUP_EFFECTS,
  PICKUP_LIFETIME_MS,
  PICKUP_RADIUS,
  type PickupLook,
} from "@/lib/arena/pickups";
import Phaser from "phaser";

const SHADOW_DEPTH = 1.1;
const CRATE_DEPTH = 1.8;
// Cada pixel da arte vira um bloco de PIXEL x PIXEL na tela.
const PIXEL = 3;
const CRATE_LIFT = 26;
const BOB_PIXELS = 2;
const BOB_MS = 620;
const SPAWN_POP_MS = 260;
const BLINK_LEAD_MS = 3000;
const BLINK_MS = 120;
const TWINKLE_EVERY_MS = 260;
const TWINKLE_MS = 300;
const COLLECT_REACH = PICKUP_RADIUS + 20;
const BURST_COUNT = 10;
const BURST_REACH = 46;
const BURST_MS = 360;

const OUTLINE = 0x1a1226;
const SHADOW_RING = 0xd8d0ff;

// Caixa 16x16: `o` contorno, `t` topo, `h` brilho, `f` frente, `d` sombra,
// `r` rebite, `.` vazio. O ícone 5x5 entra no meio da frente.
const CRATE_ART = [
  "..oooooooooooo..",
  ".otttttttttttto.",
  "othhtttttttttdto",
  "othttttttttttdto",
  "otttttttttttttdo",
  "oddddddddddddddo",
  "orffffffffffffro",
  "ohffffffffffffdo",
  "ohffffffffffffdo",
  "ohffffffffffffdo",
  "ohffffffffffffdo",
  "ohffffffffffffdo",
  "ohffffffffffffdo",
  "orddddddddddddro",
  ".odddddddddddddo",
  "..oooooooooooo..",
];

const ICON_ART: Record<PickupLook, string[]> = {
  mystery: [".###.", "#...#", "..##.", ".....", "..#.."],
  haste: ["#.#..", ".#.#.", "..#.#", ".#.#.", "#.#.."],
  fury: ["....#", "...#.", "#.#..", ".#...", "#.#.."],
  heal: ["..#..", "..#..", "#####", "..#..", "..#.."],
  rapid: ["..##.", ".##..", "####.", "..##.", ".##.."],
  vulnerable: [".###.", "#.#.#", "#####", ".###.", ".#.#."],
};

const ICON_LEFT = 5;
const ICON_TOP = 7;

const SHADOW_ART = ["...oooooooo...", ".oo********oo.", ".oo********oo.", "...oooooooo..."];

type Pickup = {
  look: PickupLook;
  x: number;
  y: number;
  expiresAt: number;
  lastTwinkleAt: number;
  shadow: Phaser.GameObjects.Image;
  body: Phaser.GameObjects.Container;
};

function lookColor(look: PickupLook) {
  return look === "mystery" ? MYSTERY_COLOR : PICKUP_EFFECTS[look].color;
}

function shade(color: number, amount: number) {
  const target = amount > 0 ? 0xff : 0;
  const ratio = Math.abs(amount);
  const channel = (shift: number) => {
    const value = (color >> shift) & 0xff;
    return Math.round(value + (target - value) * ratio) & 0xff;
  };
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

function paintArt(
  graphics: Phaser.GameObjects.Graphics,
  art: string[],
  palette: Record<string, [number, number]>,
  left = 0,
  top = 0,
) {
  art.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      const paint = palette[cell];
      if (!paint) return;
      graphics.fillStyle(paint[0], paint[1]);
      graphics.fillRect((left + x) * PIXEL, (top + y) * PIXEL, PIXEL, PIXEL);
    });
  });
}

function bakeArt(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  paint: (graphics: Phaser.GameObjects.Graphics) => void,
) {
  if (scene.textures.exists(key)) return key;
  const graphics = scene.add.graphics();
  paint(graphics);
  graphics.generateTexture(key, width * PIXEL, height * PIXEL);
  graphics.destroy();
  scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  return key;
}

function crateTexture(scene: Phaser.Scene, look: PickupLook) {
  const color = lookColor(look);
  return bakeArt(scene, `pickup-crate-${look}`, 16, 16, (graphics) => {
    paintArt(graphics, CRATE_ART, {
      o: [OUTLINE, 1],
      t: [shade(color, 0.35), 1],
      h: [shade(color, 0.7), 1],
      f: [color, 1],
      d: [shade(color, -0.4), 1],
      r: [shade(color, 0.55), 1],
    });
    const icon = ICON_ART[look];
    paintArt(graphics, icon, { "#": [OUTLINE, 0.85] }, ICON_LEFT + 1, ICON_TOP + 1);
    paintArt(graphics, icon, { "#": [0xffffff, 1] }, ICON_LEFT, ICON_TOP);
  });
}

function shadowTexture(scene: Phaser.Scene) {
  return bakeArt(scene, "pickup-shadow", 14, 4, (graphics) => {
    paintArt(graphics, SHADOW_ART, {
      o: [SHADOW_RING, 0.55],
      "*": [0x000000, 0.35],
    });
  });
}

function spawnPickup(scene: Phaser.Scene, bucket: Pickup[], at: Point, look: PickupLook) {
  const shadow = scene.add.image(at.x, at.y, shadowTexture(scene)).setDepth(SHADOW_DEPTH);
  const crate = scene.add.image(0, 0, crateTexture(scene, look));
  const body = scene.add
    .container(at.x, at.y - CRATE_LIFT, [crate])
    .setDepth(CRATE_DEPTH)
    .setScale(0.2);
  scene.tweens.add({ targets: body, scale: 1, duration: SPAWN_POP_MS, ease: "Back.easeOut" });
  // Sobe e desce em degraus de pixel, sem meio-termo suave.
  scene.tweens.add({
    targets: crate,
    y: -BOB_PIXELS * PIXEL,
    duration: BOB_MS,
    ease: "Stepped",
    easeParams: [BOB_PIXELS],
    yoyo: true,
    repeat: -1,
  });
  bucket.push({
    look,
    x: at.x,
    y: at.y,
    expiresAt: scene.time.now + PICKUP_LIFETIME_MS,
    lastTwinkleAt: scene.time.now,
    shadow,
    body,
  });
}

function destroyPickup(scene: Phaser.Scene, pickup: Pickup) {
  scene.tweens.killTweensOf(pickup.body);
  for (const child of pickup.body.list) scene.tweens.killTweensOf(child);
  pickup.body.destroy();
  pickup.shadow.destroy();
}

function spawnTwinkle(scene: Phaser.Scene, pickup: Pickup) {
  const half = 8 * PIXEL;
  const x = pickup.x + Math.round(((Math.random() * 2 - 1) * half) / PIXEL) * PIXEL;
  const y = pickup.y - CRATE_LIFT + Math.round(((Math.random() * 2 - 1) * half) / PIXEL) * PIXEL;
  const twinkle = scene.add
    .image(x, y, FX_TEXTURES.pixel)
    .setTint(shade(lookColor(pickup.look), 0.6))
    .setScale(PIXEL / 4)
    .setDepth(CRATE_DEPTH + 0.1);
  scene.tweens.add({
    targets: twinkle,
    y: y - PIXEL * 3,
    alpha: 0,
    duration: TWINKLE_MS,
    ease: "Stepped",
    easeParams: [3],
    onComplete: () => twinkle.destroy(),
  });
}

function spawnCollectBurst(scene: Phaser.Scene, pickup: Pickup) {
  const color = lookColor(pickup.look);
  const fromY = pickup.y - CRATE_LIFT;
  for (let index = 0; index < BURST_COUNT; index += 1) {
    const angle = (Math.PI * 2 * index) / BURST_COUNT + Math.random() * 0.4;
    const spark = scene.add
      .image(pickup.x, fromY, FX_TEXTURES.pixel)
      .setTint(color)
      .setScale(PIXEL / 2)
      .setDepth(CRATE_DEPTH + 0.5);
    scene.tweens.add({
      targets: spark,
      x: pickup.x + Math.cos(angle) * BURST_REACH,
      y: fromY + Math.sin(angle) * BURST_REACH * 0.6,
      alpha: 0,
      duration: BURST_MS,
      ease: "Stepped",
      easeParams: [5],
      onComplete: () => spark.destroy(),
    });
  }
}

function idle(scene: Phaser.Scene, pickup: Pickup, now: number) {
  const left = pickup.expiresAt - now;
  const visible = left > BLINK_LEAD_MS || Math.floor(left / BLINK_MS) % 2 === 0;
  pickup.body.setVisible(visible);
  if (visible && now - pickup.lastTwinkleAt >= TWINKLE_EVERY_MS) {
    pickup.lastTwinkleAt = now;
    spawnTwinkle(scene, pickup);
  }
}

// Coleta por contato (player e CPU). Retorna quem pegou o quê via `onCollect`.
function stepPickups(
  scene: Phaser.Scene,
  bucket: Pickup[],
  fighters: Player[],
  onCollect: (fighter: Player, look: PickupLook) => void,
) {
  const now = scene.time.now;
  for (let index = bucket.length - 1; index >= 0; index -= 1) {
    const pickup = bucket[index];
    if (!pickup) continue;
    if (now >= pickup.expiresAt) {
      bucket.splice(index, 1);
      destroyPickup(scene, pickup);
      continue;
    }
    const taker = fighters.find((fighter) => {
      if (fighter.hp <= 0) return false;
      const anchor = playerAnchor(fighter);
      return Math.hypot(anchor.x - pickup.x, anchor.y - pickup.y) <= COLLECT_REACH;
    });
    if (!taker) {
      idle(scene, pickup, now);
      continue;
    }
    bucket.splice(index, 1);
    spawnCollectBurst(scene, pickup);
    destroyPickup(scene, pickup);
    onCollect(taker, pickup.look);
  }
}

function clearPickups(scene: Phaser.Scene, bucket: Pickup[]) {
  for (const pickup of bucket) destroyPickup(scene, pickup);
  bucket.length = 0;
}

export { clearPickups, lookColor, spawnPickup, stepPickups };
export type { Pickup };
