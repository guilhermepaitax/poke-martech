"use client";

import { useEffect, useRef } from "react";

type TiltPose = {
  rx: number;
  ry: number;
  px: number;
  py: number;
  active: number;
};

const REST: TiltPose = { rx: 0, ry: 0, px: 50, py: 50, active: 0 };

const CARD_EDGE = 0.15;

const TILT_VARS = [
  "--rotate-x",
  "--rotate-y",
  "--pointer-x",
  "--pointer-y",
  "--pointer-from-left",
  "--pointer-from-top",
  "--pointer-from-center",
  "--background-x",
  "--background-y",
  "--holo-angle",
  "--glare-x",
  "--glare-y",
  "--tilt-active",
] as const;

function poseVars(pose: TiltPose): Record<(typeof TILT_VARS)[number], string> {
  const fromLeft = pose.px / 100;
  const fromTop = pose.py / 100;
  const fromCenter = Math.min(1, Math.hypot(pose.px - 50, pose.py - 50) / 50);
  return {
    "--rotate-x": `${pose.rx}deg`,
    "--rotate-y": `${pose.ry}deg`,
    "--pointer-x": `${pose.px}%`,
    "--pointer-y": `${pose.py}%`,
    "--pointer-from-left": `${fromLeft}`,
    "--pointer-from-top": `${fromTop}`,
    "--pointer-from-center": `${fromCenter * pose.active}`,
    "--background-x": `${37 + fromLeft * 26}%`,
    "--background-y": `${33 + fromTop * 34}%`,
    "--holo-angle": `${120 + pose.ry * 8}deg`,
    "--glare-x": `${pose.px}%`,
    "--glare-y": `${pose.py}%`,
    "--tilt-active": `${pose.active}`,
  };
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function screenAxis(
  pointer: number,
  start: number,
  size: number,
  viewport: number,
) {
  const end = start + size;
  if (pointer < start) return CARD_EDGE * clamp01(pointer / Math.max(start, 1));
  if (pointer > end) {
    const span = Math.max(viewport - end, 1);
    return 1 - CARD_EDGE * clamp01((viewport - pointer) / span);
  }
  return CARD_EDGE + (1 - 2 * CARD_EDGE) * ((pointer - start) / size);
}

function useHoloTilt({ enabled = true }: { enabled?: boolean } = {}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame: number | null = null;
    let current = REST;
    let target = REST;

    function step() {
      const next: TiltPose = {
        rx: current.rx + (target.rx - current.rx) * 0.12,
        ry: current.ry + (target.ry - current.ry) * 0.12,
        px: current.px + (target.px - current.px) * 0.12,
        py: current.py + (target.py - current.py) * 0.12,
        active: current.active + (target.active - current.active) * 0.1,
      };
      current = next;
      const vars = poseVars(next);
      for (const name of TILT_VARS) node?.style.setProperty(name, vars[name]);
      const settled =
        Math.abs(target.rx - next.rx) < 0.05 &&
        Math.abs(target.ry - next.ry) < 0.05 &&
        Math.abs(target.px - next.px) < 0.1 &&
        Math.abs(target.py - next.py) < 0.1 &&
        Math.abs(target.active - next.active) < 0.01;
      frame = settled ? null : requestAnimationFrame(step);
    }

    function start() {
      if (frame == null) frame = requestAnimationFrame(step);
    }

    function onPointerMove(event: PointerEvent) {
      if (!node) return;
      const bounds = node.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;
      const px = screenAxis(event.clientX, bounds.left, bounds.width, window.innerWidth);
      const py = screenAxis(event.clientY, bounds.top, bounds.height, window.innerHeight);
      target = {
        rx: (0.5 - py) * 24,
        ry: (px - 0.5) * 28,
        px: px * 100,
        py: py * 100,
        active: 1,
      };
      start();
    }

    function onPointerOut(event: PointerEvent) {
      if (event.relatedTarget) return;
      target = REST;
      start();
    }

    function onBlur() {
      target = REST;
      start();
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", onBlur);
      if (frame != null) cancelAnimationFrame(frame);
      for (const name of TILT_VARS) node.style.removeProperty(name);
    };
  }, [enabled]);

  return ref;
}

export { useHoloTilt };
