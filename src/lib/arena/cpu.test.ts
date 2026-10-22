import { describe, expect, it } from "vitest";
import {
  CPU_HOLD_DISTANCE,
  CPU_MELEE_RANGE,
  CPU_PROFILES,
  decideCpu,
  isArenaDifficulty,
  type CpuInput,
} from "./cpu";

const CPU_FIRE_RANGE = CPU_PROFILES.hard.fireRange;

function input(overrides: Partial<CpuInput> = {}): CpuInput {
  return {
    self: { x: 0, y: 0 },
    target: { x: CPU_FIRE_RANGE + 200, y: 0 },
    selfHp: 100,
    targetHp: 100,
    busy: false,
    now: 1000,
    readyAt: { melee: 0, fire: 0 },
    blockedAt: null,
    fireRange: CPU_FIRE_RANGE,
    ...overrides,
  };
}

describe("decideCpu", () => {
  it("morta não age", () => {
    expect(decideCpu(input({ selfHp: 0 }))).toEqual({ action: "idle" });
  });

  it("não ataca alvo morto", () => {
    expect(
      decideCpu(input({ targetHp: 0, target: { x: 10, y: 0 } })),
    ).toEqual({ action: "idle" });
  });

  it("espera enquanto está atacando, ferida ou em dash", () => {
    expect(decideCpu(input({ busy: true }))).toEqual({ action: "idle" });
  });

  it("longe persegue com vetor normalizado", () => {
    const decision = decideCpu(
      input({ target: { x: CPU_FIRE_RANGE, y: CPU_FIRE_RANGE } }),
    );

    expect(decision.action).toBe("chase");
    if (decision.action !== "chase") return;
    expect(Math.hypot(decision.move.x, decision.move.y)).toBeCloseTo(1, 5);
    expect(decision.move.x).toBeCloseTo(Math.SQRT1_2, 5);
    expect(decision.move.y).toBeCloseTo(Math.SQRT1_2, 5);
  });

  it("no alcance do feixe com linha livre dispara fogo mirando o alvo", () => {
    expect(decideCpu(input({ target: { x: 0, y: -CPU_FIRE_RANGE } }))).toEqual({
      action: "attack",
      kind: "fire",
      aim: { x: 0, y: -1 },
    });
  });

  it("com bloco no caminho atira no bloco para abrir passagem", () => {
    const decision = decideCpu(
      input({ target: { x: CPU_FIRE_RANGE + 200, y: 0 }, blockedAt: CPU_FIRE_RANGE - 10 }),
    );

    expect(decision).toEqual({ action: "attack", kind: "fire", aim: { x: 1, y: 0 } });
  });

  it("colada no bloco usa corpo a corpo para quebrá-lo", () => {
    const decision = decideCpu(
      input({ target: { x: CPU_FIRE_RANGE, y: 0 }, blockedAt: CPU_MELEE_RANGE - 20 }),
    );

    expect(decision).toEqual({ action: "attack", kind: "melee", aim: { x: 1, y: 0 } });
  });

  it("bloco fora do alcance e sem ataque pronto faz a CPU se aproximar", () => {
    const far = decideCpu(
      input({ target: { x: CPU_FIRE_RANGE + 400, y: 0 }, blockedAt: CPU_FIRE_RANGE + 100 }),
    );
    const cooling = decideCpu(
      input({
        target: { x: CPU_FIRE_RANGE + 200, y: 0 },
        blockedAt: 40,
        readyAt: { melee: 2000, fire: 2000 },
      }),
    );

    expect(far).toEqual({ action: "chase", move: { x: 1, y: 0 } });
    expect(cooling).toEqual({ action: "chase", move: { x: 1, y: 0 } });
  });

  it("colada e pronta usa corpo a corpo", () => {
    expect(decideCpu(input({ target: { x: CPU_MELEE_RANGE, y: 0 } }))).toEqual({
      action: "attack",
      kind: "melee",
      aim: { x: 1, y: 0 },
    });
  });

  it("colada com melee em cooldown usa o fogo", () => {
    const decision = decideCpu(
      input({
        target: { x: CPU_MELEE_RANGE - 10, y: 0 },
        readyAt: { melee: 2000, fire: 0 },
      }),
    );

    expect(decision).toEqual({ action: "attack", kind: "fire", aim: { x: 1, y: 0 } });
  });

  it("sem ataque pronto, aproxima até a distância de espera", () => {
    const cooling = { melee: 2000, fire: 2000 };

    expect(
      decideCpu(input({ target: { x: CPU_FIRE_RANGE - 10, y: 0 }, readyAt: cooling })),
    ).toEqual({ action: "chase", move: { x: 1, y: 0 } });
    expect(
      decideCpu(input({ target: { x: CPU_HOLD_DISTANCE, y: 0 }, readyAt: cooling })),
    ).toEqual({ action: "idle" });
  });

  it("cooldown libera quando o relógio alcança a marca", () => {
    const target = { x: CPU_MELEE_RANGE, y: 0 };
    const readyAt = { melee: 1000, fire: 1000 };

    expect(decideCpu(input({ target, readyAt, now: 999 })).action).not.toBe("attack");
    expect(decideCpu(input({ target, readyAt, now: 1000 })).action).toBe("attack");
  });

  it("na mesma posição não gera NaN nem ataca", () => {
    const decision = decideCpu(input({ target: { x: 0, y: 0 } }));

    expect(decision).toEqual({ action: "idle" });
  });

  it("é reproduzível para a mesma entrada", () => {
    const state = input({ target: { x: 120, y: 80 } });

    expect(decideCpu(state)).toEqual(decideCpu(state));
  });
});

describe("decideCpu com consumíveis", () => {
  const reach = CPU_PROFILES.hard.pickupReach;

  it("desvia para pegar o consumível ao alcance", () => {
    const decision = decideCpu(
      input({
        pickups: [{ at: { x: 0, y: 200 }, look: "fury", blocked: false }],
        pickupReach: reach,
      }),
    );

    expect(decision).toEqual({ action: "chase", move: { x: 0, y: 1 } });
  });

  it("vai no mais próximo e ignora armadilha, bloqueado e fora do alcance", () => {
    const decision = decideCpu(
      input({
        pickups: [
          { at: { x: 0, y: 50 }, look: "vulnerable", blocked: false },
          { at: { x: 0, y: 60 }, look: "haste", blocked: true },
          { at: { x: 0, y: -reach - 10 }, look: "rapid", blocked: false },
          { at: { x: -300, y: 0 }, look: "mystery", blocked: false },
        ],
        pickupReach: reach,
      }),
    );

    expect(decision).toEqual({ action: "chase", move: { x: -1, y: 0 } });
  });

  it("só busca cura quando ferida", () => {
    const pickups = [{ at: { x: 0, y: 200 }, look: "heal" as const, blocked: false }];

    expect(
      decideCpu(input({ pickups, pickupReach: reach, selfHp: 100, selfMaxHp: 100 })),
    ).toEqual({ action: "chase", move: { x: 1, y: 0 } });
    expect(
      decideCpu(input({ pickups, pickupReach: reach, selfHp: 40, selfMaxHp: 100 })),
    ).toEqual({ action: "chase", move: { x: 0, y: 1 } });
  });

  it("colada no alvo prefere o corpo a corpo ao consumível", () => {
    const decision = decideCpu(
      input({
        target: { x: CPU_MELEE_RANGE, y: 0 },
        pickups: [{ at: { x: 0, y: 200 }, look: "fury", blocked: false }],
        pickupReach: reach,
      }),
    );

    expect(decision).toEqual({ action: "attack", kind: "melee", aim: { x: 1, y: 0 } });
  });
});

describe("CPU_PROFILES", () => {
  it("normal é mais lenta, espera mais e bate mais fraco que difícil", () => {
    const { normal, hard } = CPU_PROFILES;

    expect(normal.speed).toBeLessThan(hard.speed);
    expect(normal.cooldownScale).toBeGreaterThan(hard.cooldownScale);
    expect(normal.damageScale).toBeLessThan(hard.damageScale);
    expect(normal.fireRange).toBeLessThan(hard.fireRange);
    expect(normal.pickupReach).toBeLessThan(hard.pickupReach);
  });

  it("no normal não atira de onde o difícil atiraria", () => {
    const target = { x: CPU_PROFILES.hard.fireRange - 10, y: 0 };

    expect(decideCpu(input({ target })).action).toBe("attack");
    expect(
      decideCpu(input({ target, fireRange: CPU_PROFILES.normal.fireRange })),
    ).toEqual({ action: "chase", move: { x: 1, y: 0 } });
  });

  it("reconhece só as dificuldades conhecidas", () => {
    expect(isArenaDifficulty("normal")).toBe(true);
    expect(isArenaDifficulty("hard")).toBe(true);
    expect(isArenaDifficulty("easy")).toBe(true);
    expect(isArenaDifficulty("insane")).toBe(false);
    expect(isArenaDifficulty(undefined)).toBe(false);
  });
});
