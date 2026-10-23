import { describe, expect, it } from "vitest";
import { cellsToRects, createGrid, formatAreas, rectsToCells, type MapGrid } from "./map-grid";

function paint(grid: MapGrid, cells: [number, number][], kind: "blocked" | "water" = "blocked"): MapGrid {
  const next = [...grid.cells];
  cells.forEach(([col, row]) => {
    next[row * grid.cols + col] = kind;
  });
  return { ...grid, cells: next };
}

describe("createGrid", () => {
  it("cobre a arte inteira com células arredondadas para cima", () => {
    const grid = createGrid(100, 50, 16);
    expect(grid.cols).toBe(7);
    expect(grid.rows).toBe(4);
    expect(grid.cells).toHaveLength(28);
  });
});

describe("cellsToRects", () => {
  it("junta um bloco 3x2 num retângulo só", () => {
    const grid = paint(createGrid(100, 100, 10), [
      [1, 1],
      [2, 1],
      [3, 1],
      [1, 2],
      [2, 2],
      [3, 2],
    ]);
    expect(cellsToRects(grid, "blocked")).toEqual([{ x: 0.1, y: 0.1, width: 0.3, height: 0.2 }]);
  });

  it("forma em L vira dois retângulos e separa os tipos", () => {
    let grid = paint(createGrid(100, 100, 10), [
      [0, 0],
      [1, 0],
      [0, 1],
    ]);
    grid = paint(grid, [[5, 5]], "water");
    expect(cellsToRects(grid, "blocked")).toHaveLength(2);
    expect(cellsToRects(grid, "water")).toEqual([{ x: 0.5, y: 0.5, width: 0.1, height: 0.1 }]);
  });

  it("não passa da borda da arte na última célula", () => {
    const grid = paint(createGrid(100, 100, 16), [[6, 6]]);
    const [rect] = cellsToRects(grid, "blocked");
    expect(rect!.x + rect!.width).toBeCloseTo(1);
    expect(rect!.y + rect!.height).toBeCloseTo(1);
  });
});

describe("rectsToCells", () => {
  it("ida e volta mantém as mesmas células", () => {
    const grid = paint(createGrid(160, 90, 10), [
      [2, 2],
      [3, 2],
      [3, 3],
      [10, 5],
    ]);
    const rects = cellsToRects(grid, "blocked");
    const back = rectsToCells(createGrid(160, 90, 10), rects, "blocked");
    expect(back.cells).toEqual(grid.cells);
  });
});

describe("formatAreas", () => {
  it("gera texto colável no config", () => {
    expect(formatAreas("blockedAreas", [{ x: 0.1, y: 0.2, width: 0.3, height: 0.4 }])).toBe(
      "blockedAreas: [\n  { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },\n],",
    );
    expect(formatAreas("waterAreas", [])).toBe("waterAreas: [],");
  });
});
