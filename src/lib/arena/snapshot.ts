import type { ChargeLevel } from "./charge";
import type { AttackKind } from "./combat";

type FighterSnapshot = {
  hp: number;
  maxHp: number;
};

type ArenaSnapshot = {
  player: FighterSnapshot;
  opponent: FighterSnapshot;
  // Tempo de luta, em segundos inteiros. Não conta pausa nem o pós-luta.
  elapsedSeconds: number;
};

type HudSlot = AttackKind | "dash" | "defend";

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
  // Nadador dentro da água: mais rápido e com mais dano.
  waterBoost: boolean;
};

export type {
  ArenaHudState,
  ArenaSnapshot,
  FighterSnapshot,
  HudCharge,
  HudCooldown,
  HudGuard,
  HudSlot,
};
