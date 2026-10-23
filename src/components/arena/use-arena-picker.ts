"use client";

import { DEFAULT_DIFFICULTY, type ArenaDifficulty } from "@/lib/arena/cpu";
import type { ArenaMatchup } from "@/lib/arena/fighter";
import { ARENA_FIGHTERS, findFighter } from "@/lib/arena/fighters";
import { ARENA_MAPS, DEFAULT_MAP, findMap } from "@/lib/arena/maps";
import {
  canStartArena,
  chooseArenaFighter,
  isRandomPick,
  resolveArenaFighterId,
  resolveArenaMapId,
  type ArenaSelection,
  type ArenaSide,
} from "@/lib/arena/selection";
import type { ArenaMode } from "@/lib/arena/tutorial";
import { useState } from "react";

const FIGHTER_IDS = ARENA_FIGHTERS.map((fighter) => fighter.id);
const MAP_IDS = ARENA_MAPS.map((map) => map.id);

// Lutadores primeiro; depois a etapa da arena antes de lutar.
type ArenaPickerStep = "fighters" | "map";

// Sorteia o lado aleatório só quando a luta começa.
function resolveFighter(id: string | null) {
  if (!id) return null;
  return findFighter(resolveArenaFighterId(id, FIGHTER_IDS));
}

function resolveMap(id: string) {
  return findMap(resolveArenaMapId(id, MAP_IDS)) ?? DEFAULT_MAP;
}

function useArenaPicker(selection: ArenaSelection) {
  const [current, setCurrent] = useState(selection);
  const [matchup, setMatchup] = useState<ArenaMatchup | null>(null);
  const [mode, setMode] = useState<ArenaMode>("match");
  const [difficulty, setDifficulty] = useState<ArenaDifficulty>(DEFAULT_DIFFICULTY);
  const [step, setStep] = useState<ArenaPickerStep>("fighters");
  const [mapId, setMapId] = useState(DEFAULT_MAP.id);

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

  // Guarda o modo pedido (luta ou treino) e passa para a escolha da arena.
  function openMaps(next: ArenaMode = "match") {
    if (!canStartArena(current)) return;
    setMode(next);
    setStep("map");
  }

  // Volta para os lutadores; com lado, já foca nele.
  function backToFighters(side?: ArenaSide) {
    if (side) activate(side);
    setStep("fighters");
  }

  function reset() {
    setMatchup(null);
  }

  function fight(next: ArenaMode = mode) {
    if (!canStartArena(current)) return false;
    const resolvedPlayer = resolveFighter(current.playerId);
    const resolvedOpponent = resolveFighter(current.opponentId);
    if (!resolvedPlayer || !resolvedOpponent) return false;
    setMode(next);
    setMatchup({ player: resolvedPlayer, opponent: resolvedOpponent, map: resolveMap(mapId) });
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
    step,
    openMaps,
    backToFighters,
    mapId,
    map: findMap(mapId),
    randomMap: isRandomPick(mapId),
    chooseMap: setMapId,
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
