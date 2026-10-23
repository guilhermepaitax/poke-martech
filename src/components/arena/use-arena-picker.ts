"use client";

import { DEFAULT_DIFFICULTY, type ArenaDifficulty } from "@/lib/arena/cpu";
import type { ArenaMatchup } from "@/lib/arena/fighter";
import { ARENA_FIGHTERS, findFighter } from "@/lib/arena/fighters";
import {
  canStartArena,
  chooseArenaFighter,
  isRandomPick,
  resolveArenaFighterId,
  type ArenaSelection,
  type ArenaSide,
} from "@/lib/arena/selection";
import type { ArenaMode } from "@/lib/arena/tutorial";
import { useState } from "react";

const FIGHTER_IDS = ARENA_FIGHTERS.map((fighter) => fighter.id);

// Sorteia o lado aleatório só quando a luta começa.
function resolveFighter(id: string | null) {
  if (!id) return null;
  return findFighter(resolveArenaFighterId(id, FIGHTER_IDS));
}

function useArenaPicker(selection: ArenaSelection) {
  const [current, setCurrent] = useState(selection);
  const [matchup, setMatchup] = useState<ArenaMatchup | null>(null);
  const [mode, setMode] = useState<ArenaMode>("match");
  const [difficulty, setDifficulty] = useState<ArenaDifficulty>(DEFAULT_DIFFICULTY);

  const player = findFighter(current.playerId);
  const opponent = findFighter(current.opponentId);
  const random: Record<ArenaSide, boolean> = {
    player: isRandomPick(current.playerId),
    opponent: isRandomPick(current.opponentId),
  };

  function choose(id: string) {
    setCurrent((previous) => chooseArenaFighter(previous, id));
  }

  function activate(side: ArenaSide) {
    setCurrent((previous) => ({ ...previous, active: side }));
  }

  function reset() {
    setMatchup(null);
  }

  function fight(next: ArenaMode = "match") {
    if (!canStartArena(current)) return false;
    const resolvedPlayer = resolveFighter(current.playerId);
    const resolvedOpponent = resolveFighter(current.opponentId);
    if (!resolvedPlayer || !resolvedOpponent) return false;
    setMode(next);
    setMatchup({ player: resolvedPlayer, opponent: resolvedOpponent });
    return true;
  }

  return {
    player,
    opponent,
    random,
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
    matchup,
  };
}

export { useArenaPicker };
