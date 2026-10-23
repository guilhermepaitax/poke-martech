import type { Point, Rect } from "./combat";

const NAV_CELL = 48;

type NavBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

// Grade de células livres/bloqueadas para a CPU contornar água e rocha.
type NavGrid = {
  left: number;
  top: number;
  cell: number;
  cols: number;
  rows: number;
  blocked: Uint8Array;
};

function overlaps(rect: Rect, x: number, y: number, size: number, margin: number) {
  return (
    x + size > rect.x - margin &&
    x < rect.x + rect.width + margin &&
    y + size > rect.y - margin &&
    y < rect.y + rect.height + margin
  );
}

// `margin` infla os bloqueios pelo meio-corpo do lutador.
function buildNavGrid(bounds: NavBounds, blocks: readonly Rect[], margin: number, cell = NAV_CELL): NavGrid {
  const cols = Math.max(1, Math.ceil((bounds.right - bounds.left) / cell));
  const rows = Math.max(1, Math.ceil((bounds.bottom - bounds.top) / cell));
  const blocked = new Uint8Array(cols * rows);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = bounds.left + col * cell;
      const y = bounds.top + row * cell;
      if (blocks.some((rect) => overlaps(rect, x, y, cell, margin))) blocked[row * cols + col] = 1;
    }
  }
  return { left: bounds.left, top: bounds.top, cell, cols, rows, blocked };
}

function cellOf(grid: NavGrid, point: Point) {
  const col = Math.min(grid.cols - 1, Math.max(0, Math.floor((point.x - grid.left) / grid.cell)));
  const row = Math.min(grid.rows - 1, Math.max(0, Math.floor((point.y - grid.top) / grid.cell)));
  return row * grid.cols + col;
}

function cellCenter(grid: NavGrid, index: number): Point {
  const col = index % grid.cols;
  const row = Math.floor(index / grid.cols);
  return {
    x: grid.left + (col + 0.5) * grid.cell,
    y: grid.top + (row + 0.5) * grid.cell,
  };
}

function isBlockedAt(grid: NavGrid, point: Point) {
  return grid.blocked[cellOf(grid, point)] === 1;
}

// Linha reta sem passar por célula bloqueada (amostrada a cada terço de célula).
function clearLine(grid: NavGrid, from: Point, to: Point) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / (grid.cell / 3)));
  const start = cellOf(grid, from);
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const index = cellOf(grid, { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
    if (index !== start && grid.blocked[index] === 1) return false;
  }
  return true;
}

const NEIGHBORS: readonly [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

function nearestFree(grid: NavGrid, from: Point): Point | null {
  let best: Point | null = null;
  let bestDistance = Infinity;
  for (let index = 0; index < grid.blocked.length; index += 1) {
    if (grid.blocked[index] === 1) continue;
    const center = cellCenter(grid, index);
    const distance = Math.hypot(center.x - from.x, center.y - from.y);
    if (distance < bestDistance) {
      best = center;
      bestDistance = distance;
    }
  }
  return best;
}

// Próximo ponto do caminho até `to`. `null` quando a linha reta já é livre.
// Alvo inalcançável (dentro da água) leva à célula livre mais perto dele.
function nextWaypoint(grid: NavGrid, from: Point, to: Point): Point | null {
  if (clearLine(grid, from, to)) return null;
  const start = cellOf(grid, from);
  // Começou encostado num bloqueio (margem inflada): sai para a célula livre mais perto.
  if (grid.blocked[start] === 1) return nearestFree(grid, from);
  const goal = cellOf(grid, to);
  const parent = new Int32Array(grid.cols * grid.rows).fill(-1);
  parent[start] = start;
  const queue = [start];
  let best = start;
  let bestDistance = Infinity;
  for (let head = 0; head < queue.length; head += 1) {
    const index = queue[head];
    if (index === undefined) break;
    const center = cellCenter(grid, index);
    const distance = Math.hypot(center.x - to.x, center.y - to.y);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
    if (index === goal) break;
    const col = index % grid.cols;
    const row = Math.floor(index / grid.cols);
    for (const [dx, dy] of NEIGHBORS) {
      const nextCol = col + dx;
      const nextRow = row + dy;
      if (nextCol < 0 || nextRow < 0 || nextCol >= grid.cols || nextRow >= grid.rows) continue;
      const next = nextRow * grid.cols + nextCol;
      if (parent[next] !== -1 || grid.blocked[next] === 1) continue;
      // Diagonal só quando os dois lados retos estão livres (não corta quina).
      if (dx !== 0 && dy !== 0) {
        if (grid.blocked[row * grid.cols + nextCol] === 1) continue;
        if (grid.blocked[nextRow * grid.cols + col] === 1) continue;
      }
      parent[next] = index;
      queue.push(next);
    }
  }
  const path: number[] = [];
  for (let index = best; index !== start; index = parent[index] ?? start) path.push(index);
  if (path.length === 0) return cellCenter(grid, start);
  path.reverse();
  // Pula direto para o ponto mais adiante que a linha reta alcança.
  let waypoint = cellCenter(grid, path[0] ?? start);
  for (const index of path) {
    const center = cellCenter(grid, index);
    if (!clearLine(grid, from, center)) break;
    waypoint = center;
  }
  return waypoint;
}

export { buildNavGrid, clearLine, isBlockedAt, NAV_CELL, nextWaypoint };
export type { NavBounds, NavGrid };
