import { registerCharacterAnimations } from "@/game/arena/animations/character";
import { ARENA_EVENTS } from "@/game/arena/arena-events";
import { preloadArenaAssets } from "@/game/arena/assets/catalog";
import { cssColorNumber } from "@/game/arena/css-color";
import { playArenaAudio } from "@/game/arena/entities/audio";
import {
  clearCombatAim,
  createCombat,
  cullProjectiles,
  destroyCombat,
  layoutCombat,
  setCombatKind,
  syncCombatAim,
  syncDashHud,
  tryPlayerAttack,
  tryPlayerDash,
  type Combat,
} from "@/game/arena/entities/combat";
import { updateCpu } from "@/game/arena/entities/cpu";
import { createFxTextures } from "@/game/arena/entities/fx-textures";
import {
  createPlayer,
  haltPlayer,
  isDashing,
  playerAnchor,
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
import { selectAttack } from "@/lib/arena/combat";
import {
  CPU_PROFILES,
  DEFAULT_DIFFICULTY,
  isArenaDifficulty,
  type CpuProfile,
} from "@/lib/arena/cpu";
import type { ArenaMatchup } from "@/lib/arena/fighter";
import { facingFromAim } from "@/lib/arena/movement";
import { resolveOutcome, type ArenaOutcome } from "@/lib/arena/outcome";
import { spawnPoints } from "@/lib/arena/spawn";
import Phaser from "phaser";

const BLOCK_COLORS = ["--energy-metal", "--energy-fighting"] as const;
const BLOCK_FALLBACKS = [0x7e95a8, 0xc46a32] as const;
const DEFEATED_ALPHA = 0.45;

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
  }

  preload() {
    preloadArenaAssets(this);
  }

  create() {
    registerCharacterAnimations(this);
    createFxTextures(this);
    this.world = createArenaWorld(
      this,
      BLOCK_COLORS.map((variable, index) =>
        cssColorNumber(variable, BLOCK_FALLBACKS[index] ?? 0xffffff),
      ),
    );
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.releaseInput = bindArenaPointer(this, {
      onPrimaryDown: (worldX, worldY) => this.attackAt(worldX, worldY),
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

  update() {
    if (this.outcome !== "ongoing") return;
    if (!this.player || !this.keys || !this.world) return;
    this.applyAttackKeys();
    this.followPointer();
    const move = readMoveAxes(this.keys);
    if (this.combat && Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      tryPlayerDash(this, this.combat, this.player, move);
    }
    updatePlayer(this.player, move.x, move.y);
    if (this.combat && this.opponent) {
      updateCpu(this, this.combat, this.opponent, this.player, this.cpuProfile);
    }
    if (this.combat) {
      syncDashHud(this, this.combat, this.player);
      cullProjectiles(this, this.combat, this.world.width, this.world.height);
    }
    this.checkOutcome();
  }

  pauseMatch() {
    if (this.outcome !== "ongoing") return;
    this.scene.pause();
  }

  resumeMatch() {
    this.scene.resume();
  }

  restartMatch() {
    this.scene.restart();
  }

  private checkOutcome() {
    if (!this.player || !this.opponent) return;
    const outcome = resolveOutcome(this.player.hp, this.opponent.hp);
    if (outcome === "ongoing") return;
    this.finishMatch(outcome);
  }

  private finishMatch(outcome: ArenaOutcome) {
    this.outcome = outcome;
    if (this.combat) {
      this.combat.over = true;
      clearCombatAim(this.combat);
    }
    if (this.player) haltPlayer(this.player);
    if (this.opponent) haltPlayer(this.opponent);
    const loser = outcome === "victory" ? this.opponent : this.player;
    loser?.sprite.setAlpha(DEFEATED_ALPHA);
    this.game.events.emit(ARENA_EVENTS.outcome, outcome);
  }

  private applyAttackKeys() {
    if (!this.combat || !this.keys) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) {
      setCombatKind(this.combat, selectAttack(this.combat.kind, { key: "1" }));
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) {
      setCombatKind(this.combat, selectAttack(this.combat.kind, { key: "2" }));
    }
  }

  private chooseAttackByWheel(deltaY: number) {
    if (!this.combat) return;
    setCombatKind(this.combat, selectAttack(this.combat.kind, { wheel: deltaY }));
  }

  private attackAt(worldX: number, worldY: number) {
    if (!this.player || !this.opponent || !this.combat) return;
    tryPlayerAttack(this, this.combat, this.player, this.opponent, worldX, worldY);
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
    if (this.player) syncPlayerMarker(this.player);
    if (this.opponent) syncPlayerMarker(this.opponent);
  }

  private layout() {
    if (!this.world) return;
    this.anchors = layoutArena(this, this.world, this.anchors, this.player, this.opponent);
    if (this.combat) layoutCombat(this, this.combat);
  }

  private spawnFighters(matchup: ArenaMatchup) {
    const world = this.world;
    if (!world) return;
    const bounds = this.physics.world.bounds;
    const spawn = spawnPoints(bounds);
    this.player = createPlayer(this, spawn.player.x, spawn.player.y, matchup.player, "east");
    this.opponent = createPlayer(
      this,
      spawn.opponent.x,
      spawn.opponent.y,
      matchup.opponent,
      "west",
    );
    if (world.width > 0 && world.height > 0) {
      this.anchors = {
        playerX: this.player.sprite.x / world.width,
        playerY: this.player.sprite.y / world.height,
        opponentX: this.opponent.sprite.x / world.width,
        opponentY: this.opponent.sprite.y / world.height,
      };
    }
    this.physics.add.collider(this.player.sprite, world.blocks);
    this.physics.add.collider(this.opponent.sprite, world.blocks);
    this.physics.add.collider(this.player.sprite, this.opponent.sprite);
    this.combat = createCombat(this, this.opponent, world.blocks);
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
  }
}

export { ArenaScene };
