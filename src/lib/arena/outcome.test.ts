import { describe, expect, it } from "vitest";
import { resolveOutcome } from "./outcome";

describe("resolveOutcome", () => {
  it("segue enquanto os dois têm HP", () => {
    expect(resolveOutcome(10, 10)).toBe("ongoing");
  });

  it("vitória quando a CPU chega a zero", () => {
    expect(resolveOutcome(10, 0)).toBe("victory");
  });

  it("derrota quando o jogador chega a zero", () => {
    expect(resolveOutcome(0, 10)).toBe("defeat");
  });

  it("os dois a zero no mesmo passo é derrota do jogador", () => {
    expect(resolveOutcome(0, 0)).toBe("defeat");
  });
});
