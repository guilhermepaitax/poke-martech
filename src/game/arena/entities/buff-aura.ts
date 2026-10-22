import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { playerAnchor, type Player } from "@/game/arena/entities/player";
import { activeBuffs, PICKUP_EFFECTS, type PickupEffect } from "@/lib/arena/pickups";
import Phaser from "phaser";

const RING_DEPTH = 1.07;
const SPARK_DEPTH = 2.4;
const RING_RX = 44;
const RING_RY = 14;
const RING_STACK = 7;
const RING_DASHES = 6;
const RING_SPAN = 0.55;
const RING_STEPS = 6;
const SPIN_SPEED = 0.003;
const PULSE_MS = 180;
const SPARK_EVERY_MS = 110;
const SPARK_RISE = 70;
const SPARK_MS = 600;
const FADE_LEAD_MS = 1000;
const BLINK_MS = 90;

type AuraRing = {
  graphics: Phaser.GameObjects.Graphics;
  lastSparkAt: number;
};

const auras = new WeakMap<Player, Map<PickupEffect, AuraRing>>();

function ringsOf(player: Player) {
  let rings = auras.get(player);
  if (!rings) {
    rings = new Map();
    auras.set(player, rings);
  }
  return rings;
}

function drawRing(
  graphics: Phaser.GameObjects.Graphics,
  color: number,
  angle: number,
  scale: number,
  alpha: number,
) {
  graphics.clear();
  graphics.fillStyle(color, 0.1 * alpha);
  graphics.fillEllipse(0, 0, RING_RX * 2 * scale, RING_RY * 2 * scale);
  graphics.lineStyle(3, color, alpha);
  for (let dash = 0; dash < RING_DASHES; dash += 1) {
    const start = angle + (Math.PI * 2 * dash) / RING_DASHES;
    const points: Phaser.Math.Vector2[] = [];
    for (let step = 0; step <= RING_STEPS; step += 1) {
      const theta = start + (RING_SPAN * step) / RING_STEPS;
      points.push(
        new Phaser.Math.Vector2(Math.cos(theta) * RING_RX * scale, Math.sin(theta) * RING_RY * scale),
      );
    }
    graphics.strokePoints(points, false);
  }
}

function spawnAuraSpark(scene: Phaser.Scene, player: Player, color: number) {
  const anchor = playerAnchor(player);
  const angle = Math.random() * Math.PI * 2;
  const spark = scene.add
    .image(
      anchor.x + Math.cos(angle) * RING_RX * 0.8,
      anchor.y + Math.sin(angle) * RING_RY * 0.8,
      FX_TEXTURES.spark,
    )
    .setTint(color)
    .setScale(1.2)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(SPARK_DEPTH);
  scene.tweens.add({
    targets: spark,
    y: spark.y - SPARK_RISE,
    alpha: 0,
    scale: 0.4,
    duration: SPARK_MS,
    ease: "Quad.easeOut",
    onComplete: () => spark.destroy(),
  });
}

// Desenha um anel por efeito temporário ativo; some quando o efeito expira.
function syncBuffAura(scene: Phaser.Scene, player: Player) {
  const now = scene.time.now;
  const live = player.hp > 0 ? activeBuffs(player.buffs, now) : [];
  const rings = ringsOf(player);
  for (const [effect, ring] of rings) {
    if (live.some((buff) => buff.effect === effect)) continue;
    ring.graphics.destroy();
    rings.delete(effect);
  }
  const anchor = playerAnchor(player);
  live.forEach((buff, index) => {
    const { color } = PICKUP_EFFECTS[buff.effect];
    let ring = rings.get(buff.effect);
    if (!ring) {
      ring = { graphics: scene.add.graphics().setDepth(RING_DEPTH), lastSparkAt: 0 };
      ring.graphics.setBlendMode(Phaser.BlendModes.ADD);
      rings.set(buff.effect, ring);
    }
    const left = buff.until - now;
    const fading = left < FADE_LEAD_MS && Math.floor(left / BLINK_MS) % 2 === 0;
    const scale = 1 + index * (RING_STACK / RING_RX) + Math.sin(now / PULSE_MS) * 0.04;
    const direction = index % 2 === 0 ? 1 : -1;
    ring.graphics.setPosition(anchor.x, anchor.y);
    drawRing(ring.graphics, color, (now * SPIN_SPEED * direction) % (Math.PI * 2), scale, fading ? 0.3 : 0.9);
    if (now - ring.lastSparkAt >= SPARK_EVERY_MS) {
      ring.lastSparkAt = now;
      spawnAuraSpark(scene, player, color);
    }
  });
}

function clearBuffAura(player: Player) {
  const rings = auras.get(player);
  if (!rings) return;
  for (const ring of rings.values()) {
    if (ring.graphics.scene) ring.graphics.destroy();
  }
  rings.clear();
}

export { clearBuffAura, syncBuffAura };
