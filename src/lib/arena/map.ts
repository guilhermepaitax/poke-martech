import type { Point } from "./combat";
import type { ObstacleSpec } from "./obstacles";
import type { NormRect, TerrainZone, WaterBoost } from "./terrain";

// Paleta dos blocos quebráveis; combina com as pedras da arte do mapa.
type ObstacleTheme = "sandstone" | "basalt";

// Margem em px do mundo entre a borda da arte e a área onde se anda.
type WalkInset = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type MapBackground = {
  key: string;
  path: string;
  // Arte em pixel art: escala com filtro NEAREST para não borrar.
  pixelArt?: boolean;
};

// Enfeite interativo do cenário, em fração da arte.
type MapProp = {
  kind: "starfish";
  at: Point;
};

// Particularidade mostrada na escolha do mapa.
type MapTrait = {
  label: string;
  tone: "water" | "neutral" | "boost";
};

type ArenaMap = {
  id: string;
  name: string;
  title: string;
  description: string;
  traits: readonly MapTrait[];
  background: MapBackground;
  walkInset: WalkInset;
  // Spawn em fração da arte. Sem valor, os lutadores nascem nas laterais do centro.
  spawn?: { player: Point; opponent: Point };
  obstacles: readonly ObstacleSpec[];
  obstacleTheme: ObstacleTheme;
  // Zonas escritas à mão. Prefira as áreas do editor abaixo.
  terrain: readonly TerrainZone[];
  // Áreas exportadas pelo editor (/admin/mapas), em fração da arte.
  blockedAreas?: readonly NormRect[];
  waterAreas?: readonly NormRect[];
  water?: WaterBoost;
  props?: readonly MapProp[];
  ambient?: { fish?: boolean };
};

export type { ArenaMap, MapBackground, MapProp, MapTrait, ObstacleTheme, WalkInset };
