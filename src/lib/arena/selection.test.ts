import { describe, expect, it } from "vitest";
import {
  canStartArena,
  chooseArenaFighter,
  type ArenaSelection,
} from "./selection";

const empty: ArenaSelection = {
  playerId: null,
  opponentId: null,
  active: "player",
};

describe("chooseArenaFighter", () => {
  it("preenche você e passa o foco para o oponente", () => {
    expect(chooseArenaFighter(empty, "calva")).toEqual({
      playerId: "calva",
      opponentId: null,
      active: "opponent",
    });
  });

  it("não deixa o mesmo lutador nos dois lados", () => {
    const chosen = chooseArenaFighter(
      { playerId: "calva", opponentId: null, active: "opponent" },
      "calva",
    );

    expect(chosen).toEqual({
      playerId: "calva",
      opponentId: null,
      active: "player",
    });
    expect(canStartArena(chosen)).toBe(false);
  });

  it("libera a luta com dois lutadores diferentes", () => {
    const chosen = chooseArenaFighter(
      { playerId: "calva", opponentId: null, active: "opponent" },
      "rafr",
    );

    expect(chosen.opponentId).toBe("rafr");
    expect(canStartArena(chosen)).toBe(true);
  });
});
