"use client";

import { useRef, useState, type PointerEvent } from "react";

const PASS_DISTANCE = 76;

function writeDrag(node: HTMLElement, x: number, y: number, lift: number) {
  const rotate = Math.max(-14, Math.min(14, x * 0.07));
  node.style.setProperty("--drag-x", `${x}px`);
  node.style.setProperty("--drag-y", `${y}px`);
  node.style.setProperty("--drag-rotate", `${rotate}deg`);
  node.style.setProperty("--drag-lift", `${lift}`);
}

function useStackDrag(onPass: () => void, enabled: boolean) {
  const session = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const [armed, setArmed] = useState(false);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!enabled || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    session.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    event.currentTarget.setAttribute("data-dragging", "");
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = session.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    const ready = Math.hypot(x, y) >= PASS_DISTANCE;
    writeDrag(event.currentTarget, x, y, ready ? 0.045 : 0.02);
    event.currentTarget.toggleAttribute("data-drag-ready", ready);
    setArmed((current) => (current === ready ? current : ready));
  }

  function finish(event: PointerEvent<HTMLDivElement>, commit: boolean) {
    const start = session.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    session.current = null;
    event.currentTarget.removeAttribute("data-dragging");
    event.currentTarget.removeAttribute("data-drag-ready");
    setArmed(false);
    if (commit && Math.hypot(x, y) >= PASS_DISTANCE) {
      onPass();
      return;
    }
    writeDrag(event.currentTarget, 0, 0, 0);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    finish(event, true);
  }

  function onPointerCancel(event: PointerEvent<HTMLDivElement>) {
    finish(event, false);
  }

  function onDragStart(event: { preventDefault: () => void }) {
    event.preventDefault();
  }

  return { armed, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onDragStart };
}

export { useStackDrag };
