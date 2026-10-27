import type { ChargeLevel } from "./charge";
import type { AttackKind } from "./combat";

type FighterSnapshot = {
  hp: number;
  maxHp: number;
  // Medidor do especial, de 0 a 1.
  special: number;
  // Envenenado (Névoa de Veneno).
  poisoned: boolean;
};

type ArenaSnapshot = {
  player: FighterSnapshot;
  opponent: FighterSnapshot;
  // Tempo de luta, em segundos inteiros. Não conta pausa nem o pós-luta.
  elapsedSeconds: number;
};

type HudSlot = AttackKind | "dash" | "defend";

type HudSpecial = {
  // Medidor do especial, de 0 a 1 (em degraus).
  ratio: number;
  ready: boolean;
};

type HudCooldown = {
  remainingMs: number;
  durationMs: number;
  cycle: number;
};

type HudCharge = {
  level: ChargeLevel;
  heldMs: number;
  cycle: number;
};

type HudGuard = {
  // Guarda restante, de 0 a 1.
  ratio: number;
  defending: boolean;
};

type ArenaHudState = {
  kind: AttackKind;
  cooldowns: Record<HudSlot, HudCooldown>;
  charge: HudCharge | null;
  guard: HudGuard;
  special: HudSpecial;
  // Nadador dentro da água: mais rápido e com mais dano.
  waterBoost: boolean;
  // Último input usado: troca os rótulos das teclas no HUD e no tutorial.
  device: ArenaDevice;
};

type ArenaDevice = "pointer" | "pad";

export type {
  ArenaDevice,
  ArenaHudState,
  ArenaSnapshot,
  FighterSnapshot,
  HudCharge,
  HudCooldown,
  HudGuard,
  HudSlot,
  HudSpecial,
};
