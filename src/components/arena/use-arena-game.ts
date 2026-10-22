"use client";

import type { ArenaControls } from "@/game/arena/create-game";
import { profileKeys } from "@/hooks/use-profile";
import type { ArenaDifficulty } from "@/lib/arena/cpu";
import type { ArenaMatchup } from "@/lib/arena/fighter";
import { ARENA_WIN_REWARD } from "@/lib/arena/rewards";
import type { ArenaHudState, ArenaSnapshot } from "@/lib/arena/snapshot";
import { advanceTutorial, type ArenaMode, type TutorialStep } from "@/lib/arena/tutorial";
import type { ArenaMatchStart } from "@/types/catalog";
import { claimArenaWin, recordArenaDefeat, startArenaMatch } from "@/services/arena";
import { useQueryClient } from "@tanstack/react-query";
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

type ArenaStatus = "loading" | "ready" | "error";

type ArenaReward =
  | { status: "pending" }
  | { status: "granted"; amount: number; rewardedToday: number; dailyLimit: number }
  | { status: "capped"; dailyLimit: number }
  | { status: "defeat"; potential: number; rewardedToday: number; dailyLimit: number }
  | { status: "error" };

function fitArena(game: ArenaGameInstance, parent: HTMLElement) {
  const width = Math.max(parent.clientWidth, 1);
  const height = Math.max(parent.clientHeight, 1);
  if (game.scale.width === width && game.scale.height === height) return;
  game.scale.resize(width, height);
}

function useArenaGame(matchup: ArenaMatchup, difficulty: ArenaDifficulty, mode: ArenaMode) {
  const parentRef = useRef<HTMLDivElement>(null);
  const matchupRef = useRef(matchup);
  const controlsRef = useRef<ArenaControls | null>(null);
  const matchRef = useRef<Promise<ArenaMatchStart | null> | null>(null);
  const matchTokenRef = useRef(0);
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<ArenaPhase>("playing");
  const [status, setStatus] = useState<ArenaStatus>("loading");
  const [snapshot, setSnapshot] = useState<ArenaSnapshot | null>(null);
  const [hud, setHud] = useState<ArenaHudState | null>(null);
  const [reward, setReward] = useState<ArenaReward | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>("move");
  const playerId = matchup.player.id;
  const opponentId = matchup.opponent.id;

  useEffect(() => {
    matchupRef.current = matchup;
  }, [matchup]);

  function beginMatch(level: ArenaDifficulty) {
    matchTokenRef.current += 1;
    setReward(null);
    matchRef.current = startArenaMatch(level).catch(() => null);
  }

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    let cancelled = false;
    let game: ArenaGameInstance | null = null;
    let releaseOutcome: (() => void) | null = null;
    let releaseSnapshot: (() => void) | null = null;
    let releaseHud: (() => void) | null = null;
    let releaseTutorial: (() => void) | null = null;
    const observer = new ResizeObserver(() => {
      if (game) fitArena(game, parent);
    });
    observer.observe(parent);

    async function recordDefeat() {
      const pending = matchRef.current;
      const token = matchTokenRef.current;
      matchRef.current = null;
      const match = await pending;
      if (!match) return;
      if (matchTokenRef.current === token) {
        setReward({
          status: "defeat",
          potential: ARENA_WIN_REWARD[difficulty],
          rewardedToday: match.rewardedToday,
          dailyLimit: match.dailyLimit,
        });
      }
      if (match.matchId) await recordArenaDefeat(match.matchId).catch(() => undefined);
    }

    async function claimReward() {
      const pending = matchRef.current;
      const token = matchTokenRef.current;
      matchRef.current = null;
      if (!pending) return;
      setReward({ status: "pending" });
      const match = await pending;
      const matchId = match?.matchId;
      let next: ArenaReward = match
        ? { status: "capped", dailyLimit: match.dailyLimit }
        : { status: "error" };
      if (matchId) {
        try {
          const result = await claimArenaWin(matchId);
          next =
            result.reward > 0
              ? {
                  status: "granted",
                  amount: result.reward,
                  rewardedToday: result.rewardedToday,
                  dailyLimit: result.dailyLimit,
                }
              : { status: "capped", dailyLimit: result.dailyLimit };
          if (result.reward > 0) void queryClient.invalidateQueries({ queryKey: profileKeys.me() });
        } catch {
          next = { status: "error" };
        }
      }
      if (matchTokenRef.current === token) setReward(next);
    }

    void (async () => {
      try {
        const { arenaControls, createArenaGame, loadArenaFonts } = await import(
          "@/game/arena/create-game"
        );
        await loadArenaFonts(parent);
        if (cancelled || parentRef.current !== parent) return;
        const instance = createArenaGame(parent, matchupRef.current, difficulty, mode);
        if (cancelled) {
          instance.destroy(true, false);
          return;
        }
        game = instance;
        const controls = arenaControls(instance);
        controlsRef.current = controls;
        releaseOutcome = controls.onOutcome((outcome) => {
          setPhase(outcome);
          void (outcome === "victory" ? claimReward() : recordDefeat());
        });
        releaseSnapshot = controls.onSnapshot(setSnapshot);
        releaseHud = controls.onHud(setHud);
        if (mode === "tutorial") {
          releaseTutorial = controls.onTutorial((action) => {
            setTutorialStep((step) => advanceTutorial(step, action));
          });
        } else {
          beginMatch(difficulty);
        }
        fitArena(instance, parent);
        parent.dataset.arenaStatus = "ready";
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      observer.disconnect();
      delete parent.dataset.arenaStatus;
      releaseOutcome?.();
      releaseSnapshot?.();
      releaseHud?.();
      releaseTutorial?.();
      controlsRef.current = null;
      matchRef.current = null;
      matchTokenRef.current += 1;
      game?.destroy(true, false);
      game = null;
      setPhase("playing");
      setStatus("loading");
      setSnapshot(null);
      setHud(null);
      setReward(null);
      setTutorialStep("move");
    };
  }, [playerId, opponentId, difficulty, mode, attempt, queryClient]);

  useEffect(() => {
    if (mode !== "tutorial" || status !== "ready") return;
    const controls = controlsRef.current;
    if (tutorialStep === "pickup") controls?.spawnTutorialPickup();
    // Fim do treino: congela a cena atrás da tela de conclusão.
    if (tutorialStep === "done") controls?.pause();
  }, [mode, status, tutorialStep]);

  useEffect(() => {
    if (phase !== "playing" && phase !== "paused") return;
    if (tutorialStep === "done") return;
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
  }, [phase, tutorialStep]);

  function resume() {
    controlsRef.current?.resume();
    setPhase("playing");
  }

  function restart() {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.restart();
    if (mode === "tutorial") setTutorialStep("move");
    else beginMatch(difficulty);
    setPhase("playing");
  }

  function retry() {
    setAttempt((value) => value + 1);
  }

  return {
    parentRef,
    phase,
    status,
    snapshot,
    hud,
    reward,
    tutorialStep,
    resume,
    restart,
    retry,
  };
}

export { useArenaGame };
export type { ArenaPhase, ArenaReward, ArenaStatus };
