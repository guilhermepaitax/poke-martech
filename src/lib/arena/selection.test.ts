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
    expect(chooseArenaFighter(empty, "calvossauro")).toEqual({
      playerId: "calvossauro",
      opponentId: null,
      active: "opponent",
    });
  });

  it("aceita o mesmo lutador nos dois lados", () => {
    const chosen = chooseArenaFighter(
      { playerId: "calvossauro", opponentId: null, active: "opponent" },
      "calvossauro",
    );

    expect(chosen).toEqual({
      playerId: "calvossauro",
      opponentId: "calvossauro",
      active: "opponent",
    });
    expect(canStartArena(chosen)).toBe(true);
  });

  it("troca só o lado ativo quando os dois já estão escolhidos", () => {
    const chosen = chooseArenaFighter(
      { playerId: "antoniomander", opponentId: "calvossauro", active: "player" },
      "calvossauro",
    );

    expect(chosen).toEqual({
      playerId: "calvossauro",
      opponentId: "calvossauro",
      active: "player",
    });
  });

  it("só libera a luta com os dois lados preenchidos", () => {
    expect(canStartArena(empty)).toBe(false);
    expect(
      canStartArena({ playerId: "antoniomander", opponentId: null, active: "opponent" }),
    ).toBe(false);
  });
});
