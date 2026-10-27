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
import {
  canDefend,
  DEFEND_MOVE_SCALE,
  freshGuard,
  lowerGuard,
  raiseGuard,
  type GuardState,
} from "@/lib/arena/defense";
import type { ArenaFighter } from "@/lib/arena/fighter";
import { clampMove } from "@/lib/arena/gamepad";
import type { Facing } from "@/lib/arena/movement";
import { buffScale, type Buff } from "@/lib/arena/pickups";
import { FIRE_TORNADO_SLOW, SPECIAL_CLIP, type PoisonState } from "@/lib/arena/special";
import { NEUTRAL_SCALE, type TerrainScale } from "@/lib/arena/terrain";
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
  // Medidor do especial (0 a SPECIAL_MAX) e quando encheu (a CPU espera um pouco).
  special: number;
  specialFullAt: number;
  // Efeitos dos especiais: lento (Redemoinho), paralisado (Trovão),
  // intocável (Último Recurso) e envenenado (Pó de Veneno).
  slowUntil: number;
  stunnedUntil: number;
  untouchableUntil: number;
  poison: PoisonState | null;
  // Guiando o furacão: parado, sem atacar, defender nem dar dash.
  channelUntil: number;
  // Pés na água e o bônus de terreno que vale agora (nadador na água).
  inWater: boolean;
  terrain: TerrainScale;
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
    readyAt: { melee: 0, fire: 0, special: 0 },
    dashReadyAt: 0,
    guardUntil: 0,
    defending: false,
    guard: freshGuard(),
    buffs: [],
    special: 0,
    specialFullAt: 0,
    slowUntil: 0,
    stunnedUntil: 0,
    untouchableUntil: 0,
    poison: null,
    channelUntil: 0,
    inWater: false,
    terrain: NEUTRAL_SCALE,
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

function attackClip(player: Player, kind: AttackKind) {
  if (kind === "special") return SPECIAL_CLIP[player.fighter.special];
  return kind === "fire" ? "shoot" : "attack";
}

function playAttack(player: Player, kind: AttackKind) {
  if (player.attacking || player.hurting || isStunned(player) || isChanneling(player)) return false;
  player.attacking = true;
  playLockedClip(player, attackClip(player, kind));
  return true;
}

function isChanneling(player: Player) {
  return player.sprite.scene.time.now < player.channelUntil;
}

function endChannel(player: Player) {
  player.channelUntil = 0;
}

function isStunned(player: Player) {
  return player.sprite.scene.time.now < player.stunnedUntil;
}

// Paralisia do Trovão: para no lugar, sem andar, atacar nem defender.
function stunPlayer(player: Player, durationMs: number) {
  player.stunnedUntil = Math.max(player.stunnedUntil, player.sprite.scene.time.now + durationMs);
  player.dash = null;
  lowerDefense(player);
  // A paralisia assume o lugar do hurt: o token novo descarta o fim do clipe anterior.
  player.attacking = false;
  player.hurting = false;
  player.animToken += 1;
  player.sprite.setVelocity(0, 0);
  playPlayerClip(player, "hurt");
}

function playHurt(player: Player) {
  player.dash = null;
  lowerDefense(player);
  player.hurting = true;
  player.attacking = false;
  playLockedClip(player, "hurt");
}

// Liga/desliga a defesa. Só começa livre (sem golpe, hurt ou dash) e com guarda.
// `parryWindowMs` alonga a janela de parry desse levantar (decisão da CPU).
function setDefending(player: Player, on: boolean, parryWindowMs?: number) {
  const now = player.sprite.scene.time.now;
  const next =
    on &&
    player.hp > 0 &&
    !player.attacking &&
    !player.hurting &&
    !isDashing(player) &&
    !isStunned(player) &&
    !isChanneling(player) &&
    canDefend(now, player.guard);
  if (next === player.defending) return false;
  if (!next) {
    lowerDefense(player);
    return true;
  }
  player.defending = true;
  player.guard = raiseGuard(player.guard, now, parryWindowMs);
  return true;
}

// Baixa a guarda; levantar de novo logo depois não vale parry.
function lowerDefense(player: Player) {
  if (!player.defending) return;
  player.defending = false;
  player.guard = lowerGuard(player.guard, player.sprite.scene.time.now);
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
  if (player.hurting || isStunned(player)) {
    player.sprite.setVelocity(0, 0);
    return;
  }
  if (isChanneling(player)) {
    player.sprite.setVelocity(0, 0);
    if (!player.attacking) playPlayerClip(player, "idle");
    return;
  }
  // Analógico pela metade anda mais devagar; teclado e CPU chegam com módulo 1.
  const move = clampMove(x, y);
  const moving = move.x !== 0 || move.y !== 0;
  const now = player.sprite.scene.time.now;
  const guard = player.defending ? DEFEND_MOVE_SCALE : 1;
  const slow = now < player.slowUntil ? FIRE_TORNADO_SLOW : 1;
  const pace = speed * guard * slow * buffScale(player.buffs, "haste", now) * player.terrain.speed;
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
  endChannel,
  haltPlayer,
  isDashing,
  isChanneling,
  isEvading,
  isStunned,
  lowerDefense,
  placePlayer,
  playAttack,
  playerAnchor,
  playHurt,
  setDefending,
  setPlayerHp,
  startDash,
  stunPlayer,
  syncPlayerMarker,
  updatePlayer,
};
export type { DashKind, Player };
