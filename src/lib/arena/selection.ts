type ArenaSide = "player" | "opponent";

type ArenaSelection = {
  playerId: string | null;
  opponentId: string | null;
  active: ArenaSide;
};

function chooseArenaFighter(
  selection: ArenaSelection,
  id: string,
): ArenaSelection {
  if (selection.active === "player") {
    return {
      playerId: id,
      opponentId: selection.opponentId,
      active: selection.opponentId ? "player" : "opponent",
    };
  }

  return {
    playerId: selection.playerId,
    opponentId: id,
    active: selection.playerId ? "opponent" : "player",
  };
}

function canStartArena(selection: ArenaSelection) {
  return selection.playerId !== null && selection.opponentId !== null;
}

export { canStartArena, chooseArenaFighter };
export type { ArenaSelection, ArenaSide };
