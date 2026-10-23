import type { AttackKind } from "./combat";
import type { ArenaMap } from "./map";
import type { Facing } from "./movement";
import type { Mobility } from "./terrain";

type FighterEnergy = "fire" | "grass" | "ground" | "colorless" | "water";

type RangedStyle = "beam" | "orb" | "bone" | "star" | "bubble";

type FighterAction = "idle" | "walk" | "attack" | "shoot" | "hurt" | "defend";

type OptionalFighterAction = "shoot" | "defend";

type RequiredFighterAction = Exclude<FighterAction, OptionalFighterAction>;

type FighterSheet = {
  path: string;
  frames: number;
  rows: Record<Facing, number>;
  // Sobrescreve o frameRate padrão do clipe (folhas com muitos frames curtos).
  frameRate?: number;
};

type FighterSprite = {
  cellSize: number;
  columns: number;
  // Sem `shoot`, o ataque à distância reaproveita a folha `attack`; sem
  // `defend`, a defesa fica no `idle` (o escudo é desenhado por cima).
  sheets: Record<RequiredFighterAction, FighterSheet> &
    Partial<Record<OptionalFighterAction, FighterSheet>>;
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
  // Lado do quadrado exibido em px do mundo. Sem valor, usa o padrão da arena.
  displaySize?: number;
  // Multiplica velocidade e duração da investida do corpo a corpo.
  lungeScale?: number;
  // Corpo a corpo em giro: acerta em volta (360°) em vez do cone da mira.
  meleeSpin?: boolean;
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
  // Terrenos extras que alcança (água para quem nada). Sem valor, só terra.
  mobility?: readonly Mobility[];
  hp: number;
  attacks: Record<AttackKind, FighterAttack>;
  sprite: FighterSprite;
  tuning: FighterTuning;
};

type ArenaMatchup = {
  player: ArenaFighter;
  opponent: ArenaFighter;
  map: ArenaMap;
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
