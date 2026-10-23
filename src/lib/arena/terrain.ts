import type { Point, Rect } from "./combat";

// Como o lutador se move além de andar. Quem não tem nada só pisa em terra.
type Mobility = "swim" | "fly";

type TerrainKind = "water" | "rock";

// Retângulo em fração da arte do mapa (0 a 1), independente do tamanho do mundo.
type NormRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TerrainZone = {
  kind: TerrainKind;
  rect: NormRect;
};

// Bônus de quem nada enquanto está na água.
type WaterBoost = {
  speedScale: number;
  damageScale: number;
};

type TerrainScale = {
  speed: number;
  damage: number;
};

type WorldSize = {
  width: number;
  height: number;
};

const NEUTRAL_SCALE: TerrainScale = { speed: 1, damage: 1 };

// Quem pode entrar em cada terreno. Rocha fica para quem voa.
const TERRAIN_ACCESS: Record<TerrainKind, readonly Mobility[]> = {
  water: ["swim", "fly"],
  rock: ["fly"],
};

type TerrainSource = {
  terrain: readonly TerrainZone[];
  blockedAreas?: readonly NormRect[];
  waterAreas?: readonly NormRect[];
};

// Todas as zonas do mapa: as manuais mais as áreas do editor (bloqueado = rocha).
function mapTerrain(map: TerrainSource): TerrainZone[] {
  return [
    ...map.terrain,
    ...(map.waterAreas ?? []).map((rect) => ({ kind: "water" as const, rect })),
    ...(map.blockedAreas ?? []).map((rect) => ({ kind: "rock" as const, rect })),
  ];
}

function canEnter(kind: TerrainKind, mobility: readonly Mobility[] = []) {
  return TERRAIN_ACCESS[kind].some((way) => mobility.includes(way));
}

function toWorldRect(rect: NormRect, size: WorldSize): Rect {
  return {
    x: rect.x * size.width,
    y: rect.y * size.height,
    width: rect.width * size.width,
    height: rect.height * size.height,
  };
}

function insideRect(point: Point, rect: Rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

// Zona sob o ponto; rocha vence água quando as duas se sobrepõem.
function zoneAt(point: Point, zones: readonly TerrainZone[], size: WorldSize): TerrainKind | null {
  let found: TerrainKind | null = null;
  for (const zone of zones) {
    if (!insideRect(point, toWorldRect(zone.rect, size))) continue;
    if (zone.kind === "rock") return "rock";
    found = zone.kind;
  }
  return found;
}

function isWaterAt(point: Point, zones: readonly TerrainZone[], size: WorldSize) {
  return zoneAt(point, zones, size) === "water";
}

// Zonas que o lutador não atravessa, já no tamanho do mundo.
function blockedRects(
  zones: readonly TerrainZone[],
  size: WorldSize,
  mobility: readonly Mobility[] = [],
): Rect[] {
  return zones.filter((zone) => !canEnter(zone.kind, mobility)).map((zone) => toWorldRect(zone.rect, size));
}

function terrainScale(
  boost: WaterBoost | undefined,
  mobility: readonly Mobility[] = [],
  inWater: boolean,
): TerrainScale {
  if (!boost || !inWater || !mobility.includes("swim")) return NEUTRAL_SCALE;
  return { speed: boost.speedScale, damage: boost.damageScale };
}

export {
  blockedRects,
  canEnter,
  isWaterAt,
  mapTerrain,
  NEUTRAL_SCALE,
  TERRAIN_ACCESS,
  terrainScale,
  toWorldRect,
  zoneAt,
};
export type { Mobility, NormRect, TerrainKind, TerrainScale, TerrainZone, WaterBoost, WorldSize };
