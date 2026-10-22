import { registerCharacterAnimations } from "@/game/arena/animations/character";
import { ARENA_EVENTS } from "@/game/arena/arena-events";
import { preloadArenaAssets } from "@/game/arena/assets/catalog";
import { playArenaAudio } from "@/game/arena/entities/audio";
import { clearBuffAura, syncBuffAura } from "@/game/arena/entities/buff-aura";
import {
  blockRects,
  clearCombatAim,
  createCombat,
  cullProjectiles,
  destroyCombat,
  layoutCombat,
  setCombatKind,
  showBanner,
  stepCombat,
  syncCombatAim,
  tryPlayerAttack,
  tryPlayerDash,
  type Combat,
} from "@/game/arena/entities/combat";
import { updateCpu } from "@/game/arena/entities/cpu";
import { spawnPickupLabel } from "@/game/arena/entities/damage-number";
import { createFxTextures } from "@/game/arena/entities/fx-textures";
import {
  clearMarkerFx,
  setMarkerCharge,
  setMarkerDead,
  spawnRingWave,
} from "@/game/arena/entities/marker";
import { destroyObstacles } from "@/game/arena/entities/obstacle";
import {
  clearPickups,
  lookColor,
  spawnPickup,
  stepPickups,
  type Pickup,
} from "@/game/arena/entities/pickup";
import {
  createPlayer,
  haltPlayer,
  isDashing,
  playerAnchor,
  setPlayerHp,
  syncPlayerMarker,
  updatePlayer,
  type Player,
} from "@/game/arena/entities/player";
import { bindArenaKeys, bindArenaPointer, readMoveAxes, type ArenaKeys } from "@/game/arena/input/arena-input";
import {
  createArenaWorld,
  layoutArena,
  type ArenaWorld,
  type FighterAnchors,
} from "@/game/arena/world/layout";
import { canAttack, COOLDOWN_MS, selectAttack, type AttackKind } from "@/lib/arena/combat";
import { chargeLevel, chargeProgress, type ChargeLevel } from "@/lib/arena/charge";
import {
  CPU_PROFILES,
  DEFAULT_DIFFICULTY,
  isArenaDifficulty,
  type CpuProfile,
} from "@/lib/arena/cpu";
import type { ArenaMatchup } from "@/lib/arena/fighter";
import { DASH_COOLDOWN_MS, facingFromAim } from "@/lib/arena/movement";
import { resolveOutcome, type ArenaOutcome } from "@/lib/arena/outcome";
import {
  addBuff,
  healAmount,
  PICKUP_EFFECTS,
  PICKUP_MAX_ON_MAP,
  pickupDelay,
  pickupSpot,
  revealPickup,
  rollPickup,
  type PickupLook,
} from "@/lib/arena/pickups";
import type { ArenaHudState, ArenaSnapshot, HudSlot } from "@/lib/arena/snapshot";
import { spawnPoints } from "@/lib/arena/spawn";
import Phaser from "phaser";

const DEFEATED_ALPHA = 0.45;
const CHARGE_MOVE_SCALE = 0.55;
const OUTCOME_DELAY_MS = 1100;
const PICKUP_LABEL_OFFSET_Y = 84;
const PICKUP_RETRY_MS = 1000;
const CHARGE_BANNER: Record<Exclude<ChargeLevel, 0>, [string, "charge" | "max"]> = {
  1: ["CARREGADO!", "charge"],
  2: ["MÁXIMO!", "max"],
};

function readMatchup(registry: Phaser.Data.DataManager): ArenaMatchup | null {
  const value: unknown = registry.get("matchup");
  if (!value || typeof value !== "object") return null;
  if (!("player" in value) || !("opponent" in value)) return null;
  return value as ArenaMatchup;
}

function readCpuProfile(registry: Phaser.Data.DataManager): CpuProfile {
  const value: unknown = registry.get("difficulty");
  return CPU_PROFILES[isArenaDifficulty(value) ? value : DEFAULT_DIFFICULTY];
}

function freshCycles(): Record<HudSlot, { readyAt: number; cycle: number }> {
  return {
    melee: { readyAt: 0, cycle: 0 },
    fire: { readyAt: 0, cycle: 0 },
    dash: { readyAt: 0, cycle: 0 },
  };
}

function freshAnchors(): FighterAnchors {
  return { playerX: 0.5, playerY: 0.5, opponentX: 0.5, opponentY: 0.5 };
}

class ArenaScene extends Phaser.Scene {
  private world: ArenaWorld | null = null;
  private player: Player | null = null;
  private opponent: Player | null = null;
  private combat: Combat | null = null;
  private pointerSeen = false;
  private keys: ArenaKeys | null = null;
  private anchors: FighterAnchors = freshAnchors();
  private releaseInput: (() => void) | null = null;
  private outcome: ArenaOutcome = "ongoing";
  private cpuProfile: CpuProfile = CPU_PROFILES[DEFAULT_DIFFICULTY];
  private chargeStartedAt: number | null = null;
  private chargeShown: ChargeLevel = 0;
  private chargeCycle = 0;
  private hudCycles = freshCycles();
  private elapsedMs = 0;
  private pickups: Pickup[] = [];
  private nextPickupAt = 0;

  constructor() {
    super("arena");
  }

  init() {
    this.world = null;
    this.player = null;
    this.opponent = null;
    this.combat = null;
    this.pointerSeen = false;
    this.keys = null;
    this.anchors = freshAnchors();
    this.releaseInput = null;
    this.outcome = "ongoing";
    this.chargeStartedAt = null;
    this.chargeShown = 0;
    this.chargeCycle = 0;
    this.hudCycles = freshCycles();
    this.elapsedMs = 0;
    this.pickups = [];
    this.nextPickupAt = 0;
  }

  preload() {
    const matchup = readMatchup(this.game.registry);
    preloadArenaAssets(this, matchup ? [matchup.player, matchup.opponent] : []);
  }

  create() {
    createFxTextures(this);
    this.world = createArenaWorld(this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.releaseInput = bindArenaPointer(this, {
      onPrimaryDown: () => this.startCharge(),
      onPrimaryUp: (worldX, worldY) => this.releaseCharge(worldX, worldY),
      onPointerActivity: () => {
        this.pointerSeen = true;
      },
      onWheel: (deltaY) => this.chooseAttackByWheel(deltaY),
    });
    this.keys = bindArenaKeys(this);
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncMarkers, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdownArena, this);
    this.layout();
    this.cpuProfile = readCpuProfile(this.game.registry);
    const matchup = readMatchup(this.game.registry);
    if (matchup) this.spawnFighters(matchup);
  }

  update(_time: number, delta: number) {
    if (this.combat) stepCombat(this, this.combat, delta);
    if (this.outcome !== "ongoing") return;
    if (!this.player || !this.keys || !this.world) return;
    this.tickClock(delta);
    this.applyAttackKeys();
    this.followPointer();
    const move = readMoveAxes(this.keys);
    if (this.combat && Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      if (tryPlayerDash(this, this.combat, this.player, move)) {
        this.cancelCharge(true);
        this.emitHud();
      }
    }
    const charge = this.syncCharge();
    const speed = this.player.fighter.tuning.speed;
    updatePlayer(
      this.player,
      move.x,
      move.y,
      charge ? speed * CHARGE_MOVE_SCALE : speed,
    );
    if (this.combat && this.opponent) {
      updateCpu(
        this,
        this.combat,
        this.opponent,
        this.player,
        this.cpuProfile,
        this.pickups,
      );
    }
    if (this.combat) {
      cullProjectiles(this, this.combat, this.world.width, this.world.height);
    }
    this.stepConsumables();
    this.checkOutcome();
  }

  pauseMatch() {
    if (this.outcome !== "ongoing") return;
    this.cancelCharge(false);
    this.scene.pause();
  }

  private startCharge() {
    if (this.outcome !== "ongoing" || !this.player || !this.combat || this.combat.over) return;
    const player = this.player;
    if (player.attacking || player.hurting || isDashing(player)) return;
    if (!canAttack(this.time.now, player.readyAt[this.combat.kind])) return;
    this.chargeStartedAt = this.time.now;
    this.chargeShown = 0;
    this.chargeCycle += 1;
    this.emitHud();
  }

  private releaseCharge(worldX: number, worldY: number) {
    if (this.chargeStartedAt === null) return;
    const level = chargeLevel(this.time.now - this.chargeStartedAt);
    this.cancelCharge(false);
    if (!this.player || !this.opponent || !this.combat) return;
    if (tryPlayerAttack(this, this.combat, this.player, this.opponent, worldX, worldY, level)) {
      this.emitHud();
    }
  }

  private cancelCharge(feedback: boolean) {
    const wasCharging = this.chargeStartedAt !== null;
    this.chargeStartedAt = null;
    this.chargeShown = 0;
    if (!this.player) return;
    setMarkerCharge(this.player.marker, null);
    if (!wasCharging) return;
    if (feedback) {
      spawnRingWave(this, this.player.marker, { color: 0x8b949e, count: 1, grow: 1.6 });
    }
    this.emitHud();
  }

  private syncCharge() {
    const player = this.player;
    const combat = this.combat;
    if (!player || !combat) return null;
    if (this.chargeStartedAt !== null && (player.hurting || isDashing(player))) {
      this.cancelCharge(true);
    }
    const started = this.chargeStartedAt;
    const charge =
      started === null
        ? null
        : {
            level: chargeLevel(this.time.now - started),
            progress: chargeProgress(this.time.now - started),
          };
    if (charge && charge.level > this.chargeShown) {
      this.chargeShown = charge.level;
      const [label, tone] = CHARGE_BANNER[charge.level as Exclude<ChargeLevel, 0>];
      showBanner(this, combat, label, tone);
      spawnRingWave(this, player.marker, {
        color: player.marker.palette[charge.level === 2 ? "charge2" : "charge1"],
        count: 2 + charge.level,
        grow: 2.6 + charge.level * 0.4,
        width: 3,
      });
      playArenaAudio(this, "appear");
      this.emitHud();
    }
    setMarkerCharge(player.marker, charge);
    return charge;
  }

  private hudCooldown(slot: HudSlot, readyAt: number, durationMs: number) {
    const entry = this.hudCycles[slot];
    if (entry.readyAt !== readyAt) {
      entry.readyAt = readyAt;
      entry.cycle += 1;
    }
    return {
      remainingMs: Math.max(readyAt - this.time.now, 0),
      durationMs,
      cycle: entry.cycle,
    };
  }

  private emitHud() {
    if (!this.player || !this.combat) return;
    const player = this.player;
    const started = this.chargeStartedAt;
    const hud: ArenaHudState = {
      kind: this.combat.kind,
      cooldowns: {
        melee: this.hudCooldown("melee", player.readyAt.melee, COOLDOWN_MS.melee),
        fire: this.hudCooldown("fire", player.readyAt.fire, COOLDOWN_MS.fire),
        dash: this.hudCooldown("dash", player.dashReadyAt, DASH_COOLDOWN_MS),
      },
      charge:
        started === null
          ? null
          : {
              level: chargeLevel(this.time.now - started),
              heldMs: this.time.now - started,
              cycle: this.chargeCycle,
            },
    };
    this.game.registry.set("hud", hud);
    this.game.events.emit(ARENA_EVENTS.hud, hud);
  }

  private chooseKind(kind: AttackKind) {
    if (!this.combat || this.combat.kind === kind) return;
    setCombatKind(this.combat, kind);
    this.emitHud();
  }

  private tickClock(delta: number) {
    const shown = Math.floor(this.elapsedMs / 1000);
    this.elapsedMs += delta;
    if (Math.floor(this.elapsedMs / 1000) !== shown) this.emitSnapshot();
  }

  private emitSnapshot() {
    if (!this.player || !this.opponent) return;
    const snapshot: ArenaSnapshot = {
      player: { hp: this.player.hp, maxHp: this.player.maxHp },
      opponent: { hp: this.opponent.hp, maxHp: this.opponent.maxHp },
      elapsedSeconds: Math.floor(this.elapsedMs / 1000),
    };
    this.game.registry.set("snapshot", snapshot);
    this.game.events.emit(ARENA_EVENTS.snapshot, snapshot);
  }

  resumeMatch() {
    this.scene.resume();
  }

  restartMatch() {
    this.scene.restart();
  }

  private stepConsumables() {
    const { player, opponent, combat } = this;
    if (!player || !opponent || !combat || combat.over) return;
    const now = this.time.now;
    if (now >= this.nextPickupAt) this.dropPickup();
    stepPickups(this, this.pickups, [player, opponent], (fighter, look) =>
      this.consumePickup(fighter, look),
    );
  }

  private dropPickup() {
    const { player, opponent, combat } = this;
    if (!player || !opponent || !combat) return;
    const now = this.time.now;
    if (this.pickups.length >= PICKUP_MAX_ON_MAP) {
      this.nextPickupAt = now + pickupDelay(Math.random);
      return;
    }
    const bounds = this.physics.world.bounds;
    const spot = pickupSpot(Math.random, bounds, blockRects(combat), [
      playerAnchor(player),
      playerAnchor(opponent),
    ]);
    if (!spot) {
      this.nextPickupAt = now + PICKUP_RETRY_MS;
      return;
    }
    spawnPickup(this, this.pickups, spot, rollPickup(Math.random));
    this.nextPickupAt = now + pickupDelay(Math.random);
  }

  private consumePickup(fighter: Player, look: PickupLook) {
    if (!this.combat) return;
    const now = this.time.now;
    const effect = revealPickup(look, Math.random);
    const spec = PICKUP_EFFECTS[effect];
    let text = spec.label;
    if (effect === "heal") {
      const before = fighter.hp;
      setPlayerHp(fighter, fighter.hp + healAmount(fighter.maxHp));
      text = `+${fighter.hp - before} HP`;
      this.combat.onHpChange();
    } else {
      fighter.buffs = addBuff(fighter.buffs, effect, now);
    }
    if (effect === "rapid") {
      // Recarga em andamento acaba na hora.
      fighter.readyAt = { melee: now, fire: now };
      fighter.dashReadyAt = now;
      if (fighter === this.player) this.emitHud();
    }
    spawnPickupLabel(
      this,
      this.combat.numbers,
      fighter.sprite.x,
      fighter.sprite.y - PICKUP_LABEL_OFFSET_Y,
      text,
      spec.color,
      look === "mystery" ? "MISTÉRIO!" : undefined,
    );
    spawnRingWave(this, fighter.marker, { color: lookColor(effect), count: 2, grow: 2.6, width: 3 });
    playArenaAudio(this, "appear");
  }

  private checkOutcome() {
    if (!this.player || !this.opponent) return;
    const outcome = resolveOutcome(this.player.hp, this.opponent.hp);
    if (outcome === "ongoing") return;
    this.finishMatch(outcome);
  }

  private finishMatch(outcome: ArenaOutcome) {
    this.outcome = outcome;
    this.cancelCharge(false);
    if (this.combat) {
      this.combat.over = true;
      clearCombatAim(this.combat);
      showBanner(this, this.combat, "K.O.!", "ko");
    }
    clearPickups(this, this.pickups);
    for (const fighter of [this.player, this.opponent]) {
      if (!fighter) continue;
      haltPlayer(fighter);
      fighter.buffs = [];
      clearBuffAura(fighter);
    }
    const loser = outcome === "victory" ? this.opponent : this.player;
    loser?.sprite.setAlpha(DEFEATED_ALPHA);
    if (loser) setMarkerDead(loser.marker);
    this.time.delayedCall(OUTCOME_DELAY_MS, () => {
      this.game.events.emit(ARENA_EVENTS.outcome, outcome);
    });
  }

  private applyAttackKeys() {
    if (!this.combat || !this.keys) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) {
      this.chooseKind(selectAttack(this.combat.kind, { key: "1" }));
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) {
      this.chooseKind(selectAttack(this.combat.kind, { key: "2" }));
    }
  }

  private chooseAttackByWheel(deltaY: number) {
    if (!this.combat) return;
    this.chooseKind(selectAttack(this.combat.kind, { wheel: deltaY }));
  }

  private followPointer() {
    if (!this.player || !this.combat) return;
    if (!this.pointerSeen) {
      clearCombatAim(this.combat);
      return;
    }
    const pointer = this.input.activePointer;
    const origin = playerAnchor(this.player);
    if (!this.player.attacking && !this.player.hurting && !isDashing(this.player)) {
      const dx = pointer.worldX - origin.x;
      const dy = pointer.worldY - origin.y;
      if (dx !== 0 || dy !== 0) {
        this.player.facing = facingFromAim(dx, dy, this.player.facing);
      }
    }
    syncCombatAim(this.combat, origin.x, origin.y, pointer.worldX, pointer.worldY);
  }

  private syncMarkers() {
    for (const fighter of [this.player, this.opponent]) {
      if (!fighter) continue;
      syncPlayerMarker(fighter);
      syncBuffAura(this, fighter);
    }
  }

  private layout() {
    if (!this.world) return;
    // Caixas usam coordenadas absolutas: no resize somem e voltam a cair.
    clearPickups(this, this.pickups);
    this.anchors = layoutArena(this, this.world, this.anchors, this.player, this.opponent);
    if (this.combat) layoutCombat(this, this.combat);
  }

  private spawnFighters(matchup: ArenaMatchup) {
    const world = this.world;
    if (!world) return;
    const bounds = this.physics.world.bounds;
    const spawn = spawnPoints(bounds);
    registerCharacterAnimations(this, matchup.player);
    registerCharacterAnimations(this, matchup.opponent);
    this.player = createPlayer(this, spawn.player.x, spawn.player.y, matchup.player, "east");
    this.opponent = createPlayer(
      this,
      spawn.opponent.x,
      spawn.opponent.y,
      matchup.opponent,
      "west",
      "opponent",
      matchup.player.id === matchup.opponent.id,
    );
    if (world.width > 0 && world.height > 0) {
      this.anchors = {
        playerX: this.player.sprite.x / world.width,
        playerY: this.player.sprite.y / world.height,
        opponentX: this.opponent.sprite.x / world.width,
        opponentY: this.opponent.sprite.y / world.height,
      };
    }
    const solids = world.obstacles.map((obstacle) => obstacle.body);
    this.physics.add.collider(this.player.sprite, solids);
    this.physics.add.collider(this.opponent.sprite, solids);
    this.physics.add.collider(this.player.sprite, this.opponent.sprite);
    this.combat = createCombat(this, this.player, this.opponent, world.obstacles, () => this.emitSnapshot());
    this.nextPickupAt = this.time.now + pickupDelay(Math.random);
    this.emitSnapshot();
    this.emitHud();
    this.cameras.main.startFollow(this.player.sprite);
    this.cameras.main.centerOn(this.player.sprite.x, this.player.sprite.y);
    playArenaAudio(this, "appear");
  }

  private shutdownArena() {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.releaseInput?.();
    this.releaseInput = null;
    this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncMarkers, this);
    if (this.combat) destroyCombat(this, this.combat);
    this.combat = null;
    if (this.world) destroyObstacles(this, this.world.obstacles);
    clearPickups(this, this.pickups);
    for (const fighter of [this.player, this.opponent]) {
      if (!fighter) continue;
      clearMarkerFx(this, fighter.marker);
      clearBuffAura(fighter);
    }
    this.game.registry.remove("snapshot");
    this.game.registry.remove("hud");
  }
}

export { ArenaScene };
