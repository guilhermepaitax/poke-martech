import { describe, expect, it } from "vitest";
import {
  chargedDamage,
  chargeLevel,
  chargeProgress,
  cooldownRatio,
} from "./charge";

describe("chargeLevel", () => {
  it("clique rápido não carrega", () => {
    expect(chargeLevel(0)).toBe(0);
    expect(chargeLevel(999)).toBe(0);
    expect(chargeLevel(-50)).toBe(0);
  });

  it("um segundo chega ao nível 1", () => {
    expect(chargeLevel(1000)).toBe(1);
    expect(chargeLevel(1999)).toBe(1);
  });

  it("dois segundos ou mais chegam ao nível 2", () => {
    expect(chargeLevel(2000)).toBe(2);
    expect(chargeLevel(Number.POSITIVE_INFINITY)).toBe(2);
  });
});

describe("chargeProgress", () => {
  it("vai de 0 a 1 até o nível máximo", () => {
    expect(chargeProgress(0)).toBe(0);
    expect(chargeProgress(1000)).toBe(0.5);
    expect(chargeProgress(5000)).toBe(1);
    expect(chargeProgress(Number.NaN)).toBe(0);
  });
});

describe("chargedDamage", () => {
  it("multiplica o dano pelo nível", () => {
    expect(chargedDamage(10, 0)).toBe(10);
    expect(chargedDamage(10, 1)).toBe(15);
    expect(chargedDamage(10, 2)).toBe(22);
  });

  it("nunca fica abaixo de 1 e não cria dano do nada", () => {
    expect(chargedDamage(0.2, 1)).toBe(1);
    expect(chargedDamage(0, 2)).toBe(0);
  });
});

describe("cooldownRatio", () => {
  it("devolve a fração restante do cooldown", () => {
    expect(cooldownRatio(1000, 1000, 500)).toBe(0);
    expect(cooldownRatio(1250, 1500, 500)).toBe(0.5);
    expect(cooldownRatio(1000, 1500, 500)).toBe(1);
    expect(cooldownRatio(0, 2000, 500)).toBe(1);
    expect(cooldownRatio(0, 100, 0)).toBe(0);
  });
});
