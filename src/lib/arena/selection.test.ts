import { describe, expect, it } from "vitest";
import {
  RANDOM_FIGHTER_ID,
  RANDOM_MAP_ID,
  canStartArena,
  resolveArenaMapId,
  resolveArenaFighterId,
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

describe("resolveArenaFighterId", () => {
  const ids = ["antoniomander", "calvossauro", "papaitaxone"];

  it("mantém lutador escolhido", () => {
    expect(resolveArenaFighterId("calvossauro", ids, () => 0.99)).toBe("calvossauro");
  });

  it("sorteia entre os lutadores quando aleatório", () => {
    expect(resolveArenaFighterId(RANDOM_FIGHTER_ID, ids, () => 0)).toBe("antoniomander");
    expect(resolveArenaFighterId(RANDOM_FIGHTER_ID, ids, () => 0.5)).toBe("calvossauro");
    expect(resolveArenaFighterId(RANDOM_FIGHTER_ID, ids, () => 0.999)).toBe("papaitaxone");
  });

  it("aleatório conta como lado preenchido", () => {
    expect(
      canStartArena({ playerId: RANDOM_FIGHTER_ID, opponentId: "calvossauro", active: "player" }),
    ).toBe(true);
  });
});

describe("resolveArenaMapId", () => {
  const ids = ["arena-da-selva", "ilha-das-estrelas"];

  it("mantém o mapa escolhido e sorteia o aleatório", () => {
    expect(resolveArenaMapId("ilha-das-estrelas", ids, () => 0)).toBe("ilha-das-estrelas");
    expect(resolveArenaMapId(RANDOM_MAP_ID, ids, () => 0.9)).toBe("ilha-das-estrelas");
  });
});
