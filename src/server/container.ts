import {
  CreateBooster,
  GetAdminBooster,
  ListAdminBoosters,
  UpdateBooster,
} from "@/server/application/use-cases/admin-boosters";
import { CreateCard } from "@/server/application/use-cases/create-card";
import { GetAdminCard } from "@/server/application/use-cases/get-admin-card";
import { GetBooster } from "@/server/application/use-cases/get-booster";
import { GetCard } from "@/server/application/use-cases/get-card";
import { AcceptTrade } from "@/server/application/use-cases/accept-trade";
import { CancelTrade } from "@/server/application/use-cases/cancel-trade";
import { CreateTrade } from "@/server/application/use-cases/create-trade";
import { FollowUser } from "@/server/application/use-cases/follow-user";
import { GetMyProfile } from "@/server/application/use-cases/get-my-profile";
import { GetOpening } from "@/server/application/use-cases/get-opening";
import { GetProfilePreview } from "@/server/application/use-cases/get-profile-preview";
import { GetPublicProfile } from "@/server/application/use-cases/get-public-profile";
import { ListFollowers } from "@/server/application/use-cases/list-followers";
import { ListFollowing } from "@/server/application/use-cases/list-following";
import { ListTradableCards } from "@/server/application/use-cases/list-tradable-cards";
import { ListTrades } from "@/server/application/use-cases/list-trades";
import { RejectTrade } from "@/server/application/use-cases/reject-trade";
import { UnfollowUser } from "@/server/application/use-cases/unfollow-user";
import { GrantSignupBonus } from "@/server/application/use-cases/grant-signup-bonus";
import { ListAdminCards } from "@/server/application/use-cases/list-admin-cards";
import { ListAdminTags } from "@/server/application/use-cases/list-admin-tags";
import { SearchAdminCards } from "@/server/application/use-cases/search-admin-cards";
import { ListBoosters } from "@/server/application/use-cases/list-boosters";
import { ListPokedexPage } from "@/server/application/use-cases/list-pokedex-page";
import { ListProfileCards } from "@/server/application/use-cases/list-profile-cards";
import { ListPokemonTypes } from "@/server/application/use-cases/list-pokemon-types";
import { OpenPack } from "@/server/application/use-cases/open-pack";
import {
  ListRarityWeights,
  UpsertRarityWeights,
} from "@/server/application/use-cases/rarity-weights";
import { UpdateCard } from "@/server/application/use-cases/update-card";
import { UploadImage } from "@/server/application/use-cases/upload-image";
import { GetCardGeneration } from "@/server/application/use-cases/get-card-generation";
import { ListCardGenerations } from "@/server/application/use-cases/list-card-generations";
import { ProcessCardGeneration } from "@/server/application/use-cases/process-card-generation";
import { RetryCardGeneration } from "@/server/application/use-cases/retry-card-generation";
import { StartCardGeneration } from "@/server/application/use-cases/start-card-generation";
import { DrizzleRateLimiter } from "@/server/infrastructure/db/drizzle/drizzle-rate-limiter";
import { DrizzleBoosterRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-booster-repository";
import { DrizzleCardGenerationRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-card-generation-repository";
import { DrizzleCardRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-card-repository";
import { DrizzleTagRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-tag-repository";
import { DrizzlePokemonTypeRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-pokemon-type-repository";
import {
  DrizzleOpeningRepository,
  DrizzlePackPurchaseRepository,
} from "@/server/infrastructure/db/drizzle/repositories/drizzle-pack-repository";
import { DrizzleFollowRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-follow-repository";
import {
  DrizzlePokedexRepository,
  DrizzleProfileRepository,
} from "@/server/infrastructure/db/drizzle/repositories/drizzle-profile-repository";
import { DrizzleTradeRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-trade-repository";
import { DrizzleRarityRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-rarity-repository";
import { DrizzleWalletRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-wallet-repository";
import { OpenAiImageGenerator } from "@/server/infrastructure/services/openai-image-generator";
import { OpenAiCardIdeaGenerator } from "@/server/infrastructure/services/openai-card-idea-generator";
import { TcgdexCardSource } from "@/server/infrastructure/services/tcgdex-card-source";
import { R2Storage } from "@/server/infrastructure/storage/r2-storage";
import { GetArenaFighters } from "@/server/application/use-cases/get-arena-fighters";
import { ListArenaRoster } from "@/server/application/use-cases/list-arena-roster";

const cards = new DrizzleCardRepository();
const tags = new DrizzleTagRepository();
const pokemonTypes = new DrizzlePokemonTypeRepository();
const boosters = new DrizzleBoosterRepository();
const rarities = new DrizzleRarityRepository();
const wallets = new DrizzleWalletRepository();
const profiles = new DrizzleProfileRepository();
const pokedex = new DrizzlePokedexRepository();
const follows = new DrizzleFollowRepository();
const trades = new DrizzleTradeRepository();
const purchases = new DrizzlePackPurchaseRepository();
const openings = new DrizzleOpeningRepository();
const storage = new R2Storage();
const cardGenerations = new DrizzleCardGenerationRepository();
const cardSource = new TcgdexCardSource();
const cardIdeas = new OpenAiCardIdeaGenerator();
const images = new OpenAiImageGenerator();

const rateLimiter = new DrizzleRateLimiter();

const container = {
  rateLimiter,
  grantSignupBonus: new GrantSignupBonus(wallets),
  getMyProfile: new GetMyProfile(profiles, follows, trades),
  getPublicProfile: new GetPublicProfile(profiles, follows),
  listProfileCards: new ListProfileCards(profiles, pokedex),
  getProfilePreview: new GetProfilePreview(profiles, follows),
  followUser: new FollowUser(profiles, follows),
  unfollowUser: new UnfollowUser(profiles, follows),
  listFollowers: new ListFollowers(profiles, follows),
  listFollowing: new ListFollowing(profiles, follows),
  createTrade: new CreateTrade(trades),
  listTrades: new ListTrades(trades),
  listTradableCards: new ListTradableCards(trades),
  acceptTrade: new AcceptTrade(trades),
  rejectTrade: new RejectTrade(trades),
  cancelTrade: new CancelTrade(trades),
  listPokedexPage: new ListPokedexPage(pokedex),
  listPokemonTypes: new ListPokemonTypes(pokemonTypes),
  getCard: new GetCard(cards),
  listBoosters: new ListBoosters(boosters),
  getBooster: new GetBooster(boosters),
  openPack: new OpenPack(purchases),
  getOpening: new GetOpening(openings),
  listAdminCards: new ListAdminCards(cards),
  searchAdminCards: new SearchAdminCards(cards),
  listAdminTags: new ListAdminTags(tags),
  getAdminCard: new GetAdminCard(cards),
  createCard: new CreateCard(cards),
  updateCard: new UpdateCard(cards),
  listAdminBoosters: new ListAdminBoosters(boosters),
  getAdminBooster: new GetAdminBooster(boosters),
  createBooster: new CreateBooster(boosters),
  updateBooster: new UpdateBooster(boosters),
  listRarityWeights: new ListRarityWeights(rarities),
  upsertRarityWeights: new UpsertRarityWeights(rarities),
  uploadImage: new UploadImage(storage),
  startCardGeneration: new StartCardGeneration(
    cardGenerations,
    cardIdeas,
    images,
  ),
  processCardGeneration: new ProcessCardGeneration(
    cardGenerations,
    cards,
    pokemonTypes,
    cardSource,
    cardIdeas,
    images,
    storage,
  ),
  getCardGeneration: new GetCardGeneration(cardGenerations, cards),
  listCardGenerations: new ListCardGenerations(cardGenerations),
  getArenaFighters: new GetArenaFighters(cards),
  listArenaRoster: new ListArenaRoster(cards),
  retryCardGeneration: new RetryCardGeneration(cardGenerations),
};

export { container };
