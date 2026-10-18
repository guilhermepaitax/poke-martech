import type { CardDecorationId } from "@/lib/card-decorations";
import type { CardFrame, EnergyType, Finish, Rarity, Stage } from "@/lib/value-objects/card";
import type { GenerationItemStatus, GenerationStatus } from "@/lib/value-objects/card-generation";
import type { TradeStatus } from "@/lib/value-objects/trade";

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
  tags: string[];
};

type AdminCatalogCard = CardSummary & CardFace;

type CardOption = {
  id: string;
  name: string;
  imageUrl: string | null;
};

type CardTag = {
  id: string;
  name: string;
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

type ProfileLink = {
  username: string;
  name: string;
};

type TradeCardPreview = {
  cardId: string;
  name: string;
  number: number;
  imageUrl: string | null;
};

type TradeProposalView = {
  id: string;
  status: TradeStatus;
  createdAt: string;
  from: ProfileLink;
  to: ProfileLink;
  offered: TradeCardPreview;
  requested: TradeCardPreview;
};

type TradableCard = TradeCardPreview & {
  freeCount: number;
};

type ProfileBase = {
  id: string;
  username: string;
  name: string;
  image: string | null;
  bio: string;
  coins: number;
  recentCards: RecentCard[];
};

type Profile = ProfileBase & {
  followerCount: number;
  followingCount: number;
  pendingTrades: TradeProposalView[];
};

type PublicPokedexEntry = PokedexEntry & {
  viewerOwns: boolean;
};

type Page<T> = {
  items: T[];
  nextCursor: string | null;
};

type PokedexPage = Page<PokedexEntry> & {
  owned: number;
  total: number;
};

type PublicPokedexPage = Page<PublicPokedexEntry> & {
  total: number;
};

type PublicProfile = {
  username: string;
  name: string;
  image: string | null;
  bio: string;
  isSelf: boolean;
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
};

type ProfilePreview = {
  username: string;
  name: string;
  image: string | null;
  bio: string;
  followerCount: number;
  followingCount: number;
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
  AdminCatalogCard,
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
  CardOption,
  CardSummary,
  CardTag,
  EnergyCost,
  OpeningCard,
  PackOpening,
  Page,
  PokedexEntry,
  PokedexPage,
  PokemonType,
  Profile,
  ProfileBase,
  ProfileLink,
  ProfilePreview,
  PublicPokedexEntry,
  PublicPokedexPage,
  PublicProfile,
  RarityWeight,
  RecentCard,
  TradableCard,
  TradeCardPreview,
  TradeProposalView,
  TradeStatus,
};
