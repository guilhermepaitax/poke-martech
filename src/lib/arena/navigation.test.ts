import { describe, expect, it } from "vitest";
import { buildNavGrid, isBlockedAt, nextWaypoint } from "./navigation";

const bounds = { left: 0, top: 0, right: 480, bottom: 480 };
// Parede vertical no meio, aberta só embaixo.
const wall = { x: 216, y: 0, width: 48, height: 384 };

describe("buildNavGrid", () => {
  it("marca as células cobertas pelo bloqueio", () => {
    const grid = buildNavGrid(bounds, [wall], 0);
    expect(isBlockedAt(grid, { x: 240, y: 100 })).toBe(true);
    expect(isBlockedAt(grid, { x: 100, y: 100 })).toBe(false);
    expect(isBlockedAt(grid, { x: 240, y: 450 })).toBe(false);
  });

  it("infla o bloqueio pela margem", () => {
    const grid = buildNavGrid(bounds, [wall], 30);
    expect(isBlockedAt(grid, { x: 200, y: 100 })).toBe(true);
  });
});

describe("nextWaypoint", () => {
  it("devolve null quando a linha reta é livre", () => {
    const grid = buildNavGrid(bounds, [wall], 0);
    expect(nextWaypoint(grid, { x: 50, y: 50 }, { x: 50, y: 400 })).toBeNull();
  });

  it("desvia por baixo da parede", () => {
    const grid = buildNavGrid(bounds, [wall], 0);
    const point = nextWaypoint(grid, { x: 60, y: 60 }, { x: 420, y: 60 });
    expect(point).not.toBeNull();
    expect(point?.y).toBeGreaterThan(300);
    expect(point?.x).toBeLessThan(260);
  });

  it("leva para a célula livre mais perto de um alvo dentro do bloqueio", () => {
    const pool = { x: 288, y: 0, width: 192, height: 480 };
    const grid = buildNavGrid(bounds, [pool], 0);
    const point = nextWaypoint(grid, { x: 24, y: 240 }, { x: 420, y: 240 });
    expect(point).not.toBeNull();
    expect(point?.x).toBeLessThan(288);
    expect(point?.x).toBeGreaterThan(200);
  });

  it("sai para a célula livre mais perto quando começa dentro da margem", () => {
    const grid = buildNavGrid(bounds, [wall], 0);
    const point = nextWaypoint(grid, { x: 230, y: 100 }, { x: 420, y: 100 });
    expect(point).not.toBeNull();
    expect(isBlockedAt(grid, point!)).toBe(false);
  });
});
