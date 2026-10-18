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
  if (id === selection.playerId) return { ...selection, active: "player" };
  if (id === selection.opponentId) return { ...selection, active: "opponent" };

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
  return (
    selection.playerId !== null &&
    selection.opponentId !== null &&
    selection.playerId !== selection.opponentId
  );
}

export { canStartArena, chooseArenaFighter };
export type { ArenaSelection, ArenaSide };
