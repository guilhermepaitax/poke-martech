import { describe, expect, it } from "vitest";
import { ATTACK_NAMES } from "./attack-names";
import { EFFECT_TEXT, printedDamage, translateEffect } from "./effects";
import { fuseAttackName } from "./fuse";

describe("tradução dos efeitos", () => {
  it("traduz cada efeito conhecido", () => {
    for (const [source, translation] of Object.entries(EFFECT_TEXT)) {
      expect(translateEffect(source)).toBe(translation);
    }
  });

  it("recusa efeito desconhecido", () => {
    expect(() => translateEffect("Not a real effect.")).toThrow(/sem tradução/);
  });

  it("guarda só o dano fixo impresso", () => {
    expect(printedDamage("50×")).toBeNull();
    expect(printedDamage("20+")).toBe(20);
    expect(printedDamage("40")).toBe(40);
    expect(printedDamage(null)).toBeNull();
  });

  it("mantém o nome do ataque dentro do limite", () => {
    for (const attack of Object.keys(ATTACK_NAMES)) {
      expect(fuseAttackName("Hércules", attack).length).toBeLessThanOrEqual(40);
    }
  });
});
