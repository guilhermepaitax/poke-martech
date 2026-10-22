import { describe, expect, it } from "vitest";
import {
  addBuff,
  buffScale,
  healAmount,
  PICKUP_EFFECTS,
  PICKUP_FIGHTER_GAP,
  PICKUP_RADIUS,
  pickupSpot,
  revealPickup,
  rollPickup,
} from "./pickups";

function sequence(...values: number[]) {
  let index = 0;
  return () => values[index++ % values.length] ?? 0;
}

const BOUNDS = { left: 0, top: 0, right: 1000, bottom: 600 };

describe("pickupSpot", () => {
  it("fica dentro dos limites, com folga do raio", () => {
    const spot = pickupSpot(sequence(0, 0), BOUNDS, [], []);
    expect(spot).toEqual({ x: PICKUP_RADIUS, y: PICKUP_RADIUS });
  });

  it("pula pontos dentro de obstáculo e perto de lutador", () => {
    const block = { x: 500, y: 300, width: 100, height: 100 };
    const fighter = { x: PICKUP_RADIUS, y: PICKUP_RADIUS };
    // 1º sorteio: centro (bloco); 2º: canto (lutador); 3º: canto oposto.
    const spot = pickupSpot(sequence(0.5, 0.5, 0, 0, 1, 1), BOUNDS, [block], [fighter]);
    expect(spot).toEqual({ x: 1000 - PICKUP_RADIUS, y: 600 - PICKUP_RADIUS });
    expect(Math.hypot(spot!.x - fighter.x, spot!.y - fighter.y)).toBeGreaterThan(PICKUP_FIGHTER_GAP);
  });

  it("devolve null quando não há espaço livre", () => {
    const block = { x: 500, y: 300, width: 2000, height: 2000 };
    expect(pickupSpot(Math.random, BOUNDS, [block], [])).toBeNull();
    expect(pickupSpot(Math.random, { left: 0, top: 0, right: 40, bottom: 40 }, [], [])).toBeNull();
  });
});

describe("rollPickup / revealPickup", () => {
  it("sorteia caixa misteriosa ou tipada", () => {
    expect(rollPickup(sequence(0))).toBe("mystery");
    expect(rollPickup(sequence(0.9, 0))).toBe("haste");
    expect(rollPickup(sequence(0.9, 0.99))).toBe("vulnerable");
  });

  it("caixa tipada revela o próprio efeito", () => {
    expect(revealPickup("fury", sequence(0.99))).toBe("fury");
  });

  it("caixa misteriosa pode virar qualquer efeito, inclusive debuff", () => {
    const seen = [0, 0.2, 0.4, 0.6, 0.99].map((roll) => revealPickup("mystery", sequence(roll)));
    expect(new Set(seen)).toEqual(new Set(["haste", "fury", "heal", "rapid", "vulnerable"]));
  });
});

describe("buffs", () => {
  it("sem buff o multiplicador é 1", () => {
    expect(buffScale([], "haste", 0)).toBe(1);
  });

  it("aplica e expira", () => {
    const buffs = addBuff([], "haste", 1000);
    expect(buffScale(buffs, "haste", 1500)).toBe(PICKUP_EFFECTS.haste.scale);
    expect(buffScale(buffs, "haste", 1000 + PICKUP_EFFECTS.haste.durationMs)).toBe(1);
  });

  it("mesmo efeito renova em vez de empilhar", () => {
    const first = addBuff([], "fury", 0);
    const second = addBuff(first, "fury", 4000);
    expect(second).toHaveLength(1);
    expect(second[0]?.until).toBe(4000 + PICKUP_EFFECTS.fury.durationMs);
  });

  it("efeitos diferentes convivem e cura não vira buff", () => {
    const buffs = addBuff(addBuff(addBuff([], "haste", 0), "vulnerable", 0), "heal", 0);
    expect(buffs.map((buff) => buff.effect).sort()).toEqual(["haste", "vulnerable"]);
  });

  it("sem recarga zera o multiplicador de cooldown", () => {
    const buffs = addBuff([], "rapid", 0);
    expect(buffScale(buffs, "rapid", 100)).toBe(0);
    expect(buffScale(buffs, "rapid", PICKUP_EFFECTS.rapid.durationMs)).toBe(1);
  });

  it("cura é uma fração do HP máximo", () => {
    expect(healAmount(100)).toBe(20);
    expect(healAmount(1)).toBe(1);
  });
});
