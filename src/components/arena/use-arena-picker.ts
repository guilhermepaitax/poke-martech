"use client";

import { DEFAULT_DIFFICULTY, type ArenaDifficulty } from "@/lib/arena/cpu";
import type { ArenaRosterEntry } from "@/lib/arena/fighter";
import {
  canStartArena,
  chooseArenaFighter,
  type ArenaSelection,
  type ArenaSide,
} from "@/lib/arena/selection";
import { paginate } from "@/lib/paginate";
import { useMemo, useState } from "react";

function useArenaPicker(
  selection: ArenaSelection,
  entries: ArenaRosterEntry[],
) {
  const [current, setCurrent] = useState(selection);
  const [query, setQuery] = useState("");
  const [started, setStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<ArenaDifficulty>(DEFAULT_DIFFICULTY);
  const term = query.trim().toLocaleLowerCase();
  const [pageState, setPageState] = useState({ key: term, page: 1 });
  if (pageState.key !== term) setPageState({ key: term, page: 1 });
  const page = pageState.key === term ? pageState.page : 1;

  const player = entries.find((entry) => entry.id === current.playerId) ?? null;
  const opponent =
    entries.find((entry) => entry.id === current.opponentId) ?? null;
  const visible = useMemo(() => {
    if (!term) return entries;
    return entries.filter((entry) =>
      entry.face.name.toLocaleLowerCase().includes(term),
    );
  }, [entries, term]);
  const paged = paginate(visible, page);

  function choose(id: string) {
    setCurrent((previous) => chooseArenaFighter(previous, id));
  }

  function activate(side: ArenaSide) {
    setCurrent((previous) => ({ ...previous, active: side }));
  }

  function reset() {
    setStarted(false);
  }

  function fight() {
    if (!canStartArena(current) || !player || !opponent) return false;
    setStarted(true);
    return true;
  }

  return {
    player,
    opponent,
    active: current.active,
    query,
    setQuery,
    page: paged.page,
    pageCount: paged.pageCount,
    pageItems: paged.items,
    setPage: (next: number) => setPageState({ key: term, page: next }),
    empty: visible.length === 0,
    choose,
    activate,
    fight,
    reset,
    difficulty,
    setDifficulty,
    canFight: canStartArena(current),
    matchup:
      started && player && opponent
        ? { player: player.fighter, opponent: opponent.fighter }
        : null,
  };
}

export { useArenaPicker };
