import { describe, expect, it } from "vitest";
import { advanceTutorial, isArenaMode, TUTORIAL_LESSONS, TUTORIAL_STEPS, type TutorialAction } from "./tutorial";

describe("advanceTutorial", () => {
  it("segue a ordem completa até o fim", () => {
    const script: TutorialAction[] = [
      { type: "move" },
      { type: "aim" },
      { type: "hit", kind: "melee" },
      { type: "hit", kind: "fire" },
      { type: "attack", kind: "fire", level: 2 },
      { type: "dash" },
      { type: "block" },
      { type: "pickup" },
    ];
    const visited = script.reduce(
      (steps, action) => [...steps, advanceTutorial(steps[steps.length - 1] ?? "move", action)],
      ["move"] as ReturnType<typeof advanceTutorial>[],
    );
    expect(visited).toEqual(TUTORIAL_STEPS);
  });

  it("ignora ação que não é a do passo atual", () => {
    expect(advanceTutorial("move", { type: "dash" })).toBe("move");
    expect(advanceTutorial("aim", { type: "select", kind: "fire" })).toBe("aim");
  });

  it("acerto precisa ser do ataque pedido", () => {
    expect(advanceTutorial("melee", { type: "hit", kind: "fire" })).toBe("melee");
    expect(advanceTutorial("fire", { type: "hit", kind: "melee" })).toBe("fire");
  });

  it("carga só conta no nível máximo", () => {
    expect(advanceTutorial("charge", { type: "attack", kind: "melee", level: 1 })).toBe("charge");
    expect(advanceTutorial("charge", { type: "attack", kind: "melee", level: 2 })).toBe("dash");
  });

  it("defesa só avança bloqueando um golpe", () => {
    expect(advanceTutorial("dash", { type: "dash" })).toBe("defend");
    expect(advanceTutorial("defend", { type: "dash" })).toBe("defend");
    expect(advanceTutorial("defend", { type: "block" })).toBe("pickup");
  });

  it("fim não avança", () => {
    expect(advanceTutorial("done", { type: "pickup" })).toBe("done");
  });

  it("conta só os passos jogáveis", () => {
    expect(TUTORIAL_LESSONS).toBe(8);
  });
});

describe("isArenaMode", () => {
  it("aceita só os modos conhecidos", () => {
    expect(isArenaMode("tutorial")).toBe(true);
    expect(isArenaMode("match")).toBe(true);
    expect(isArenaMode("test")).toBe(true);
    expect(isArenaMode("treino")).toBe(false);
    expect(isArenaMode(undefined)).toBe(false);
  });
});
