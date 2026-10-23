"use client";

import type { ArenaMap } from "@/lib/arena/map";
import { cellsToRects, createGrid, formatAreas, rectsToCells, type CellKind, type MapGrid } from "@/lib/arena/map-grid";
import { ARENA_MAPS, DEFAULT_MAP, findMap } from "@/lib/arena/maps";
import { useEffect, useRef, useState } from "react";

type EditorTool = CellKind | "erase";

const DEFAULT_CELL = 16;
const HISTORY_LIMIT = 50;

type ArtSize = { width: number; height: number };

// Malha inicial com as áreas do config (e zonas manuais); bloqueado vence água.
function gridFromMap(map: ArenaMap, art: ArtSize, cell: number): MapGrid {
  const water = [...(map.waterAreas ?? []), ...map.terrain.filter((zone) => zone.kind === "water").map((zone) => zone.rect)];
  const blocked = [...(map.blockedAreas ?? []), ...map.terrain.filter((zone) => zone.kind === "rock").map((zone) => zone.rect)];
  const empty = createGrid(art.width, art.height, cell);
  return rectsToCells(rectsToCells(empty, water, "water"), blocked, "blocked");
}

// Mesmo desenho em outro tamanho de célula, passando pelos retângulos.
function resample(grid: MapGrid, cell: number): MapGrid {
  const empty = createGrid(grid.artWidth, grid.artHeight, cell);
  const water = rectsToCells(empty, cellsToRects(grid, "water"), "water");
  return rectsToCells(water, cellsToRects(grid, "blocked"), "blocked");
}

function exportText(grid: MapGrid) {
  return [formatAreas("blockedAreas", cellsToRects(grid, "blocked")), formatAreas("waterAreas", cellsToRects(grid, "water"))].join("\n");
}

function useMapEditor() {
  const [mapId, setMapId] = useState(DEFAULT_MAP.id);
  const map = findMap(mapId) ?? DEFAULT_MAP;
  const [art, setArt] = useState<{ path: string; size: ArtSize; image: HTMLImageElement } | null>(null);
  const [cell, setCell] = useState(DEFAULT_CELL);
  const [grid, setGrid] = useState<MapGrid | null>(null);
  const [tool, setTool] = useState<EditorTool>("blocked");
  const [brush, setBrush] = useState(1);
  const history = useRef<MapGrid[]>([]);

  // Carrega a arte para saber o tamanho real e monta a malha com o config atual.
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const size = { width: image.naturalWidth, height: image.naturalHeight };
      history.current = [];
      setArt({ path: map.background.path, size, image });
      setGrid(gridFromMap(map, size, cell));
    };
    image.src = map.background.path;
    return () => {
      cancelled = true;
    };
    // A célula muda pelo `changeCell`, que reamostra sem recarregar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  function changeCell(next: number) {
    setCell(next);
    if (!grid) return;
    history.current = [...history.current, grid].slice(-HISTORY_LIMIT);
    setGrid(resample(grid, next));
  }

  // Começo de um traço: guarda o estado para o desfazer.
  function beginStroke() {
    if (grid) history.current = [...history.current, grid].slice(-HISTORY_LIMIT);
  }

  function paint(col: number, row: number, value: CellKind | null) {
    setGrid((current) => {
      if (!current) return current;
      const cells = [...current.cells];
      let changed = false;
      const reach = brush - 1;
      for (let y = row - reach; y <= row + reach; y += 1) {
        for (let x = col - reach; x <= col + reach; x += 1) {
          if (x < 0 || y < 0 || x >= current.cols || y >= current.rows) continue;
          const index = y * current.cols + x;
          if (cells[index] === value) continue;
          cells[index] = value;
          changed = true;
        }
      }
      return changed ? { ...current, cells } : current;
    });
  }

  function undo() {
    const previous = history.current.at(-1);
    if (!previous) return;
    history.current = history.current.slice(0, -1);
    setCell(previous.cell);
    setGrid(previous);
  }

  function clear() {
    if (!grid) return;
    beginStroke();
    setGrid(createGrid(grid.artWidth, grid.artHeight, grid.cell));
  }

  function reset() {
    if (!art) return;
    beginStroke();
    setGrid(gridFromMap(map, art.size, cell));
  }

  const counts = grid
    ? { blocked: cellsToRects(grid, "blocked").length, water: cellsToRects(grid, "water").length }
    : { blocked: 0, water: 0 };

  return {
    maps: ARENA_MAPS,
    map,
    setMapId,
    art: art?.path === map.background.path ? art : null,
    grid,
    cell,
    changeCell,
    tool,
    setTool,
    brush,
    setBrush,
    beginStroke,
    paint,
    undo,
    clear,
    reset,
    counts,
    exportText: () => (grid ? exportText(grid) : ""),
  };
}

export { useMapEditor };
export type { EditorTool };
