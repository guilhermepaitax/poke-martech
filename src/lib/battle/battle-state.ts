import type { StatusCondition } from "@/lib/value-objects/attack-effect";
import type { EnergyType } from "@/lib/value-objects/card";
import type { CardFace } from "@/types/catalog";

const SIDES = ["player", "cpu"] as const;
const POINTS_TO_WIN = 3;
const MAX_BENCH = 3;
const OPENING_HAND = 5;
const MAX_TURNS = 60;
const CONFUSION_DAMAGE = 30;
const POISON_DAMAGE = 10;
const BURN_DAMAGE = 20;

type Side = (typeof SIDES)[number];

type BattleCardData = CardFace & {
  cardId: string;
  evolvesFromId: string | null;
};

type CardInstance = {
  uid: string;
  cardId: string;
};

type PokemonInPlay = {
  uid: string;
  cardId: string;
  stack: string[];
  damage: number;
  energies: EnergyType[];
  status: StatusCondition[];
  playedTurn: number;
  preventDamage: boolean;
};

type SideState = {
  deck: CardInstance[];
  hand: CardInstance[];
  discard: string[];
  active: PokemonInPlay | null;
  bench: PokemonInPlay[];
  points: number;
  energyTypes: EnergyType[];
  currentEnergy: EnergyType | null;
  retreated: boolean;
  setupDone: boolean;
};

type BattlePhase = "setup" | "main" | "promote" | "finished";

type BattleWinner = Side | "draw";

type BattleState = {
  rng: number;
  turn: number;
  firstSide: Side;
  current: Side;
  phase: BattlePhase;
  pendingPromotion: Side[];
  awaitingTurnAdvance: boolean;
  checkupDone: boolean;
  winner: BattleWinner | null;
  sides: Record<Side, SideState>;
  cards: Record<string, BattleCardData>;
};

function otherSide(side: Side): Side {
  return side === "player" ? "cpu" : "player";
}

export {
  BURN_DAMAGE,
  CONFUSION_DAMAGE,
  MAX_BENCH,
  MAX_TURNS,
  OPENING_HAND,
  otherSide,
  POINTS_TO_WIN,
  POISON_DAMAGE,
  SIDES,
};
export type {
  BattleCardData,
  BattlePhase,
  BattleState,
  BattleWinner,
  CardInstance,
  PokemonInPlay,
  Side,
  SideState,
};
