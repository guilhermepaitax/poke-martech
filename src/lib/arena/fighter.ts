import type { AttackKind } from "./combat";
import type { Facing } from "./movement";

type FighterEnergy = "fire" | "grass";

type RangedStyle = "beam" | "orb";

type FighterAction = "idle" | "walk" | "attack" | "hurt";

type FighterSheet = {
  path: string;
  frames: number;
  rows: Record<Facing, number>;
};

type FighterSprite = {
  cellSize: number;
  columns: number;
  sheets: Record<FighterAction, FighterSheet>;
};

// Ajustes de jogo/render por personagem. Medidas da hitbox em px de uma
// célula de `bodyReferenceCell`; escalam proporcionalmente ao `sprite.cellSize`.
type FighterTuning = {
  speed: number;
  bodyReferenceCell: number;
  bodyWidth: number;
  bodyHeight: number;
  bodyOffsetY: number;
  // Distância do centro do sprite até os pés (âncora do marcador e efeitos).
  feetOffsetY: number;
  // Tint aplicado quando os dois lados usam o mesmo personagem.
  mirrorTint: number;
  depth: number;
};

type FighterBanner = {
  path: string;
  // Ponto do rosto na arte, em % da imagem. Centraliza o recorte do retrato.
  focus: `${number}% ${number}%`;
};

type FighterAttack = {
  name: string;
  hudName: string;
  description: string;
  power: number;
};

type ArenaFighter = {
  id: string;
  name: string;
  title: string;
  description: string;
  banner: FighterBanner;
  energy: FighterEnergy;
  ranged: RangedStyle;
  hp: number;
  attacks: Record<AttackKind, FighterAttack>;
  sprite: FighterSprite;
  tuning: FighterTuning;
};

type ArenaMatchup = {
  player: ArenaFighter;
  opponent: ArenaFighter;
};

const EIGHT_WAY_ROWS: Record<Facing, number> = {
  south: 1,
  "south-east": 2,
  east: 3,
  "north-east": 4,
  north: 5,
  "north-west": 6,
  west: 7,
  "south-west": 8,
};

const CARDINAL_ROWS: Record<Facing, number> = {
  south: 1,
  "south-east": 2,
  east: 2,
  "north-east": 2,
  north: 3,
  "north-west": 4,
  west: 4,
  "south-west": 4,
};

export { CARDINAL_ROWS, EIGHT_WAY_ROWS };
export type {
  ArenaFighter,
  ArenaMatchup,
  FighterAction,
  FighterAttack,
  FighterBanner,
  FighterEnergy,
  FighterSheet,
  FighterSprite,
  FighterTuning,
  RangedStyle,
};
