import { registerCharacterAnimations } from "@/game/arena/animations/character";
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
  tryPlayerAttack,
  type Combat,
} from "@/game/arena/entities/combat";
import { createFxTextures } from "@/game/arena/entities/fx-textures";
import {
  createPlayer,
  playerAnchor,
  syncPlayerMarker,
  updatePlayer,
  type Player,
} from "@/game/arena/entities/player";
import { bindArenaKeys, bindArenaPointer, readMoveAxes, type ArenaKeys } from "@/game/arena/input/arena-input";
import {
  createArenaWorld,
  layoutArena,
  opponentSpawnPoint,
  type ArenaWorld,
  type FighterAnchors,
} from "@/game/arena/world/layout";
import { selectAttack } from "@/lib/arena/combat";
import type { ArenaMatchup } from "@/lib/arena/fighter";
import { facingFromAim } from "@/lib/arena/movement";
import Phaser from "phaser";

const BLOCK_COLORS = ["--energy-metal", "--energy-fighting"] as const;
const BLOCK_FALLBACKS = [0x7e95a8, 0xc46a32] as const;

function readMatchup(registry: Phaser.Data.DataManager): ArenaMatchup | null {
  const value: unknown = registry.get("matchup");
  if (!value || typeof value !== "object") return null;
  if (!("player" in value) || !("opponent" in value)) return null;
  return value as ArenaMatchup;
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
    const matchup = readMatchup(this.game.registry);
    if (matchup) this.spawnFighters(matchup);
  }

  update() {
    if (!this.player || !this.keys || !this.world) return;
    this.applyAttackKeys();
    this.followPointer();
    const move = readMoveAxes(this.keys);
    updatePlayer(this.player, move.x, move.y);
    if (this.combat) {
      cullProjectiles(this, this.combat, this.world.width, this.world.height);
    }
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
    if (!this.player.attacking && !this.player.hurting) {
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
    this.player = createPlayer(this, bounds.centerX, bounds.centerY, matchup.player);
    const stand = opponentSpawnPoint(bounds);
    this.opponent = createPlayer(this, stand.x, stand.y, matchup.opponent, "west");
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
