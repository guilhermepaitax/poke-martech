"use client";

import { useEffect, useRef } from "react";

type ArenaGameInstance = {
  destroy: (removeCanvas: boolean, noReturn?: boolean) => void;
  scale: {
    width: number;
    height: number;
    resize: (width: number, height: number) => void;
  };
};

function fitArena(game: ArenaGameInstance, parent: HTMLElement) {
  const width = Math.max(parent.clientWidth, 1);
  const height = Math.max(parent.clientHeight, 1);
  if (game.scale.width === width && game.scale.height === height) return;
  game.scale.resize(width, height);
}

function useArenaGame() {
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    let cancelled = false;
    let game: ArenaGameInstance | null = null;
    const observer = new ResizeObserver(() => {
      if (game) fitArena(game, parent);
    });
    observer.observe(parent);

    void (async () => {
      const { createArenaGame } = await import("@/game/arena/create-game");
      if (cancelled || parentRef.current !== parent) return;
      const instance = createArenaGame(parent);
      if (cancelled) {
        instance.destroy(true, false);
        return;
      }
      game = instance;
      fitArena(instance, parent);
      parent.dataset.arenaStatus = "ready";
    })();

    return () => {
      cancelled = true;
      observer.disconnect();
      delete parent.dataset.arenaStatus;
      game?.destroy(true, false);
      game = null;
    };
  }, []);

  return parentRef;
}

export { useArenaGame };
