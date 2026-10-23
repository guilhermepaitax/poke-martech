type ArenaSide = "player" | "opponent";

// Id reservado: o lutador (ou o mapa) só é sorteado na hora da luta.
const RANDOM_FIGHTER_ID = "random";
const RANDOM_MAP_ID = RANDOM_FIGHTER_ID;

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

function isRandomPick(id: string | null) {
  return id === RANDOM_FIGHTER_ID;
}

function resolveArenaFighterId(
  id: string,
  ids: readonly string[],
  random: () => number = Math.random,
) {
  if (!isRandomPick(id) || ids.length === 0) return id;
  return ids[Math.min(Math.floor(random() * ids.length), ids.length - 1)];
}

// Mesmo sorteio dos lutadores, para a escolha de mapa.
const resolveArenaMapId = resolveArenaFighterId;

export {
  RANDOM_FIGHTER_ID,
  RANDOM_MAP_ID,
  resolveArenaMapId,
  canStartArena,
  chooseArenaFighter,
  isRandomPick,
  resolveArenaFighterId,
};
export type { ArenaSelection, ArenaSide };
