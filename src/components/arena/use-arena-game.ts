"use client";

import type { ArenaControls } from "@/game/arena/create-game";
import type { ArenaDifficulty } from "@/lib/arena/cpu";
import type { ArenaMatchup } from "@/lib/arena/fighter";
import { useEffect, useRef, useState } from "react";

type ArenaGameInstance = {
  destroy: (removeCanvas: boolean, noReturn?: boolean) => void;
  scale: {
    width: number;
    height: number;
    resize: (width: number, height: number) => void;
  };
};

type ArenaPhase = "playing" | "paused" | "victory" | "defeat";

function fitArena(game: ArenaGameInstance, parent: HTMLElement) {
  const width = Math.max(parent.clientWidth, 1);
  const height = Math.max(parent.clientHeight, 1);
  if (game.scale.width === width && game.scale.height === height) return;
  game.scale.resize(width, height);
}

function useArenaGame(matchup: ArenaMatchup, difficulty: ArenaDifficulty) {
  const parentRef = useRef<HTMLDivElement>(null);
  const matchupRef = useRef(matchup);
  const controlsRef = useRef<ArenaControls | null>(null);
  const [phase, setPhase] = useState<ArenaPhase>("playing");
  const playerId = matchup.player.id;
  const opponentId = matchup.opponent.id;

  useEffect(() => {
    matchupRef.current = matchup;
  }, [matchup]);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    let cancelled = false;
    let game: ArenaGameInstance | null = null;
    let releaseOutcome: (() => void) | null = null;
    const observer = new ResizeObserver(() => {
      if (game) fitArena(game, parent);
    });
    observer.observe(parent);

    void (async () => {
      const { arenaControls, createArenaGame } = await import(
        "@/game/arena/create-game"
      );
      if (cancelled || parentRef.current !== parent) return;
      const instance = createArenaGame(parent, matchupRef.current, difficulty);
      if (cancelled) {
        instance.destroy(true, false);
        return;
      }
      game = instance;
      const controls = arenaControls(instance);
      controlsRef.current = controls;
      releaseOutcome = controls.onOutcome((outcome) => setPhase(outcome));
      fitArena(instance, parent);
      parent.dataset.arenaStatus = "ready";
    })();

    return () => {
      cancelled = true;
      observer.disconnect();
      delete parent.dataset.arenaStatus;
      releaseOutcome?.();
      controlsRef.current = null;
      game?.destroy(true, false);
      game = null;
      setPhase("playing");
    };
  }, [playerId, opponentId, difficulty]);

  useEffect(() => {
    if (phase !== "playing" && phase !== "paused") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.repeat) return;
      const controls = controlsRef.current;
      if (!controls) return;
      event.preventDefault();
      if (phase === "playing") {
        controls.pause();
        setPhase("paused");
        return;
      }
      controls.resume();
      setPhase("playing");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase]);

  function resume() {
    controlsRef.current?.resume();
    setPhase("playing");
  }

  function restart() {
    controlsRef.current?.restart();
    setPhase("playing");
  }

  return { parentRef, phase, resume, restart };
}

export { useArenaGame };
export type { ArenaPhase };
