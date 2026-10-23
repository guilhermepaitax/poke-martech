import type { NormRect } from "./terrain";

// Malha do editor de mapas: células quadradas em px da arte, marcadas como
// bloqueadas ou água. Exporta retângulos em fração da arte para o config do mapa.
type CellKind = "blocked" | "water";

type MapGrid = {
  cols: number;
  rows: number;
  // Lado da célula e tamanho da arte, em px da arte.
  cell: number;
  artWidth: number;
  artHeight: number;
  cells: (CellKind | null)[];
};

const AREA_DECIMALS = 4;

function createGrid(artWidth: number, artHeight: number, cell: number): MapGrid {
  const cols = Math.max(1, Math.ceil(artWidth / cell));
  const rows = Math.max(1, Math.ceil(artHeight / cell));
  return { cols, rows, cell, artWidth, artHeight, cells: new Array(cols * rows).fill(null) };
}

function round(value: number) {
  const factor = 10 ** AREA_DECIMALS;
  return Math.round(value * factor) / factor;
}

// Marca as células cujo centro cai em algum retângulo.
function rectsToCells(grid: MapGrid, rects: readonly NormRect[], kind: CellKind): MapGrid {
  const cells = [...grid.cells];
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const x = ((col + 0.5) * grid.cell) / grid.artWidth;
      const y = ((row + 0.5) * grid.cell) / grid.artHeight;
      const inside = rects.some(
        (rect) => x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height,
      );
      if (inside) cells[row * grid.cols + col] = kind;
    }
  }
  return { ...grid, cells };
}

// Junta as células de um tipo em retângulos: estende para a direita e depois
// desce enquanto a faixa inteira continua do mesmo tipo.
function cellsToRects(grid: MapGrid, kind: CellKind): NormRect[] {
  const used = new Uint8Array(grid.cells.length);
  const take = (col: number, row: number) =>
    grid.cells[row * grid.cols + col] === kind && used[row * grid.cols + col] === 0;
  const rects: NormRect[] = [];
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      if (!take(col, row)) continue;
      let width = 1;
      while (col + width < grid.cols && take(col + width, row)) width += 1;
      let height = 1;
      while (row + height < grid.rows) {
        let full = true;
        for (let offset = 0; offset < width && full; offset += 1) full = take(col + offset, row + height);
        if (!full) break;
        height += 1;
      }
      for (let y = row; y < row + height; y += 1) {
        for (let x = col; x < col + width; x += 1) used[y * grid.cols + x] = 1;
      }
      const left = (col * grid.cell) / grid.artWidth;
      const top = (row * grid.cell) / grid.artHeight;
      const right = Math.min(1, ((col + width) * grid.cell) / grid.artWidth);
      const bottom = Math.min(1, ((row + height) * grid.cell) / grid.artHeight);
      rects.push({
        x: round(left),
        y: round(top),
        width: round(right - left),
        height: round(bottom - top),
      });
    }
  }
  return rects;
}

// Texto pronto para colar no arquivo do mapa.
function formatAreas(name: string, rects: readonly NormRect[]) {
  if (rects.length === 0) return `${name}: [],`;
  const lines = rects.map(
    (rect) => `  { x: ${rect.x}, y: ${rect.y}, width: ${rect.width}, height: ${rect.height} },`,
  );
  return `${name}: [\n${lines.join("\n")}\n],`;
}

export { cellsToRects, createGrid, formatAreas, rectsToCells };
export type { CellKind, MapGrid };
