// Status de envenenado: selo pixel (gota com caveira) balançando sobre a
// cabeça e bolhas roxas que nascem no corpo, sobem em degraus e estouram.
import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { pixelBurst, pixelRing } from "@/game/arena/entities/pixel-fx";
import type { Player } from "@/game/arena/entities/player";
import type { Point } from "@/lib/arena/combat";
import Phaser from "phaser";

type PoisonFx = {
  badge: Phaser.GameObjects.Image;
  nextBubbleAt: number;
  bubbles: Phaser.GameObjects.Image[];
};

const BADGE_DEPTH = 8;
const BUBBLE_DEPTH = 6.4;
const BADGE_SCALE = 3;
const BADGE_OFFSET_Y = 70;
const BOB_MS = 220;
const BOB_PX = 3;
// Último segundo do veneno: o selo pisca.
const BLINK_LEAD_MS = 1000;
const BLINK_MS = 100;
const BUBBLE_EVERY_MS = 180;
const BUBBLE_SPREAD_X = 22;
const BUBBLE_STEPS = 3;
const BUBBLE_STEP_MS = 90;
const BUBBLE_RISE = 5;
const POP_TINTS = [0xb860f0, 0x9a3ad8, 0x8af03a];

const effects = new WeakMap<Player, PoisonFx>();

// Bolha que estoura num anel pixel; `big` para o tique de dano.
function popPoisonBubble(scene: Phaser.Scene, at: Point, big = false) {
  const scale = big ? 3 : 2;
  pixelRing(scene, at, FX_TEXTURES.shards, 0xb860f0, scale, 3, 60, BUBBLE_DEPTH + 0.1);
  pixelBurst(scene, at, POP_TINTS, big ? 8 : 4, 2, -40, BUBBLE_DEPTH + 0.1);
}

function spawnBubble(scene: Phaser.Scene, fx: PoisonFx, player: Player) {
  const sprite = player.sprite;
  const offset = {
    x: (Math.random() - 0.5) * BUBBLE_SPREAD_X * 2,
    y: -10 + Math.random() * 30,
  };
  const bubble = scene.add
    .image(Math.round(sprite.x + offset.x), Math.round(sprite.y + offset.y), FX_TEXTURES.toxicBubble)
    .setScale(2)
    .setDepth(BUBBLE_DEPTH);
  fx.bubbles.push(bubble);
  for (let step = 1; step <= BUBBLE_STEPS; step += 1) {
    scene.time.delayedCall(step * BUBBLE_STEP_MS, () => {
      if (!bubble.scene) return;
      // Acompanha o lutador enquanto sobe.
      const at = {
        x: Math.round(player.sprite.x + offset.x),
        y: Math.round(player.sprite.y + offset.y - step * BUBBLE_RISE),
      };
      if (step < BUBBLE_STEPS) {
        bubble.setPosition(at.x, at.y);
        return;
      }
      popPoisonBubble(scene, at);
      fx.bubbles.splice(fx.bubbles.indexOf(bubble), 1);
      bubble.destroy();
    });
  }
}

function syncPoisonFx(scene: Phaser.Scene, player: Player) {
  const poison = player.poison;
  if (!poison || player.hp <= 0) {
    clearPoisonFx(player);
    return;
  }
  const now = scene.time.now;
  let fx = effects.get(player);
  if (!fx) {
    const badge = scene.add
      .image(player.sprite.x, player.sprite.y, FX_TEXTURES.poisonBadge)
      .setScale(BADGE_SCALE)
      .setDepth(BADGE_DEPTH);
    fx = { badge, nextBubbleAt: now, bubbles: [] };
    effects.set(player, fx);
  }
  const bob = Math.floor(now / BOB_MS) % 2 === 0 ? 0 : BOB_PX;
  const left = poison.until - now;
  const shown = left > BLINK_LEAD_MS || Math.floor(left / BLINK_MS) % 2 === 0;
  fx.badge
    .setPosition(Math.round(player.sprite.x), Math.round(player.sprite.y - BADGE_OFFSET_Y - bob))
    .setVisible(shown);
  if (now >= fx.nextBubbleAt) {
    fx.nextBubbleAt = now + BUBBLE_EVERY_MS;
    spawnBubble(scene, fx, player);
  }
}

function clearPoisonFx(player: Player) {
  const fx = effects.get(player);
  if (!fx) return;
  if (fx.badge.scene) fx.badge.destroy();
  for (const bubble of fx.bubbles) if (bubble.scene) bubble.destroy();
  effects.delete(player);
}

export { clearPoisonFx, popPoisonBubble, syncPoisonFx };
