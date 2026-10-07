"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type AnimationEvent } from "react";
import { useOpening } from "@/hooks/use-opening";

type PackOpeningPhase = "sealed" | "ripping" | "stack" | "summary";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pokedexTargetRect() {
  const targets = document.querySelectorAll<HTMLElement>('[data-nav-target="pokedex"]');
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
    setSending(false);
    if (current + 1 >= total) {
      setPhase("summary");
      return;
    }
    setCurrent(current + 1);
  }

  function pass() {
    if (sending) return;
    const node = topCardRef.current;
    const target = pokedexTargetRect();
    if (!node || !target || prefersReducedMotion()) {
      advance();
      return;
    }
    const card = node.getBoundingClientRect();
    const flyX = target.left + target.width / 2 - (card.left + card.width / 2);
    const flyY = target.top + target.height / 2 - (card.top + card.height / 2);
    node.style.setProperty("--fly-x", `${flyX}px`);
    node.style.setProperty("--fly-y", `${flyY}px`);
    setSending(true);
  }

  function onSendEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
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
