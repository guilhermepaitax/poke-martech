"use client";

import { useOpening } from "@/hooks/use-opening";
import { useRouter } from "next/navigation";
import { useRef, useState, type AnimationEvent } from "react";

type PackOpeningPhase = "sealed" | "ripping" | "stack" | "summary";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function layoutCenter(node: HTMLElement) {
  const parent = node.offsetParent;
  if (!(parent instanceof HTMLElement)) {
    const rect = node.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
  const parentRect = parent.getBoundingClientRect();
  return {
    x: parentRect.left + node.offsetLeft + node.offsetWidth / 2,
    y: parentRect.top + node.offsetTop + node.offsetHeight / 2,
  };
}

function pokedexTargetRect() {
  const targets = document.querySelectorAll<HTMLElement>(
    '[data-nav-target="pokedex"]',
  );
  for (const target of targets) {
    const rect = target.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return rect;
  }
  return null;
}

function usePackOpening(id: string) {
  const opening = useOpening(id);
  const router = useRouter();
  const topCardRef = useRef<HTMLDivElement>(null);
  const passLock = useRef(false);
  const passIndex = useRef<number | null>(null);
  const [phase, setPhase] = useState<PackOpeningPhase>("sealed");
  const [current, setCurrent] = useState(0);
  const [sending, setSending] = useState(false);
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);
  const total = opening.data?.cards.length ?? 0;

  function open() {
    if (prefersReducedMotion()) {
      setPhase("stack");
      return;
    }
    setPhase("ripping");
    window.setTimeout(() => setPhase("stack"), 720);
  }

  function advance() {
    if (!passLock.current || passIndex.current == null) return;
    const index = passIndex.current;
    passLock.current = false;
    passIndex.current = null;
    setSending(false);
    if (index + 1 >= total) {
      setPhase("summary");
      return;
    }
    setCurrent(index + 1);
  }

  function scheduleAdvance(index: number, delay: number) {
    window.setTimeout(() => {
      if (passIndex.current !== index) return;
      advance();
    }, delay);
  }

  function pass() {
    if (passLock.current || sending) return;
    const index = current;
    passLock.current = true;
    passIndex.current = index;
    const node = topCardRef.current;
    const target = pokedexTargetRect();
    if (!node || !target || prefersReducedMotion()) {
      scheduleAdvance(index, 0);
      return;
    }
    const card = layoutCenter(node);
    const flyX = target.left + target.width / 2 - card.x;
    const flyY = target.top + target.height / 2 - card.y;
    node.style.setProperty("--fly-x", `${flyX}px`);
    node.style.setProperty("--fly-y", `${flyY}px`);
    setSending(true);
    scheduleAdvance(index, 800);
  }

  function onSendEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (passIndex.current !== current) return;
    advance();
  }

  function select(index: number) {
    setZoomedIndex(index);
  }

  function closeZoom() {
    setZoomedIndex(null);
  }

  function storeAll() {
    router.push("/pokedex");
  }

  return {
    opening,
    phase,
    current,
    sending,
    topCardRef,
    zoomedIndex,
    open,
    pass,
    onSendEnd,
    select,
    closeZoom,
    storeAll,
  };
}

export { usePackOpening };
export type { PackOpeningPhase };
