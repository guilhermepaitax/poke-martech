import type { BattleAction } from "@/lib/battle/battle-action";
import type { BattleEvent } from "@/lib/battle/battle-event";
import type { BattlePhase, BattleWinner, Side } from "@/lib/battle/battle-state";
import type { StatusCondition } from "@/lib/value-objects/attack-effect";
import type { BattleDifficulty, BattleStatus } from "@/lib/value-objects/battle";
import type { EnergyType } from "@/lib/value-objects/card";
import type { CardFace, CardSummary } from "@/types/catalog";

type DeckCardInput = {
  cardId: string;
  copies: number;
};

type BattleDeckSummary = {
  id: string;
  name: string;
  energyTypes: EnergyType[];
  cardCount: number;
};

type BattleDeckDetail = BattleDeckSummary & {
  cards: (DeckCardInput & { card: CardSummary })[];
};

type BattleDeckInput = {
  name: string;
  energyTypes: EnergyType[];
  cards: DeckCardInput[];
};

type BattleOpponentSummary = {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  description: string;
  difficulty: BattleDifficulty;
  rewardCoins: number;
  active: boolean;
};

type BattleOpponentDetail = BattleOpponentSummary & {
  energyTypes: EnergyType[];
  sortOrder: number;
  cards: DeckCardInput[];
};

type BattleOpponentInput = {
  name: string;
  slug: string;
  avatarUrl: string | null;
  description: string;
  difficulty: BattleDifficulty;
  rewardCoins: number;
  energyTypes: EnergyType[];
  active: boolean;
  sortOrder: number;
  cards: DeckCardInput[];
};

type BattlePokemonView = {
  uid: string;
  cardId: string;
  card: CardFace;
  damage: number;
  remainingHp: number;
  energies: EnergyType[];
  status: StatusCondition[];
};

type BattleSideView = {
  active: BattlePokemonView | null;
  bench: BattlePokemonView[];
  hand: (CardFace & { uid: string; cardId: string })[] | null;
  handCount: number;
  deckCount: number;
  discardCount: number;
  points: number;
  currentEnergy: EnergyType | null;
  energyTypes: EnergyType[];
};

type BattleView = {
  id: string;
  version: number;
  status: BattleStatus;
  phase: BattlePhase;
  current: Side;
  turn: number;
  firstSide: Side;
  winner: BattleWinner | null;
  pendingPromotion: Side[];
  rewardCoins: number;
  opponent: BattleOpponentSummary;
  player: BattleSideView;
  cpu: BattleSideView;
  legalActions: BattleAction[];
};

type BattleActionResult = {
  battle: BattleView;
  events: BattleEvent[];
};

type ActiveBattleSummary = {
  id: string;
  opponentName: string;
  opponentAvatarUrl: string | null;
  createdAt: string;
};

export type {
  ActiveBattleSummary,
  BattleActionResult,
  BattleDeckDetail,
  BattleDeckInput,
  BattleDeckSummary,
  BattleOpponentDetail,
  BattleOpponentInput,
  BattleOpponentSummary,
  BattlePokemonView,
  BattleSideView,
  BattleView,
  DeckCardInput,
};
