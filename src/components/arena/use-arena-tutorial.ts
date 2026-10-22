"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "arena:tutorial-done:v1";

const listeners = new Set<() => void>();

function readDone() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Storage bloqueado: não força o tutorial em toda luta.
    return true;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function markTutorialDone() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    return;
  }
  for (const listener of listeners) listener();
}

function useArenaTutorial() {
  // No servidor assume visto para não piscar nada.
  const done = useSyncExternalStore(subscribe, readDone, () => true);
  return { done, markDone: markTutorialDone };
}

export { useArenaTutorial };
