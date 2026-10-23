import {
  characterAnimationKey,
  characterDisplaySize,
  characterFrameStart,
  playClip,
  type CharacterClip,
} from "@/game/arena/animations/character";
import { fighterSheetKey } from "@/game/arena/assets/catalog";
import {
  createMarker,
  setMarkerHp,
  syncMarker,
  type MarkerSide,
  type PlayerMarker,
} from "@/game/arena/entities/marker";
import type { AttackKind } from "@/lib/arena/combat";
import { canDefend, DEFEND_MOVE_SCALE, freshGuard, type GuardState } from "@/lib/arena/defense";
import type { ArenaFighter } from "@/lib/arena/fighter";
import { normalizeMove, type Facing } from "@/lib/arena/movement";
import { buffScale, type Buff } from "@/lib/arena/pickups";
import Phaser from "phaser";

type DashKind = "lunge" | "evade";

type Dash = {
  kind: DashKind;
  x: number;
  y: number;
  until: number;
};

type Player = {
  fighter: ArenaFighter;
  sprite: Phaser.Physics.Arcade.Sprite;
  facing: Facing;
  marker: PlayerMarker;
  hp: number;
  maxHp: number;
  attacking: boolean;
  hurting: boolean;
  dash: Dash | null;
  readyAt: Record<AttackKind, number>;
  dashReadyAt: number;
  // Até quando o golpe corpo a corpo reduz o dano à distância recebido.
  guardUntil: number;
  // Shift segurado: corta o dano recebido e não entra em hurt.
  defending: boolean;
  guard: GuardState;
  // Efeitos temporários dos consumíveis (velocidade, dano, vulnerabilidade).
  buffs: Buff[];
  animToken: number;
};

function createPlayer(
  scene: Phaser.Scene,
  x: number,
  y: number,
  fighter: ArenaFighter,
  facing: Facing = "south",
  side: MarkerSide = "player",
  mirrored = false,
): Player {
  const { tuning } = fighter;
  const feetY = y + tuning.feetOffsetY;
  const marker = createMarker(
    scene,
    x,
    feetY,
    fighter.name,
    fighter.hp,
    fighter.hp,
    side,
  );
  const sprite = scene.physics.add.sprite(
    x,
    y,
    fighterSheetKey(fighter, "idle"),
    characterFrameStart(fighter, "idle", facing),
  );
  const size = characterDisplaySize(fighter);
  sprite.setDisplaySize(size, size);
  if (mirrored) {
    sprite.setTint(tuning.mirrorTint).setData("baseTint", tuning.mirrorTint);
  }
  sprite.setDepth(tuning.depth);
  sprite.setCollideWorldBounds(true);
  const body = sprite.body;
  if (body instanceof Phaser.Physics.Arcade.Body) {
    const cell = fighter.sprite.cellSize;
    const unit = cell / tuning.bodyReferenceCell;
    const width = tuning.bodyWidth * unit;
    body.setSize(width, tuning.bodyHeight * unit, false);
    body.setOffset((cell - width) / 2, tuning.bodyOffsetY * unit);
  }
  playClip(sprite, characterAnimationKey(fighter, "idle", facing), size);

  return {
    fighter,
    sprite,
    facing,
    marker,
    hp: fighter.hp,
    maxHp: fighter.hp,
    attacking: false,
    hurting: false,
    dash: null,
    readyAt: { melee: 0, fire: 0 },
    dashReadyAt: 0,
    guardUntil: 0,
    defending: false,
    guard: freshGuard(),
    buffs: [],
    animToken: 0,
  };
}

function playPlayerClip(player: Player, action: CharacterClip) {
  playClip(
    player.sprite,
    characterAnimationKey(player.fighter, action, player.facing),
    characterDisplaySize(player.fighter),
  );
}

function playIdle(player: Player) {
  playPlayerClip(player, "idle");
}

function playLockedClip(player: Player, action: "attack" | "shoot" | "hurt") {
  const token = ++player.animToken;
  // Golpe não trava o passo: só o hurt congela o lutador.
  if (action === "hurt") player.sprite.setVelocity(0, 0);
  playPlayerClip(player, action);
  player.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    if (player.animToken !== token) return;
    if (action === "hurt") player.hurting = false;
    else player.attacking = false;
    if (!player.attacking && !player.hurting) playIdle(player);
  });
}

function playAttack(player: Player, kind: AttackKind) {
  if (player.attacking || player.hurting) return false;
  player.attacking = true;
  playLockedClip(player, kind === "fire" ? "shoot" : "attack");
  return true;
}

function playHurt(player: Player) {
  player.dash = null;
  player.defending = false;
  player.hurting = true;
  player.attacking = false;
  playLockedClip(player, "hurt");
}

// Liga/desliga a defesa. Só começa livre (sem golpe, hurt ou dash) e com guarda.
function setDefending(player: Player, on: boolean) {
  const now = player.sprite.scene.time.now;
  const next =
    on &&
    player.hp > 0 &&
    !player.attacking &&
    !player.hurting &&
    !isDashing(player) &&
    canDefend(now, player.guard);
  if (next === player.defending) return false;
  player.defending = next;
  if (next) player.guard = { ...player.guard, usedAt: now };
  return true;
}

function setPlayerHp(player: Player, hp: number) {
  const next = Math.max(0, Math.min(hp, player.maxHp));
  player.hp = next;
  setMarkerHp(player.marker, next, player.maxHp);
}

function playerAnchor(player: Player) {
  return {
    x: player.sprite.x,
    y: player.sprite.y + player.fighter.tuning.feetOffsetY,
  };
}

function syncPlayerMarker(player: Player) {
  const anchor = playerAnchor(player);
  syncMarker(player.marker, anchor.x, anchor.y);
}

function startDash(
  player: Player,
  x: number,
  y: number,
  speed: number,
  durationMs: number,
  kind: DashKind = "lunge",
) {
  const length = Math.hypot(x, y);
  if (length === 0 || speed <= 0 || durationMs <= 0) return;
  player.dash = {
    kind,
    x: (x / length) * speed,
    y: (y / length) * speed,
    until: player.sprite.scene.time.now + durationMs,
  };
  player.sprite.setVelocity(player.dash.x, player.dash.y);
}

function isDashing(player: Player) {
  return (
    player.dash !== null && player.sprite.scene.time.now < player.dash.until
  );
}

function isEvading(player: Player) {
  return player.dash?.kind === "evade" && isDashing(player);
}

function updatePlayer(
  player: Player,
  x: number,
  y: number,
  speed = player.fighter.tuning.speed,
) {
  if (player.dash && !isDashing(player)) player.dash = null;
  if (player.dash) {
    player.sprite.setVelocity(player.dash.x, player.dash.y);
    if (player.dash.kind === "evade") {
      playPlayerClip(player, "dash");
    }
    return;
  }
  if (player.hurting) {
    player.sprite.setVelocity(0, 0);
    return;
  }
  const move = normalizeMove(x, y);
  const moving = move.x !== 0 || move.y !== 0;
  const now = player.sprite.scene.time.now;
  const guard = player.defending ? DEFEND_MOVE_SCALE : 1;
  const pace = speed * guard * buffScale(player.buffs, "haste", now);
  player.sprite.setVelocity(move.x * pace, move.y * pace);
  // Durante o ataque desliza mantendo o clip do golpe até ele terminar.
  if (player.attacking) return;
  if (player.defending) {
    player.guard = { ...player.guard, usedAt: now };
    playPlayerClip(player, "defend");
    return;
  }
  playPlayerClip(player, moving ? "walk" : "idle");
}

function haltPlayer(player: Player) {
  player.dash = null;
  player.sprite.setVelocity(0, 0);
}

function placePlayer(player: Player, x: number, y: number) {
  const body = player.sprite.body;
  if (body instanceof Phaser.Physics.Arcade.Body) body.reset(x, y);
  else player.sprite.setPosition(x, y);
  syncPlayerMarker(player);
}

export {
  createPlayer,
  haltPlayer,
  isDashing,
  isEvading,
  placePlayer,
  playAttack,
  playerAnchor,
  playHurt,
  setDefending,
  setPlayerHp,
  startDash,
  syncPlayerMarker,
  updatePlayer,
};
export type { DashKind, Player };
