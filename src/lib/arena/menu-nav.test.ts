import { describe, expect, it } from "vitest";
import { menuDirection, nextMenuIndex, type MenuRect } from "./menu-nav";

function tile(x: number, y: number): MenuRect {
  return { x, y, width: 40, height: 40 };
}

// Grade 3x2 + botão largo embaixo.
const GRID = [tile(0, 0), tile(50, 0), tile(100, 0), tile(0, 50), tile(50, 50), { x: 0, y: 120, width: 140, height: 40 }];

describe("menuDirection", () => {
  it("ignora analógico perto do centro", () => {
    expect(menuDirection({ x: 0.3, y: -0.2 })).toBeNull();
  });

  it("escolhe o eixo dominante", () => {
    expect(menuDirection({ x: 0.9, y: 0.6 })).toBe("right");
    expect(menuDirection({ x: -0.2, y: -1 })).toBe("up");
  });
});

describe("nextMenuIndex", () => {
  it("anda na linha e na coluna", () => {
    expect(nextMenuIndex(GRID, 0, "right")).toBe(1);
    expect(nextMenuIndex(GRID, 1, "down")).toBe(4);
    expect(nextMenuIndex(GRID, 4, "left")).toBe(3);
  });

  it("prefere o vizinho alinhado ao da diagonal", () => {
    expect(nextMenuIndex(GRID, 2, "down")).toBe(4);
    expect(nextMenuIndex(GRID, 3, "up")).toBe(0);
  });

  it("desce para o botão largo", () => {
    expect(nextMenuIndex(GRID, 4, "down")).toBe(5);
  });

  it("fica parado na borda", () => {
    expect(nextMenuIndex(GRID, 2, "right")).toBeNull();
    expect(nextMenuIndex(GRID, 0, "up")).toBeNull();
  });
});
