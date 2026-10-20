import {
  characterAnimationKey,
  characterFrameStart,
  playClip,
} from "@/game/arena/animations/character";
import { CHARACTER_SHEETS, SPRITE_CELL_SIZE } from "@/game/arena/assets/catalog";
import {
  createMarker,
  setMarkerHp,
  syncMarker,
  type PlayerMarker,
} from "@/game/arena/entities/marker";
import type { AttackKind } from "@/lib/arena/combat";
import type { ArenaFighter } from "@/lib/arena/fighter";
import { normalizeMove, type Facing } from "@/lib/arena/movement";
import Phaser from "phaser";

const PLAYER_DISPLAY_SIZE = 96;
const PLAYER_SPEED = 340;
const PLAYER_BODY_WIDTH = 60;
const PLAYER_BODY_HEIGHT = 100;
const PLAYER_BODY_OFFSET_X = (SPRITE_CELL_SIZE - PLAYER_BODY_WIDTH) / 2;
const PLAYER_BODY_OFFSET_Y = 20;
const FEET_OFFSET_Y = 36;
const PLAYER_DEPTH = 2;

type DashKind = "lunge" | "evade";

type Dash = {
  kind: DashKind;
  x: number;
  y: number;
  until: number;
};

type Player = {
  sprite: Phaser.Physics.Arcade.Sprite;
  facing: Facing;
  marker: PlayerMarker;
  hp: number;
  maxHp: number;
  attackDamage: number;
  attacking: boolean;
  hurting: boolean;
  dash: Dash | null;
  readyAt: Record<AttackKind, number>;
  dashReadyAt: number;
  animToken: number;
};

function createPlayer(
  scene: Phaser.Scene,
  x: number,
  y: number,
  fighter: ArenaFighter,
  facing: Facing = "south",
): Player {
  const feetY = y + FEET_OFFSET_Y;
  const marker = createMarker(scene, x, feetY, fighter.name, fighter.hp, fighter.hp);
  const sprite = scene.physics.add.sprite(
    x,
    y,
    CHARACTER_SHEETS.idle.key,
    characterFrameStart("idle", facing),
  );
  sprite.setDisplaySize(PLAYER_DISPLAY_SIZE, PLAYER_DISPLAY_SIZE);
  sprite.setDepth(PLAYER_DEPTH);
  sprite.setCollideWorldBounds(true);
  const body = sprite.body;
  if (body instanceof Phaser.Physics.Arcade.Body) {
    body.setSize(PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT, false);
    body.setOffset(PLAYER_BODY_OFFSET_X, PLAYER_BODY_OFFSET_Y);
  }
  playClip(sprite, characterAnimationKey("idle", facing));

  return {
    sprite,
    facing,
    marker,
    hp: fighter.hp,
    maxHp: fighter.hp,
    attackDamage: fighter.attackDamage,
    attacking: false,
    hurting: false,
    dash: null,
    readyAt: { melee: 0, fire: 0 },
    dashReadyAt: 0,
    animToken: 0,
  };
}

function playIdle(player: Player) {
  playClip(player.sprite, characterAnimationKey("idle", player.facing));
}

function playLockedClip(player: Player, action: "attack" | "hurt") {
  const token = ++player.animToken;
  player.sprite.setVelocity(0, 0);
  playClip(player.sprite, characterAnimationKey(action, player.facing));
  player.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    if (player.animToken !== token) return;
    if (action === "attack") player.attacking = false;
    else player.hurting = false;
    if (!player.attacking && !player.hurting) playIdle(player);
  });
}

function playAttack(player: Player) {
  if (player.attacking || player.hurting) return false;
  player.attacking = true;
  playLockedClip(player, "attack");
  return true;
}

function playHurt(player: Player) {
  player.dash = null;
  player.hurting = true;
  player.attacking = false;
  playLockedClip(player, "hurt");
}

function setPlayerHp(player: Player, hp: number) {
  const next = Math.max(0, Math.min(hp, player.maxHp));
  player.hp = next;
  setMarkerHp(player.marker, next, player.maxHp);
}

function playerAnchor(player: Player) {
  return {
    x: player.sprite.x,
    y: player.sprite.y + FEET_OFFSET_Y,
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
  return player.dash !== null && player.sprite.scene.time.now < player.dash.until;
}

function updatePlayer(player: Player, x: number, y: number, speed = PLAYER_SPEED) {
  if (player.dash && !isDashing(player)) player.dash = null;
  if (player.dash) {
    player.sprite.setVelocity(player.dash.x, player.dash.y);
    if (player.dash.kind === "evade") {
      playClip(player.sprite, characterAnimationKey("dash", player.facing));
    }
    return;
  }
  if (player.attacking || player.hurting) {
    player.sprite.setVelocity(0, 0);
    return;
  }
  const move = normalizeMove(x, y);
  const moving = move.x !== 0 || move.y !== 0;
  player.sprite.setVelocity(move.x * speed, move.y * speed);
  playClip(
    player.sprite,
    characterAnimationKey(moving ? "walk" : "idle", player.facing),
  );
}

function placePlayer(player: Player, x: number, y: number) {
  const body = player.sprite.body;
  if (body instanceof Phaser.Physics.Arcade.Body) body.reset(x, y);
  else player.sprite.setPosition(x, y);
  syncPlayerMarker(player);
}

export {
  createPlayer,
  isDashing,
  placePlayer,
  playAttack,
  playerAnchor,
  playHurt,
  setPlayerHp,
  startDash,
  syncPlayerMarker,
  updatePlayer,
};
export type { DashKind, Player };
