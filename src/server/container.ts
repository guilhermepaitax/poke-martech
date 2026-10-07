import {
  CreateBooster,
  GetAdminBooster,
  ListAdminBoosters,
  UpdateBooster,
} from "@/server/application/use-cases/admin-boosters";
import { DeleteDeck, GetDeck, ListMyDecks, SaveDeck } from "@/server/application/use-cases/battle-decks";
import {
  CreateOpponent,
  GetAdminOpponent,
  ListAdminOpponents,
  ListBattleOpponents,
  UpdateOpponent,
} from "@/server/application/use-cases/battle-opponents";
import {
  ForfeitBattle,
  GetBattle,
  ListActiveBattle,
  StartBattle,
  SubmitBattleAction,
} from "@/server/application/use-cases/battles";
import { CreateCard } from "@/server/application/use-cases/create-card";
import { GetAdminCard } from "@/server/application/use-cases/get-admin-card";
import { GetBooster } from "@/server/application/use-cases/get-booster";
import { GetCard } from "@/server/application/use-cases/get-card";
import { GetMyProfile } from "@/server/application/use-cases/get-my-profile";
import { GetOpening } from "@/server/application/use-cases/get-opening";
import { GetPublicProfile } from "@/server/application/use-cases/get-public-profile";
import { GrantSignupBonus } from "@/server/application/use-cases/grant-signup-bonus";
import { ListAdminCards } from "@/server/application/use-cases/list-admin-cards";
import { ListBoosters } from "@/server/application/use-cases/list-boosters";
import { ListPokedex } from "@/server/application/use-cases/list-pokedex";
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
import { DrizzleBattleDeckRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-battle-deck-repository";
import { DrizzleBattleOpponentRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-battle-opponent-repository";
import { DrizzleBattleRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-battle-repository";
import { DrizzleBoosterRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-booster-repository";
import { DrizzleCardGenerationRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-card-generation-repository";
import { DrizzleCardRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-card-repository";
import { DrizzlePokemonTypeRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-pokemon-type-repository";
import {
  DrizzleOpeningRepository,
  DrizzlePackPurchaseRepository,
} from "@/server/infrastructure/db/drizzle/repositories/drizzle-pack-repository";
import {
  DrizzlePokedexRepository,
  DrizzleProfileRepository,
} from "@/server/infrastructure/db/drizzle/repositories/drizzle-profile-repository";
import { DrizzleRarityRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-rarity-repository";
import { DrizzleWalletRepository } from "@/server/infrastructure/db/drizzle/repositories/drizzle-wallet-repository";
import { OpenAiImageGenerator } from "@/server/infrastructure/services/openai-image-generator";
import { OpenAiCardIdeaGenerator } from "@/server/infrastructure/services/openai-card-idea-generator";
import { TcgdexCardSource } from "@/server/infrastructure/services/tcgdex-card-source";
import { R2Storage } from "@/server/infrastructure/storage/r2-storage";

const cards = new DrizzleCardRepository();
const pokemonTypes = new DrizzlePokemonTypeRepository();
const boosters = new DrizzleBoosterRepository();
const rarities = new DrizzleRarityRepository();
const wallets = new DrizzleWalletRepository();
const profiles = new DrizzleProfileRepository();
const pokedex = new DrizzlePokedexRepository();
const purchases = new DrizzlePackPurchaseRepository();
const openings = new DrizzleOpeningRepository();
const storage = new R2Storage();
const cardGenerations = new DrizzleCardGenerationRepository();
const battleDecks = new DrizzleBattleDeckRepository();
const battleOpponents = new DrizzleBattleOpponentRepository();
const battles = new DrizzleBattleRepository();
const cardSource = new TcgdexCardSource();
const cardIdeas = new OpenAiCardIdeaGenerator();
const images = new OpenAiImageGenerator();

const container = {
  grantSignupBonus: new GrantSignupBonus(wallets),
  getMyProfile: new GetMyProfile(profiles),
  getPublicProfile: new GetPublicProfile(profiles, pokedex),
  listPokedex: new ListPokedex(pokedex),
  listPokemonTypes: new ListPokemonTypes(pokemonTypes),
  getCard: new GetCard(cards),
  listBoosters: new ListBoosters(boosters),
  getBooster: new GetBooster(boosters),
  openPack: new OpenPack(purchases),
  getOpening: new GetOpening(openings),
  listAdminCards: new ListAdminCards(cards),
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
  startCardGeneration: new StartCardGeneration(cardGenerations, cardIdeas, images),
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
  retryCardGeneration: new RetryCardGeneration(cardGenerations),
  listMyDecks: new ListMyDecks(battleDecks),
  getDeck: new GetDeck(battleDecks),
  saveDeck: new SaveDeck(battleDecks, battles),
  deleteDeck: new DeleteDeck(battleDecks),
  listBattleOpponents: new ListBattleOpponents(battleOpponents),
  listAdminOpponents: new ListAdminOpponents(battleOpponents),
  getAdminOpponent: new GetAdminOpponent(battleOpponents),
  createOpponent: new CreateOpponent(battleOpponents, battles),
  updateOpponent: new UpdateOpponent(battleOpponents, battles),
  listActiveBattle: new ListActiveBattle(battles, battleOpponents),
  startBattle: new StartBattle(battles, battleDecks, battleOpponents),
  getBattle: new GetBattle(battles, battleOpponents),
  submitBattleAction: new SubmitBattleAction(battles, battleOpponents),
  forfeitBattle: new ForfeitBattle(battles, battleOpponents),
};

export { container };
