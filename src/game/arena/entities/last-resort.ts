// Último Recurso: o lutador some e reaparece em volta do alvo, um golpe por
// ponto. Fantasmas na saída, corte e estrelinhas pixel na chegada.
import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { LUNGE, spawnGhost, spawnSlashArc } from "@/game/arena/entities/melee-fx";
import { pixelBurst, pixelRing } from "@/game/arena/entities/pixel-fx";
import { placePlayer, type Player } from "@/game/arena/entities/player";
import type { SpecialFx } from "@/game/arena/entities/special-fx";
import type { Point } from "@/lib/arena/combat";
import { facingFromAim } from "@/lib/arena/movement";
import { LAST_RESORT_BLINK_MS } from "@/lib/arena/special";
import Phaser from "phaser";

type LastResortCast = {
  attacker: Player;
  count: number;
  // Ponto de chegada do golpe `index`, calculado na hora (o alvo anda).
  pointAt: (index: number) => Point | null;
  target: () => Point | null;
  // Pode parar em um ponto? (fora de bloco e do mundo).
  canStand: (at: Point) => boolean;
  onBlink: (index: number, aim: Point) => void;
};

const BLINK_TINTS = [0xfff3a8, 0xffc23a, 0xffffff];
const GHOST_STYLE = { ...LUNGE, ghostTint: 0xffc23a, ghostAlpha: 0.7 };
const SETTLE_MS = 140;
const SLASH_RADIUS = 70;

function castLastResort(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.GameObject[],
  cast: LastResortCast,
): SpecialFx {
  const { attacker } = cast;
  let elapsed = 0;
  let next = 0;
  const total = cast.count * LAST_RESORT_BLINK_MS + SETTLE_MS;

  const blink = (index: number) => {
    const target = cast.target();
    const point = cast.pointAt(index);
    if (!target || !point || !attacker.sprite.scene) return;
    spawnGhost(scene, bucket, attacker.sprite, GHOST_STYLE);
    pixelBurst(scene, attacker.sprite, BLINK_TINTS, 6, 2, 0, 6);
    if (cast.canStand(point)) placePlayer(attacker, point.x, point.y);
    const dx = target.x - attacker.sprite.x;
    const dy = target.y - attacker.sprite.y;
    const length = Math.hypot(dx, dy) || 1;
    const aim = { x: dx / length, y: dy / length };
    attacker.facing = facingFromAim(aim.x, aim.y, attacker.facing);
    pixelRing(scene, attacker.sprite, FX_TEXTURES.shards, 0xffc23a, 3, 3, 50, 6);
    spawnSlashArc(
      scene,
      bucket,
      { x: attacker.sprite.x + aim.x * length * 0.5, y: attacker.sprite.y + aim.y * length * 0.5 },
      aim,
      SLASH_RADIUS,
      { color: 0xfff3a8, thickness: index === cast.count - 1 ? 2 : 1.3 },
    );
    cast.onBlink(index, aim);
  };

  return {
    step(deltaMs) {
      elapsed += deltaMs;
      while (next < cast.count && next * LAST_RESORT_BLINK_MS <= elapsed) {
        blink(next);
        next += 1;
      }
      // Pisca enquanto está "fora": intocável, meio transparente em degraus.
      if (attacker.sprite.scene) attacker.sprite.setAlpha(Math.floor(elapsed / 40) % 2 === 0 ? 1 : 0.5);
      return elapsed >= total;
    },
    destroy() {
      if (attacker.sprite.scene && attacker.hp > 0) attacker.sprite.setAlpha(1);
    },
  };
}

export { castLastResort };
