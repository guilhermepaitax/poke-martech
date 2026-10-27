"use client";

import { pollArenaPad, settledPad, type PadFrame } from "@/game/arena/input/arena-gamepad";
import type { PadButton } from "@/lib/arena/gamepad";
import { menuDirection, nextMenuIndex, type MenuDirection } from "@/lib/arena/menu-nav";
import { useEffect, useRef, type RefObject } from "react";

// Segurar a direção: primeiro passo na hora, depois repete.
const REPEAT_DELAY_MS = 380;
const REPEAT_MS = 140;

type GamepadMenuOptions = {
  enabled?: boolean;
  // Seletor focado no primeiro toque do controle (senão o `autoFocus` ou o primeiro botão).
  initial?: string;
  onBack?: () => void;
  onStart?: () => void;
  onShoulder?: (button: "LB" | "RB") => void;
};

function menuButtons(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>("button:not(:disabled)")].filter(
    (button) => button.getClientRects().length > 0,
  );
}

function focusButton(root: HTMLElement, button: HTMLElement) {
  root.dataset.padNav = "";
  // `focusVisible` ainda não está no tipo do DOM; o CSS de `[data-pad-nav]` cobre quem ignora.
  button.focus({ focusVisible: true } as FocusOptions);
  button.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function initialButton(root: HTMLElement, buttons: HTMLElement[], selector?: string) {
  const preferred = selector ? root.querySelector<HTMLElement>(selector) : null;
  if (preferred && buttons.includes(preferred)) return preferred;
  return buttons.find((button) => button.autofocus) ?? buttons[0] ?? null;
}

// Menus da arena pelo controle: direcional/analógico move o foco entre os botões
// de `root`, A clica, B volta, Start confirma e LB/RB trocam de lado.
function useGamepadMenu(rootRef: RefObject<HTMLElement | null>, options: GamepadMenuOptions = {}) {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });
  const enabled = options.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    let pad: PadFrame = settledPad();
    let held: MenuDirection | null = menuDirection(pad.move);
    let repeatAt = Infinity;

    const move = (root: HTMLElement, direction: MenuDirection) => {
      const buttons = menuButtons(root);
      const active = document.activeElement;
      const current = buttons.findIndex((button) => button === active);
      if (current < 0) {
        const first = initialButton(root, buttons, optionsRef.current.initial);
        if (first) focusButton(root, first);
        return;
      }
      const next = nextMenuIndex(
        buttons.map((button) => button.getBoundingClientRect()),
        current,
        direction,
      );
      const target = next === null ? null : buttons[next];
      if (target) focusButton(root, target);
    };

    const confirm = (root: HTMLElement) => {
      const active = document.activeElement;
      const buttons = menuButtons(root);
      const current = buttons.find((button) => button === active);
      if (current) {
        current.click();
        return;
      }
      const first = initialButton(root, buttons, optionsRef.current.initial);
      if (first) focusButton(root, first);
    };

    const pressed = (button: PadButton) => pad.pressed.has(button);

    let frame = requestAnimationFrame(function poll(now) {
      frame = requestAnimationFrame(poll);
      pad = pollArenaPad(pad);
      const root = rootRef.current;
      if (!root) return;
      const direction = menuDirection(pad.move);
      if (direction !== held) {
        held = direction;
        repeatAt = now + REPEAT_DELAY_MS;
        if (direction) move(root, direction);
      } else if (direction && now >= repeatAt) {
        repeatAt = now + REPEAT_MS;
        move(root, direction);
      }
      const { onBack, onStart, onShoulder } = optionsRef.current;
      if (pressed("A")) confirm(root);
      if (pressed("B")) onBack?.();
      if (pressed("start")) onStart?.();
      if (pressed("LB")) onShoulder?.("LB");
      if (pressed("RB")) onShoulder?.("RB");
    });

    // Voltou a usar o mouse: some o realce do foco do controle.
    const root = rootRef.current;
    const clearPadNav = () => {
      if (root) delete root.dataset.padNav;
    };
    root?.addEventListener("pointerdown", clearPadNav);
    return () => {
      cancelAnimationFrame(frame);
      root?.removeEventListener("pointerdown", clearPadNav);
    };
  }, [enabled, rootRef]);
}

export { useGamepadMenu };
