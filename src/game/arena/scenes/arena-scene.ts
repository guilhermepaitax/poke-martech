import { registerCharacterAnimations } from "@/game/arena/animations/character";
import { ARENA_EVENTS } from "@/game/arena/arena-events";
import { preloadArenaAssets } from "@/game/arena/assets/catalog";
import { playArenaAudio } from "@/game/arena/entities/audio";
import { clearBuffAura, syncBuffAura } from "@/game/arena/entities/buff-aura";
import { clearPoisonFx, syncPoisonFx } from "@/game/arena/entities/poison-fx";
import {
  blockRects,
  canCastSpecial,
  clearCombatAim,
  createCombat,
  cullProjectiles,
  destroyCombat,
  layoutCombat,
  setCombatKind,
  showBanner,
  stepCombat,
  syncCombatAim,
  tryAttack,
  tryPlayerAttack,
  tryPlayerDash,
  type AttackTuning,
  type BlockEvent,
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
import { stepMapProps } from "@/game/arena/entities/map-props";
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
  endChannel,
  isChanneling,
  isDashing,
  isStunned,
  playerAnchor,
  setDefending,
  setPlayerHp,
  syncPlayerMarker,
  updatePlayer,
  type Player,
} from "@/game/arena/entities/player";
import { clearShieldFx, syncShieldFx } from "@/game/arena/entities/shield-fx";
import { stepWaterFx, syncFighterWater } from "@/game/arena/entities/water-fx";
import { IDLE_FRAME, pollArenaPad, settledPad, type PadFrame } from "@/game/arena/input/arena-gamepad";
import { bindArenaKeys, bindArenaPointer, readMoveAxes, type ArenaKeys } from "@/game/arena/input/arena-input";
import {
  createArenaWorld,
  destroyArenaWorld,
  layoutArena,
  mapSpawn,
  worldIsWater,
  type ArenaWorld,
  type FighterAnchors,
} from "@/game/arena/world/layout";
import { canAttack, COOLDOWN_MS, selectAttack, type AttackKind } from "@/lib/arena/combat";
import {
  mergeMove,
  PAD_ATTACK,
  PAD_ATTACK_BUTTONS,
  padAimPoint,
  type PadAttackButton,
} from "@/lib/arena/gamepad";
import { chargeLevel, chargeProgress, type ChargeLevel } from "@/lib/arena/charge";
import {
  CPU_PROFILES,
  DEFAULT_DIFFICULTY,
  isArenaDifficulty,
  type CpuProfile,
} from "@/lib/arena/cpu";
import { GUARD_BREAK_MS, GUARD_MAX, regenGuard } from "@/lib/arena/defense";
import { parseDevSettings, type ArenaDevAction, type ArenaDevSettings } from "@/lib/arena/dev-settings";
import type { ArenaMatchup, SpecialStyle } from "@/lib/arena/fighter";
import type { ArenaMap } from "@/lib/arena/map";
import { DEFAULT_MAP } from "@/lib/arena/maps";
import { buildNavGrid, type NavGrid } from "@/lib/arena/navigation";
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
import type { ArenaDevice, ArenaHudState, ArenaSnapshot, HudSlot } from "@/lib/arena/snapshot";
import { aimPower, aimReach } from "@/lib/arena/aim";
import { FIRE_TORNADO_MS, SPECIAL_AIM, SPECIAL_MAX, specialRatio, specialReady } from "@/lib/arena/special";
import { spawnPoints } from "@/lib/arena/spawn";
import { blockedRects, canEnter, terrainScale, toWorldRect } from "@/lib/arena/terrain";
import { isArenaMode, type ArenaMode, type TutorialAction } from "@/lib/arena/tutorial";
import Phaser from "phaser";

const DEFEATED_ALPHA = 0.45;
const CHARGE_MOVE_SCALE = 0.55;
// Analógico direito mexido: distância do ponto mirado (sem especial de alcance).
const PAD_AIM_DISTANCE = 180;
const OUTCOME_DELAY_MS = 1100;
const PICKUP_LABEL_OFFSET_Y = 84;
const PICKUP_RETRY_MS = 1000;
// Treino: tempo andando que conta como "moveu", intervalo entre avisos de mira,
// HP do boneco que dispara a recarga e raio da caixa em volta do jogador.
const TUTORIAL_MOVE_MS = 700;
const TUTORIAL_AIM_MS = 500;
const TUTORIAL_REFILL_RATIO = 0.3;
const TUTORIAL_PICKUP_REACH = 320;
// Passo de defesa: o boneco atira fraco no jogador a cada intervalo.
const TUTORIAL_DUMMY_SHOT_MS = 1800;
const TUTORIAL_DUMMY_TUNING: AttackTuning = { cooldownScale: 1, damageScale: 0.5 };
// Degraus da barra de guarda no HUD: evita emitir HUD a cada frame da recarga.
const GUARD_HUD_STEPS = 20;
// Degraus do medidor especial no HUD.
const SPECIAL_HUD_STEPS = 20;
const SPECIAL_READY_COLOR = 0x5cf2ff;
// Cor da força na mira de cada especial com mira própria.
const SPECIAL_AIM_TONE: Partial<Record<SpecialStyle, number>> = {
  "toxic-mist": 0x8af03a,
  surf: 0x6cc4ff,
};
const DEFAULT_AIM_TONE = 0xffe08a;
// Recalcula a grade de navegação da CPU (obstáculos quebram durante a luta).
const NAV_REBUILD_MS = 1000;
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

function readMap(registry: Phaser.Data.DataManager): ArenaMap {
  return readMatchup(registry)?.map ?? DEFAULT_MAP;
}

function readCpuProfile(registry: Phaser.Data.DataManager): CpuProfile {
  const value: unknown = registry.get("difficulty");
  return CPU_PROFILES[isArenaDifficulty(value) ? value : DEFAULT_DIFFICULTY];
}

function readMode(registry: Phaser.Data.DataManager): ArenaMode {
  const value: unknown = registry.get("mode");
  return isArenaMode(value) ? value : "match";
}

// Ajustes do modo teste; fora dele fica nulo e nada muda na luta.
function readDevSettings(registry: Phaser.Data.DataManager, mode: ArenaMode): ArenaDevSettings | null {
  if (mode !== "test") return null;
  return parseDevSettings(registry.get("devSettings"));
}

function freshCycles(): Record<HudSlot, { readyAt: number; cycle: number }> {
  return {
    melee: { readyAt: 0, cycle: 0 },
    fire: { readyAt: 0, cycle: 0 },
    dash: { readyAt: 0, cycle: 0 },
    defend: { readyAt: 0, cycle: 0 },
    special: { readyAt: 0, cycle: 0 },
  };
}

function specialStep(player: Player) {
  return Math.floor(specialRatio(player.special) * SPECIAL_HUD_STEPS) / SPECIAL_HUD_STEPS;
}

function guardStep(player: Player) {
  return Math.round((player.guard.meter / GUARD_MAX) * GUARD_HUD_STEPS);
}

function guardKey(player: Player) {
  return `${player.defending}-${guardStep(player)}-${player.guard.brokenUntil}`;
}

function freshAnchors(): FighterAnchors {
  return { playerX: 0.5, playerY: 0.5, opponentX: 0.5, opponentY: 0.5 };
}

class ArenaScene extends Phaser.Scene {
  private world: ArenaWorld | null = null;
  private player: Player | null = null;
  private opponent: Player | null = null;
  private combat: Combat | null = null;
  // Quem manda na mira: o mouse ou o controle (o último mexido). Nulo até mexer.
  private aimSource: ArenaDevice | null = null;
  private keys: ArenaKeys | null = null;
  private pad: PadFrame = IDLE_FRAME;
  // Botão do controle que começou a carga atual; soltar ele dispara.
  private padAttack: PadAttackButton | null = null;
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
  private mode: ArenaMode = "match";
  private movedMs = 0;
  private aimReportedAt = -Infinity;
  private lastFiredKind: AttackKind = "melee";
  private opponentHp = 0;
  private tutorialPickup = false;
  private dummyAttacks = false;
  private nextDummyShotAt = 0;
  private guardShown = "";
  private specialShown = false;
  // Clique segurado enchendo a força da mira do especial.
  private aimPowerStartedAt: number | null = null;
  private nav: NavGrid | null = null;
  private navBuiltAt = -Infinity;
  private waterShown = false;
  private dev: ArenaDevSettings | null = null;

  constructor() {
    super("arena");
  }

  init() {
    this.world = null;
    this.player = null;
    this.opponent = null;
    this.combat = null;
    this.aimSource = null;
    this.keys = null;
    this.pad = IDLE_FRAME;
    this.padAttack = null;
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
    this.mode = "match";
    this.movedMs = 0;
    this.aimReportedAt = -Infinity;
    this.lastFiredKind = "melee";
    this.opponentHp = 0;
    this.tutorialPickup = false;
    this.dummyAttacks = false;
    this.nextDummyShotAt = 0;
    this.guardShown = "";
    this.specialShown = false;
    this.aimPowerStartedAt = null;
    this.nav = null;
    this.navBuiltAt = -Infinity;
    this.waterShown = false;
    this.dev = null;
  }

  preload() {
    const matchup = readMatchup(this.game.registry);
    preloadArenaAssets(this, matchup ? [matchup.player, matchup.opponent] : [], readMap(this.game.registry));
  }

  create() {
    createFxTextures(this);
    this.world = createArenaWorld(this, readMap(this.game.registry));
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.releaseInput = bindArenaPointer(this, {
      onPrimaryDown: (worldX, worldY) => this.startCharge(worldX, worldY),
      onPrimaryUp: (worldX, worldY) => this.releaseCharge(worldX, worldY),
      onPointerActivity: () => {
        this.setAimSource("pointer");
        this.reportAim();
      },
      onWheel: (deltaY) => this.chooseAttackByWheel(deltaY),
    });
    this.keys = bindArenaKeys(this);
    // O A que confirmou "Lutar" ainda pode estar segurado: não vira golpe.
    this.pad = settledPad();
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncMarkers, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdownArena, this);
    this.layout();
    this.cpuProfile = readCpuProfile(this.game.registry);
    this.mode = readMode(this.game.registry);
    this.dev = readDevSettings(this.game.registry, this.mode);
    const matchup = readMatchup(this.game.registry);
    if (matchup) this.spawnFighters(matchup);
    if (this.dev) this.syncHitboxes();
  }

  update(_time: number, delta: number) {
    if (this.combat) stepCombat(this, this.combat, delta);
    if (this.outcome !== "ongoing") return;
    if (!this.player || !this.keys || !this.world) return;
    this.tickClock(delta);
    this.pollPad();
    this.applyAttackKeys();
    this.followAim();
    this.applyPadAttacks();
    const move = this.readMove();
    this.trackMove(move, delta);
    this.syncDefense(delta);
    this.syncTerrain();
    const dash =
      Phaser.Input.Keyboard.JustDown(this.keys.space) || this.pad.pressed.has("B") || this.pad.pressed.has("RB");
    if (this.combat && dash) {
      if (tryPlayerDash(this, this.combat, this.player, move)) {
        this.cancelCharge(true);
        this.emitHud();
        this.emitTutorial({ type: "dash" });
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
    if (this.mode === "tutorial") {
      // Boneco de treino: fica parado; só atira no passo de defesa.
      if (this.opponent) {
        updatePlayer(this.opponent, 0, 0);
        this.dummyShoot();
      }
    } else if (this.combat && this.opponent) {
      updateCpu(
        this,
        this.combat,
        this.opponent,
        this.player,
        this.cpuProfile,
        this.pickups,
        this.cpuNav(),
        this.dev
          ? { move: this.dev.cpuMoves, attack: this.dev.cpuAttacks, defend: this.dev.cpuDefends }
          : undefined,
      );
    }
    this.applyDevSettings();
    if (this.combat) {
      cullProjectiles(this, this.combat, this.world.width, this.world.height);
    }
    this.stepConsumables();
    this.stepScenery();
    this.checkOutcome();
  }

  // Pés na água: bônus do nadador, espirro/som ao entrar e selo no HUD.
  private syncTerrain() {
    const world = this.world;
    if (!world || world.zones.length === 0) return;
    for (const fighter of [this.player, this.opponent]) {
      if (!fighter) continue;
      const feet = { x: fighter.sprite.x, y: fighter.sprite.y + fighter.fighter.tuning.feetOffsetY };
      const inWater = worldIsWater(world, feet);
      if (world.water) syncFighterWater(this, world.water, fighter, inWater);
      fighter.inWater = inWater;
      fighter.terrain = terrainScale(world.map.water, fighter.fighter.mobility, inWater);
    }
    const boosted = (this.player?.terrain.damage ?? 1) > 1;
    if (boosted !== this.waterShown) {
      this.waterShown = boosted;
      this.emitHud();
    }
  }

  private stepScenery() {
    const world = this.world;
    if (!world) return;
    if (world.water) stepWaterFx(this, world.water);
    if (world.props && this.player && this.opponent) {
      stepMapProps(this, world.props, [this.player, this.opponent]);
    }
  }

  // Grade só existe quando o mapa tem terreno que a CPU não atravessa.
  private cpuNav() {
    const { world, opponent, combat } = this;
    if (!world || !opponent || !combat) return null;
    const blocked = blockedRects(world.zones, world, opponent.fighter.mobility);
    if (blocked.length === 0) return null;
    if (this.nav && this.time.now - this.navBuiltAt < NAV_REBUILD_MS) return this.nav;
    const bounds = this.physics.world.bounds;
    const body = opponent.sprite.body;
    const margin = body ? Math.max(body.width, body.height) / 2 : 24;
    this.nav = buildNavGrid(bounds, [...blocked, ...blockRects(combat)], margin);
    this.navBuiltAt = this.time.now;
    return this.nav;
  }

  // Caixas não nascem em água nem em rocha (nem todo mundo alcança).
  private pickupBlocks() {
    const { world, combat } = this;
    if (!combat) return [];
    const terrain = world ? world.zones.map((zone) => toWorldRect(zone.rect, world)) : [];
    return [...blockRects(combat), ...terrain];
  }

  pauseMatch() {
    if (this.outcome !== "ongoing") return;
    this.cancelCharge(false);
    this.scene.pause();
  }

  // Mira com formato do especial selecionado (cone da Névoa...), se houver.
  private specialAim() {
    if (!this.player || this.combat?.kind !== "special") return null;
    return SPECIAL_AIM[this.player.fighter.special] ?? null;
  }

  private startCharge(worldX: number, worldY: number) {
    if (this.outcome !== "ongoing" || !this.player || !this.combat || this.combat.over) return;
    const player = this.player;
    if (this.combat.kind === "special") {
      // Mira com força: segurar enche a força, soltar dispara. Sem ela, sai no clique.
      if (this.specialAim() && !isChanneling(player)) {
        if (canCastSpecial(this.combat, player, this.opponent ?? player) && !player.attacking && !player.hurting) {
          this.aimPowerStartedAt = this.time.now;
          return;
        }
      }
      this.fireSpecial(worldX, worldY);
      return;
    }
    if (player.attacking || player.hurting || player.defending || isDashing(player)) return;
    if (isChanneling(player)) return;
    if (!canAttack(this.time.now, player.readyAt[this.combat.kind])) return;
    this.chargeStartedAt = this.time.now;
    this.chargeShown = 0;
    this.chargeCycle += 1;
    this.emitHud();
  }

  private releaseCharge(worldX: number, worldY: number) {
    if (this.aimPowerStartedAt !== null) {
      const spec = this.specialAim();
      const power = aimPower(this.time.now - this.aimPowerStartedAt, spec?.powerMs ?? 0);
      this.aimPowerStartedAt = null;
      this.fireSpecial(worldX, worldY, spec ? aimReach(spec, power) : null);
      return;
    }
    if (this.chargeStartedAt === null) return;
    const level = chargeLevel(this.time.now - this.chargeStartedAt);
    this.cancelCharge(false);
    if (!this.player || !this.opponent || !this.combat) return;
    const kind = this.combat.kind;
    if (tryPlayerAttack(this, this.combat, this.player, this.opponent, worldX, worldY, level)) {
      this.lastFiredKind = kind;
      this.emitHud();
      this.emitTutorial({ type: "attack", kind, level });
    }
  }

  private fireSpecial(worldX: number, worldY: number, reach: number | null = null) {
    const { player, opponent, combat } = this;
    if (!player || !opponent || !combat) return;
    // Clicar de novo enquanto guia o furacão encerra antes da hora.
    if (isChanneling(player)) {
      endChannel(player);
      return;
    }
    if (tryPlayerAttack(this, combat, player, opponent, worldX, worldY, 0, reach)) {
      this.lastFiredKind = "special";
      this.emitHud();
      this.emitTutorial({ type: "attack", kind: "special", level: 0 });
      return;
    }
    // Sem medidor (ou alvo fora do alcance do Último Recurso): só o aviso.
    if (!player.attacking && !player.hurting) {
      spawnRingWave(this, player.marker, { color: 0x8b949e, count: 1, grow: 1.6 });
    }
  }

  // Medidor mudou: HUD do jogador, selo nos dois e aviso ao encher.
  private onSpecial(fighter: Player) {
    if (fighter === this.player) {
      if (specialReady(fighter.special) && this.combat && !this.specialShown) {
        showBanner(this, this.combat, "ESPECIAL PRONTO!", "ready");
        playArenaAudio(this, "appear");
      }
      this.emitHud();
    }
    if (specialReady(fighter.special)) {
      spawnRingWave(this, fighter.marker, { color: SPECIAL_READY_COLOR, count: 2, grow: 2.6, width: 3 });
    }
    this.emitSnapshot();
  }

  private cancelCharge(feedback: boolean) {
    this.aimPowerStartedAt = null;
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
    const holding = this.chargeStartedAt !== null || this.aimPowerStartedAt !== null;
    if (holding && (player.hurting || isDashing(player) || isStunned(player))) {
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
    // Guiando o furacão, o anel mostra o tempo que resta como uma carga.
    const channel = isChanneling(player)
      ? { level: 1 as const, progress: Math.max(0, (player.channelUntil - this.time.now) / FIRE_TORNADO_MS) }
      : null;
    setMarkerCharge(player.marker, charge ?? channel);
    return charge;
  }

  // Shift (ou LB/LT) segurado liga a defesa; a guarda dos dois lutadores recarrega aqui.
  private syncDefense(delta: number) {
    const { player, opponent, keys, pad } = this;
    if (!player || !keys) return;
    const now = this.time.now;
    const holding = keys.shift.isDown || pad.down.has("LB") || pad.down.has("LT");
    if (setDefending(player, holding) && player.defending) this.cancelCharge(true);
    for (const fighter of [player, opponent]) {
      if (fighter) fighter.guard = regenGuard(fighter.guard, delta, now);
    }
    if (guardKey(player) !== this.guardShown) this.emitHud();
  }

  private onBlock(event: BlockEvent) {
    if (event.target !== this.player) return;
    this.emitHud();
    if (!event.broke) this.emitTutorial({ type: "block" });
  }

  setTutorialDummyAttacks(on: boolean) {
    if (this.mode !== "tutorial") return;
    this.dummyAttacks = on;
    this.nextDummyShotAt = this.time.now + TUTORIAL_DUMMY_SHOT_MS / 2;
  }

  private dummyShoot() {
    const { player, opponent, combat } = this;
    if (!this.dummyAttacks || !player || !opponent || !combat) return;
    const now = this.time.now;
    if (now < this.nextDummyShotAt) return;
    const dx = player.sprite.x - opponent.sprite.x;
    const dy = player.sprite.y - opponent.sprite.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) return;
    this.nextDummyShotAt = now + TUTORIAL_DUMMY_SHOT_MS;
    tryAttack(this, combat, opponent, player, "fire", { x: dx / length, y: dy / length }, TUTORIAL_DUMMY_TUNING);
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
        defend: this.hudCooldown("defend", player.guard.brokenUntil, GUARD_BREAK_MS),
        special: this.hudCooldown("special", player.readyAt.special, COOLDOWN_MS.special),
      },
      special: { ratio: specialStep(player), ready: specialReady(player.special) },
      guard: {
        ratio: guardStep(player) / GUARD_HUD_STEPS,
        defending: player.defending,
      },
      waterBoost: player.terrain.damage > 1,
      device: this.aimSource ?? "pointer",
      charge:
        started === null
          ? null
          : {
              level: chargeLevel(this.time.now - started),
              heldMs: this.time.now - started,
              cycle: this.chargeCycle,
            },
    };
    this.guardShown = guardKey(player);
    this.specialShown = specialReady(player.special);
    this.game.registry.set("hud", hud);
    this.game.events.emit(ARENA_EVENTS.hud, hud);
  }

  private chooseKind(kind: AttackKind) {
    if (!this.combat || this.combat.kind === kind) return;
    setCombatKind(this.combat, kind);
    this.emitHud();
    this.emitTutorial({ type: "select", kind });
  }

  spawnTutorialPickup() {
    if (this.mode !== "tutorial") return;
    this.tutorialPickup = true;
    this.nextPickupAt = 0;
  }

  private emitTutorial(action: TutorialAction) {
    if (this.mode !== "tutorial") return;
    this.game.events.emit(ARENA_EVENTS.tutorial, action);
  }

  private trackMove(move: { x: number; y: number }, delta: number) {
    if (this.mode !== "tutorial" || (move.x === 0 && move.y === 0)) return;
    this.movedMs += delta;
    if (this.movedMs < TUTORIAL_MOVE_MS) return;
    this.movedMs = 0;
    this.emitTutorial({ type: "move" });
  }

  private reportAim() {
    if (this.mode !== "tutorial") return;
    const now = this.time.now;
    if (now - this.aimReportedAt < TUTORIAL_AIM_MS) return;
    this.aimReportedAt = now;
    this.emitTutorial({ type: "aim" });
  }

  private onHpChange() {
    const { opponent, player } = this;
    if (this.mode === "tutorial" && opponent) {
      if (opponent.hp < this.opponentHp) this.emitTutorial({ type: "hit", kind: this.lastFiredKind });
      if (opponent.hp < opponent.maxHp * TUTORIAL_REFILL_RATIO) setPlayerHp(opponent, opponent.maxHp);
      this.opponentHp = opponent.hp;
    }
    // No treino o jogador também não morre: os tiros do boneco só ensinam.
    if (this.mode === "tutorial" && player && player.hp < player.maxHp * TUTORIAL_REFILL_RATIO) {
      setPlayerHp(player, player.maxHp);
    }
    if (this.dev) this.refillInvincible(this.dev);
    this.emitSnapshot();
  }

  private tickClock(delta: number) {
    const shown = Math.floor(this.elapsedMs / 1000);
    this.elapsedMs += delta;
    if (Math.floor(this.elapsedMs / 1000) !== shown) this.emitSnapshot();
  }

  private emitSnapshot() {
    if (!this.player || !this.opponent) return;
    const snapshot: ArenaSnapshot = {
      player: {
        hp: this.player.hp,
        maxHp: this.player.maxHp,
        special: specialStep(this.player),
        poisoned: this.player.poison !== null,
      },
      opponent: {
        hp: this.opponent.hp,
        maxHp: this.opponent.maxHp,
        special: specialStep(this.opponent),
        poisoned: this.opponent.poison !== null,
      },
      elapsedSeconds: Math.floor(this.elapsedMs / 1000),
    };
    this.game.registry.set("snapshot", snapshot);
    this.game.events.emit(ARENA_EVENTS.snapshot, snapshot);
  }

  setDevSettings(settings: ArenaDevSettings) {
    if (this.mode !== "test") return;
    this.dev = settings;
    this.game.registry.set("devSettings", settings);
    this.syncHitboxes();
    this.refillInvincible(settings);
    this.emitSnapshot();
  }

  devAction(action: ArenaDevAction) {
    const { player, opponent, combat } = this;
    if (this.mode !== "test" || !player || !opponent || !combat || this.outcome !== "ongoing") return;
    switch (action) {
      case "heal":
        setPlayerHp(player, player.maxHp);
        setPlayerHp(opponent, opponent.maxHp);
        this.emitSnapshot();
        return;
      case "fill-special":
        for (const fighter of [player, opponent]) this.fillSpecial(fighter);
        return;
      case "drop-pickup":
        this.nextPickupAt = 0;
        this.dropPickup();
        return;
      case "ko-cpu":
        setPlayerHp(opponent, 0);
        this.emitSnapshot();
        return;
    }
  }

  // Modo teste, a cada quadro: especial cheio e recargas zeradas.
  private applyDevSettings() {
    const { dev, player, opponent } = this;
    if (!dev || !player || !opponent) return;
    if (dev.playerSpecialFull) this.fillSpecial(player);
    if (dev.cpuSpecialFull) this.fillSpecial(opponent);
    if (!dev.noCooldowns) return;
    const now = this.time.now;
    const { readyAt } = player;
    if (readyAt.melee <= now && readyAt.fire <= now && readyAt.special <= now && player.dashReadyAt <= now) return;
    player.readyAt = { melee: Math.min(readyAt.melee, now), fire: Math.min(readyAt.fire, now), special: Math.min(readyAt.special, now) };
    player.dashReadyAt = Math.min(player.dashReadyAt, now);
    this.emitHud();
  }

  private fillSpecial(fighter: Player) {
    if (specialReady(fighter.special)) return;
    fighter.special = SPECIAL_MAX;
    fighter.specialFullAt = this.time.now;
    this.onSpecial(fighter);
  }

  private refillInvincible(dev: ArenaDevSettings) {
    const { player, opponent } = this;
    if (dev.playerInvincible && player && player.hp < player.maxHp) setPlayerHp(player, player.maxHp);
    if (dev.cpuInvincible && opponent && opponent.hp < opponent.maxHp) setPlayerHp(opponent, opponent.maxHp);
  }

  private syncHitboxes() {
    const world = this.physics.world;
    const on = this.dev?.hitboxes ?? false;
    if (on && !world.debugGraphic) world.createDebugGraphic();
    world.drawDebug = on;
    world.debugGraphic?.clear();
  }

  resumeMatch() {
    // Mesmo caso do A que clicou "Continuar" no menu de pausa.
    this.pad = settledPad();
    this.padAttack = null;
    this.scene.resume();
  }

  restartMatch() {
    this.scene.restart();
  }

  private stepConsumables() {
    const { player, opponent, combat } = this;
    if (!player || !opponent || !combat || combat.over) return;
    const now = this.time.now;
    if (this.mode === "tutorial") {
      if (this.tutorialPickup && this.pickups.length === 0 && now >= this.nextPickupAt) {
        this.dropTutorialPickup();
      }
    } else if (now >= this.nextPickupAt && (this.dev?.pickups ?? true)) {
      this.dropPickup();
    }
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
    const spot = pickupSpot(Math.random, bounds, this.pickupBlocks(), [
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

  // Caixa do treino cai perto do jogador; some no resize e volta a cair.
  private dropTutorialPickup() {
    const { player, opponent, combat } = this;
    if (!player || !opponent || !combat) return;
    const world = this.physics.world.bounds;
    const origin = playerAnchor(player);
    const near = {
      left: Math.max(world.left, origin.x - TUTORIAL_PICKUP_REACH),
      top: Math.max(world.top, origin.y - TUTORIAL_PICKUP_REACH),
      right: Math.min(world.right, origin.x + TUTORIAL_PICKUP_REACH),
      bottom: Math.min(world.bottom, origin.y + TUTORIAL_PICKUP_REACH),
    };
    const avoid = [origin, playerAnchor(opponent)];
    const spot =
      pickupSpot(Math.random, near, this.pickupBlocks(), avoid) ??
      pickupSpot(Math.random, world, this.pickupBlocks(), avoid);
    if (!spot) {
      this.nextPickupAt = this.time.now + PICKUP_RETRY_MS;
      return;
    }
    spawnPickup(this, this.pickups, spot, "haste");
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
      fighter.readyAt = { melee: now, fire: now, special: now };
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
    if (fighter === this.player && this.tutorialPickup) {
      this.tutorialPickup = false;
      this.emitTutorial({ type: "pickup" });
    }
  }

  private checkOutcome() {
    if (this.mode === "tutorial" || !this.player || !this.opponent) return;
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
      fighter.poison = null;
      fighter.channelUntil = 0;
      fighter.defending = false;
      clearBuffAura(fighter);
      clearPoisonFx(fighter);
      clearShieldFx(fighter);
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
    if (Phaser.Input.Keyboard.JustDown(this.keys.three)) {
      this.chooseKind(selectAttack(this.combat.kind, { key: "3" }));
    }
  }

  private chooseAttackByWheel(deltaY: number) {
    if (!this.combat) return;
    this.chooseKind(selectAttack(this.combat.kind, { wheel: deltaY }));
  }

  private pollPad() {
    this.pad = pollArenaPad(this.pad);
    if (!this.pad.active) return;
    this.setAimSource("pad");
    if (this.pad.aim.x !== 0 || this.pad.aim.y !== 0) this.reportAim();
  }

  private readMove() {
    return this.keys ? mergeMove(readMoveAxes(this.keys), this.pad.move) : this.pad.move;
  }

  private setAimSource(source: ArenaDevice) {
    if (this.aimSource === source) return;
    this.aimSource = source;
    this.emitHud();
  }

  // Ponto mirado no mundo: o mouse, ou o analógico direito (solto = auto-mira no oponente).
  private aimTarget() {
    if (!this.player || this.aimSource === null) return null;
    if (this.aimSource === "pointer") {
      const pointer = this.input.activePointer;
      return { x: pointer.worldX, y: pointer.worldY };
    }
    const origin = playerAnchor(this.player);
    const opponent = this.opponent ? playerAnchor(this.opponent) : origin;
    const distance = this.specialAim()?.range ?? PAD_AIM_DISTANCE;
    return padAimPoint(origin, this.pad.aim, opponent, distance);
  }

  // Um botão por golpe: apertar escolhe e começa a carga; soltar o mesmo botão dispara.
  private applyPadAttacks() {
    if (!this.combat) return;
    const target = this.aimTarget();
    if (!target) return;
    const held = this.padAttack;
    if (held && this.pad.released.has(held)) {
      this.padAttack = null;
      this.releaseCharge(target.x, target.y);
      return;
    }
    if (held) return;
    const button = PAD_ATTACK_BUTTONS.find((candidate) => this.pad.pressed.has(candidate));
    if (!button) return;
    this.chooseKind(PAD_ATTACK[button]);
    this.followAim();
    this.padAttack = button;
    this.startCharge(target.x, target.y);
  }

  private followAim() {
    if (!this.player || !this.combat) return;
    const target = this.aimTarget();
    if (!target) {
      clearCombatAim(this.combat);
      return;
    }
    const origin = playerAnchor(this.player);
    if (!this.player.attacking && !this.player.hurting && !isDashing(this.player)) {
      const dx = target.x - origin.x;
      const dy = target.y - origin.y;
      if (dx !== 0 || dy !== 0) {
        this.player.facing = facingFromAim(dx, dy, this.player.facing);
      }
    }
    const spec = this.specialAim();
    // Força só aparece com o clique segurado; trocar de ataque solta a força.
    if (!spec) this.aimPowerStartedAt = null;
    const started = this.aimPowerStartedAt;
    const shape = spec
      ? {
          spec,
          power: started === null ? null : aimPower(this.time.now - started, spec.powerMs),
          tone: SPECIAL_AIM_TONE[this.player.fighter.special] ?? DEFAULT_AIM_TONE,
        }
      : null;
    syncCombatAim(this.combat, origin.x, origin.y, target.x, target.y, shape);
  }

  private syncMarkers() {
    for (const fighter of [this.player, this.opponent]) {
      if (!fighter) continue;
      syncPlayerMarker(fighter);
      syncBuffAura(this, fighter);
      syncPoisonFx(this, fighter);
      syncShieldFx(this, fighter);
    }
  }

  private layout() {
    if (!this.world) return;
    // Caixas usam coordenadas absolutas: no resize somem e voltam a cair.
    clearPickups(this, this.pickups);
    this.anchors = layoutArena(this, this.world, this.anchors, this.player, this.opponent);
    if (this.combat) layoutCombat(this, this.combat);
    this.nav = null;
  }

  private spawnFighters(matchup: ArenaMatchup) {
    const world = this.world;
    if (!world) return;
    const bounds = this.physics.world.bounds;
    const spawn = mapSpawn(world) ?? spawnPoints(bounds);
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
    for (const fighter of [this.player, this.opponent]) {
      // Cada lutador só esbarra no terreno que não alcança (quem nada entra na água).
      const walls = world.terrain
        .filter(({ zone }) => !canEnter(zone.kind, fighter.fighter.mobility))
        .map(({ body }) => body);
      this.physics.add.collider(fighter.sprite, [...solids, ...walls]);
    }
    this.physics.add.collider(this.player.sprite, this.opponent.sprite);
    this.combat = createCombat(
      this,
      this.player,
      this.opponent,
      world.obstacles,
      () => this.onHpChange(),
      (event) => this.onBlock(event),
      (at) => worldIsWater(world, at),
      (fighter) => this.onSpecial(fighter),
    );
    // Guiando o furacão, o WASD (ou analógico) move o furacão (o lutador fica parado).
    this.combat.playerMove = () => this.readMove();
    this.opponentHp = this.opponent.hp;
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
    if (this.world) destroyArenaWorld(this, this.world);
    clearPickups(this, this.pickups);
    for (const fighter of [this.player, this.opponent]) {
      if (!fighter) continue;
      clearMarkerFx(this, fighter.marker);
      clearBuffAura(fighter);
      clearPoisonFx(fighter);
      clearShieldFx(fighter);
    }
    this.game.registry.remove("snapshot");
    this.game.registry.remove("hud");
  }
}

export { ArenaScene };
