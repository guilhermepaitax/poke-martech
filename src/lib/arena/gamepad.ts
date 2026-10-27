import type { AttackKind, Point } from "./combat";
import type { MoveVector } from "./movement";

// Controle no layout padrão do navegador (W3C "standard"): A/B/X/Y nos índices
// 0..3, ombros 4..7, Start 9, D-pad 12..15. Eixos 0/1 = analógico esquerdo,
// 2/3 = direito.
const PAD_BUTTON = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  start: 9,
  up: 12,
  down: 13,
  left: 14,
  right: 15,
} as const;

type PadButton = keyof typeof PAD_BUTTON;

type PadAttackButton = "A" | "X" | "Y";

// Um botão por golpe: apertar já escolhe o golpe; segurar carrega igual o clique.
const PAD_ATTACK: Record<PadAttackButton, AttackKind> = {
  A: "melee",
  X: "fire",
  Y: "special",
};

const PAD_ATTACK_BUTTONS: readonly PadAttackButton[] = ["A", "X", "Y"];

const STICK_DEADZONE = 0.2;
const TRIGGER_PRESS = 0.5;

// Zona morta radial; fora dela o módulo volta a ir de 0 a 1 (meio tombo = meia velocidade).
function applyDeadzone(x: number, y: number, dead = STICK_DEADZONE): MoveVector {
  const length = Math.hypot(x, y);
  if (length <= dead) return { x: 0, y: 0 };
  const scaled = Math.min(1, (length - dead) / (1 - dead));
  return { x: (x / length) * scaled, y: (y / length) * scaled };
}

// Limita o módulo a 1 sem esticar vetores menores (analógico parcial anda devagar).
function clampMove(x: number, y: number): MoveVector {
  const length = Math.hypot(x, y);
  if (length <= 1) return { x, y };
  return { x: x / length, y: y / length };
}

// Teclado e controle juntos não somam velocidade.
function mergeMove(keys: MoveVector, pad: MoveVector): MoveVector {
  return clampMove(keys.x + pad.x, keys.y + pad.y);
}

// Analógico direito solto: auto-mira no oponente. Mexido: aponta na direção dele.
function padAimPoint(origin: Point, stick: MoveVector, opponent: Point, distance: number): Point {
  const length = Math.hypot(stick.x, stick.y);
  if (length === 0) return opponent;
  return {
    x: origin.x + (stick.x / length) * distance,
    y: origin.y + (stick.y / length) * distance,
  };
}

export {
  applyDeadzone,
  clampMove,
  mergeMove,
  PAD_ATTACK,
  PAD_ATTACK_BUTTONS,
  PAD_BUTTON,
  padAimPoint,
  STICK_DEADZONE,
  TRIGGER_PRESS,
};
export type { PadAttackButton, PadButton };
