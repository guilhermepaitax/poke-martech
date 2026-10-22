"use client";

import { DEFAULT_DIFFICULTY, type ArenaDifficulty } from "@/lib/arena/cpu";
import { findFighter } from "@/lib/arena/fighters";
import {
  canStartArena,
  chooseArenaFighter,
  type ArenaSelection,
  type ArenaSide,
} from "@/lib/arena/selection";
import type { ArenaMode } from "@/lib/arena/tutorial";
import { useState } from "react";

function useArenaPicker(selection: ArenaSelection) {
  const [current, setCurrent] = useState(selection);
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<ArenaMode>("match");
  const [difficulty, setDifficulty] = useState<ArenaDifficulty>(DEFAULT_DIFFICULTY);

  const player = findFighter(current.playerId);
  const opponent = findFighter(current.opponentId);

  function choose(id: string) {
    setCurrent((previous) => chooseArenaFighter(previous, id));
  }

  function activate(side: ArenaSide) {
    setCurrent((previous) => ({ ...previous, active: side }));
  }

  function reset() {
    setStarted(false);
  }

  function fight(next: ArenaMode = "match") {
    if (!canStartArena(current) || !player || !opponent) return false;
    setMode(next);
    setStarted(true);
    return true;
  }

  return {
    player,
    opponent,
    active: current.active,
    focused: current.active === "player" ? player : opponent,
    choose,
    activate,
    fight,
    reset,
    mode,
    setMode,
    difficulty,
    setDifficulty,
    canFight: canStartArena(current),
    matchup: started && player && opponent ? { player, opponent } : null,
  };
}

export { useArenaPicker };
