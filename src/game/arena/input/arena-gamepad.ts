import {
  applyDeadzone,
  clampMove,
  PAD_BUTTON,
  TRIGGER_PRESS,
  type PadButton,
} from "@/lib/arena/gamepad";
import type { MoveVector } from "@/lib/arena/movement";

type PadFrame = {
  move: MoveVector;
  aim: MoveVector;
  down: ReadonlySet<PadButton>;
  pressed: ReadonlySet<PadButton>;
  released: ReadonlySet<PadButton>;
  // Algo foi mexido neste frame (stick fora da zona morta ou botão segurado).
  active: boolean;
};

const PAD_BUTTONS = Object.keys(PAD_BUTTON) as PadButton[];

const IDLE_FRAME: PadFrame = {
  move: { x: 0, y: 0 },
  aim: { x: 0, y: 0 },
  down: new Set(),
  pressed: new Set(),
  released: new Set(),
  active: false,
};

function firstPad() {
  if (typeof navigator === "undefined" || !navigator.getGamepads) return null;
  for (const pad of navigator.getGamepads()) {
    if (pad?.connected) return pad;
  }
  return null;
}

function buttonDown(pad: Gamepad, button: PadButton) {
  const state = pad.buttons[PAD_BUTTON[button]];
  if (!state) return false;
  return state.pressed || state.value > TRIGGER_PRESS;
}

function axis(negative: boolean, positive: boolean) {
  if (negative === positive) return 0;
  return positive ? 1 : -1;
}

// Lê o primeiro controle conectado; borda de botão comparando com o frame anterior.
function pollArenaPad(previous: PadFrame): PadFrame {
  const pad = firstPad();
  if (!pad) {
    if (previous.down.size === 0) return IDLE_FRAME;
    return { ...IDLE_FRAME, released: previous.down };
  }
  const down = new Set(PAD_BUTTONS.filter((button) => buttonDown(pad, button)));
  const stick = applyDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
  const move = clampMove(
    stick.x + axis(down.has("left"), down.has("right")),
    stick.y + axis(down.has("up"), down.has("down")),
  );
  const aim = applyDeadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0);
  return {
    move,
    aim,
    down,
    pressed: new Set([...down].filter((button) => !previous.down.has(button))),
    released: new Set([...previous.down].filter((button) => !down.has(button))),
    active: down.size > 0 || move.x !== 0 || move.y !== 0 || aim.x !== 0 || aim.y !== 0,
  };
}

// Estado atual sem bordas: botão já segurado (o A que confirmou o menu) não vale como aperto.
function settledPad(): PadFrame {
  return { ...pollArenaPad(IDLE_FRAME), pressed: new Set() };
}

// Start é lido fora da cena: com o jogo pausado o `update` do Phaser não roda.
function padStartDown() {
  const pad = firstPad();
  return pad ? buttonDown(pad, "start") : false;
}

export { IDLE_FRAME, padStartDown, pollArenaPad, settledPad };
export type { PadFrame };
