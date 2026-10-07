import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef } from "react";

function clampPlacement(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function useCardPlacement(
  x: number,
  y: number,
  onChange: (position: { x: number; y: number }) => void,
) {
  const origin = useRef<{
    px: number;
    py: number;
    x: number;
    y: number;
  } | null>(null);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    origin.current = { px: event.clientX, py: event.clientY, x, y };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = origin.current;
    if (!start || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const width = event.currentTarget.clientWidth || 1;
    const height = event.currentTarget.clientHeight || 1;
    const dx = ((event.clientX - start.px) / width) * 100;
    const dy = ((event.clientY - start.py) / height) * 100;
    onChange({
      x: clampPlacement(start.x - dx),
      y: clampPlacement(start.y - dy),
    });
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    origin.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return { onPointerDown, onPointerMove, onPointerUp };
}

export { useCardPlacement };
