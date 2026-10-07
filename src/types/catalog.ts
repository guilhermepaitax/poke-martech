import type { CardDecorationId } from "@/lib/card-decorations";
import type { AttackEffect } from "@/lib/value-objects/attack-effect";
import type { CardFrame, EnergyType, Finish, Rarity, Stage } from "@/lib/value-objects/card";
import type { GenerationItemStatus, GenerationStatus } from "@/lib/value-objects/card-generation";

type CardArtwork = {
  imageX: number;
  imageY: number;
  imageScale: number;
  overlayImageUrl: string | null;
  overlayX: number;
  overlayY: number;
  overlayScale: number;
  decorationAsset: CardDecorationId | null;
  decorationImageUrl: string | null;
};

type EnergyCost = {
  type: EnergyType;
  count: number;
};

type Attack = {
  name: string;
  damage: number | null;
  effectText: string;
  effects: AttackEffect[];
  energyCost: EnergyCost[];
  sortOrder: number;
};

type CardSummary = {
  id: string;
  number: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  hp: number;
  energyType: EnergyType;
  stage: Stage;
  rarity: Rarity;
  published: boolean;
};

type CardEvolutionOrigin = {
  name: string;
  imageUrl: string | null;
};

type CardDetail = CardSummary &
  CardArtwork & {
    frame: CardFrame;
    evolvesFromId: string | null;
    evolvesFrom: CardEvolutionOrigin | null;
    retreatCost: number;
    weaknessType: EnergyType | null;
    weaknessModifier: number;
    flavorText: string;
    attacks: Attack[];
    ownedCount: number;
  };

type CardInput = Omit<CardDetail, "id" | "number" | "ownedCount" | "evolvesFrom">;

type CardFace = CardArtwork & {
  name: string;
  imageUrl: string | null;
  rarity: Rarity;
  hp: number;
  energyType: EnergyType;
  frame: CardFrame;
  stage: Stage;
  evolvesFrom: CardEvolutionOrigin | null;
  retreatCost: number;
  weaknessType: EnergyType | null;
  weaknessModifier: number;
  flavorText: string;
  attacks: Attack[];
};

type PokedexEntry = {
  id: string;
  number: number;
  ownedCount: number;
  card: CardFace | null;
};

type BoosterCardInput = {
  cardId: string;
  weightOverride: number | null;
};

type BoosterSummary = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  description: string;
  price: number;
  cardsPerPack: number;
  stock: number | null;
  featuredSlotMinRarity: Rarity | null;
  finish: Finish;
  active: boolean;
};

type BoosterDetail = BoosterSummary & {
  cards: BoosterCardInput[];
};

type BoosterInput = Omit<BoosterDetail, "id">;

type OpeningCard = CardFace & {
  slot: number;
  cardId: string;
};

type PackOpening = {
  id: string;
  boosterName: string;
  boosterImageUrl: string | null;
  boosterFinish: Finish;
  cards: OpeningCard[];
};

type RecentCard = {
  id: string;
  cardId: string;
  number: number;
  obtainedAt: string;
  card: CardFace;
};

type Profile = {
  id: string;
  username: string;
  name: string;
  image: string | null;
  bio: string;
  coins: number;
  recentCards: RecentCard[];
};

type PublicProfile = {
  username: string;
  name: string;
  image: string | null;
  bio: string;
  pokedex: PokedexEntry[];
};

type RarityWeight = {
  rarity: Rarity;
  weight: number;
};

type PokemonType = {
  code: EnergyType;
  name: string;
};

type CardGenerationInput = {
  personName: string;
  personDescription: string;
  personImageUrl: string;
  sourceUrls: string[];
  count: number | null;
};

type CardGenerationItemView = {
  id: string;
  position: number;
  sourceUrl: string | null;
  sourceName: string | null;
  sourceImageUrl: string | null;
  status: GenerationItemStatus;
  error: string | null;
  card: CardDetail | null;
};

type CardGenerationSummary = {
  id: string;
  personName: string;
  personImageUrl: string;
  requestedCount: number;
  doneCount: number;
  failedCount: number;
  status: GenerationStatus;
  createdAt: string;
};

type CardGenerationDetail = CardGenerationSummary & {
  personDescription: string;
  error: string | null;
  canRetry: boolean;
  items: CardGenerationItemView[];
};

export type {
  CardGenerationDetail,
  CardGenerationInput,
  CardGenerationItemView,
  CardGenerationSummary,
  Attack,
  CardArtwork,
  BoosterCardInput,
  BoosterDetail,
  BoosterInput,
  BoosterSummary,
  CardDetail,
  CardEvolutionOrigin,
  CardFace,
  CardInput,
  CardSummary,
  EnergyCost,
  OpeningCard,
  PackOpening,
  PokedexEntry,
  PokemonType,
  Profile,
  PublicProfile,
  RarityWeight,
  RecentCard,
};
