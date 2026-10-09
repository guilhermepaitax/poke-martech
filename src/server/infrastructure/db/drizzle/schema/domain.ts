import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AttackEffect } from "@/lib/value-objects/attack-effect";
import type { EnergyType } from "@/lib/value-objects/card";
import type { BattleState } from "@/lib/battle/battle-state";
import type { SourcePokemon } from "@/server/application/entities/source-pokemon";
import { user } from "@/server/infrastructure/db/drizzle/schema/auth";

type EnergyCostRow = {
  type: string;
  count: number;
};

const pokemonTypes = pgTable("pokemon_types", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
});

const wallets = pgTable("wallets", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  coins: integer("coins").notNull(),
});

const coinLedger = pgTable(
  "coin_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    referenceId: text("reference_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("coin_ledger_user_id_idx").on(table.userId)],
);

const cards = pgTable(
  "cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    imageUrl: text("image_url"),
    imageX: integer("image_x").notNull().default(50),
    imageY: integer("image_y").notNull().default(50),
    imageScale: integer("image_scale").notNull().default(100),
    overlayImageUrl: text("overlay_image_url"),
    overlayX: integer("overlay_x").notNull().default(50),
    overlayY: integer("overlay_y").notNull().default(50),
    overlayScale: integer("overlay_scale").notNull().default(100),
    decorationAsset: text("decoration_asset"),
    decorationImageUrl: text("decoration_image_url"),
    hp: integer("hp").notNull(),
    energyType: text("energy_type")
      .notNull()
      .references(() => pokemonTypes.code),
    stage: text("stage").notNull(),
    frame: text("frame").notNull().default("basic"),
    evolvesFromId: uuid("evolves_from_id"),
    retreatCost: integer("retreat_cost").notNull(),
    weaknessType: text("weakness_type").references(() => pokemonTypes.code),
    weaknessModifier: integer("weakness_modifier").notNull().default(20),
    rarity: text("rarity").notNull(),
    flavorText: text("flavor_text").notNull().default(""),
    published: boolean("published").notNull().default(false),
    number: integer("number").generatedByDefaultAsIdentity(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("cards_slug_idx").on(table.slug),
    uniqueIndex("cards_number_idx").on(table.number),
  ],
);

const cardAttacks = pgTable(
  "card_attacks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    damage: integer("damage"),
    effectText: text("effect_text").notNull().default(""),
    effects: jsonb("effects").$type<AttackEffect[]>().notNull().default([]),
    energyCost: jsonb("energy_cost").$type<EnergyCostRow[]>().notNull(),
    sortOrder: integer("sort_order").notNull(),
  },
  (table) => [index("card_attacks_card_id_idx").on(table.cardId)],
);

const rarityWeights = pgTable("rarity_weights", {
  rarity: text("rarity").primaryKey(),
  weight: integer("weight").notNull(),
});

const boosters = pgTable(
  "boosters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    imageUrl: text("image_url"),
    description: text("description").notNull().default(""),
    price: integer("price").notNull(),
    cardsPerPack: integer("cards_per_pack").notNull().default(5),
    stock: integer("stock"),
    featuredSlotMinRarity: text("featured_slot_min_rarity"),
    finish: text("finish").notNull().default("mirror"),
    active: boolean("active").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("boosters_slug_idx").on(table.slug)],
);

const boosterCards = pgTable(
  "booster_cards",
  {
    boosterId: uuid("booster_id")
      .notNull()
      .references(() => boosters.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    weightOverride: integer("weight_override"),
  },
  (table) => [
    uniqueIndex("booster_cards_pk").on(table.boosterId, table.cardId),
  ],
);

const userCards = pgTable(
  "user_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    boosterId: uuid("booster_id").references(() => boosters.id, {
      onDelete: "set null",
    }),
    obtainedAt: timestamp("obtained_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_cards_user_id_idx").on(table.userId),
    index("user_cards_user_card_idx").on(table.userId, table.cardId),
  ],
);

const packOpenings = pgTable(
  "pack_openings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    boosterId: uuid("booster_id")
      .notNull()
      .references(() => boosters.id, { onDelete: "restrict" }),
    coinsSpent: integer("coins_spent").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("pack_openings_user_id_idx").on(table.userId)],
);

const packOpeningCards = pgTable(
  "pack_opening_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    packOpeningId: uuid("pack_opening_id")
      .notNull()
      .references(() => packOpenings.id, { onDelete: "cascade" }),
    userCardId: uuid("user_card_id")
      .notNull()
      .references(() => userCards.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "restrict" }),
    slot: integer("slot").notNull(),
  },
  (table) => [index("pack_opening_cards_opening_idx").on(table.packOpeningId)],
);

const cardGenerationBatches = pgTable(
  "card_generation_batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    personName: text("person_name").notNull(),
    personDescription: text("person_description").notNull(),
    personImageUrl: text("person_image_url").notNull(),
    requestedCount: integer("requested_count").notNull(),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("card_generation_batches_created_at_idx").on(table.createdAt)],
);

const cardGenerationItems = pgTable(
  "card_generation_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => cardGenerationBatches.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    sourceUrl: text("source_url"),
    sourceData: jsonb("source_data").$type<SourcePokemon>(),
    sourceImageUrl: text("source_image_url"),
    imagePrompt: text("image_prompt"),
    cardId: uuid("card_id").references(() => cards.id, { onDelete: "set null" }),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("card_generation_items_batch_idx").on(table.batchId)],
);

const battleDecks = pgTable(
  "battle_decks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    energyTypes: jsonb("energy_types").$type<EnergyType[]>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("battle_decks_user_id_idx").on(table.userId)],
);

const battleDeckCards = pgTable(
  "battle_deck_cards",
  {
    deckId: uuid("deck_id")
      .notNull()
      .references(() => battleDecks.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "restrict" }),
    copies: integer("copies").notNull(),
  },
  (table) => [uniqueIndex("battle_deck_cards_pk").on(table.deckId, table.cardId)],
);

const battleOpponents = pgTable(
  "battle_opponents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    avatarUrl: text("avatar_url"),
    description: text("description").notNull().default(""),
    difficulty: text("difficulty").notNull().default("normal"),
    rewardCoins: integer("reward_coins").notNull().default(10),
    energyTypes: jsonb("energy_types").$type<EnergyType[]>().notNull(),
    active: boolean("active").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("battle_opponents_slug_idx").on(table.slug)],
);

const battleOpponentCards = pgTable(
  "battle_opponent_cards",
  {
    opponentId: uuid("opponent_id")
      .notNull()
      .references(() => battleOpponents.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "restrict" }),
    copies: integer("copies").notNull(),
  },
  (table) => [uniqueIndex("battle_opponent_cards_pk").on(table.opponentId, table.cardId)],
);

const battles = pgTable(
  "battles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    opponentId: uuid("opponent_id")
      .notNull()
      .references(() => battleOpponents.id, { onDelete: "restrict" }),
    deckId: uuid("deck_id").references(() => battleDecks.id, { onDelete: "set null" }),
    status: text("status").notNull().default("active"),
    state: jsonb("state").$type<BattleState>().notNull(),
    version: integer("version").notNull().default(0),
    rewardCoins: integer("reward_coins").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    finishedAt: timestamp("finished_at"),
  },
  (table) => [index("battles_user_status_idx").on(table.userId, table.status)],
);

const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followingId] }),
    index("follows_following_id_idx").on(table.followingId),
    check("follows_no_self", sql`${table.followerId} <> ${table.followingId}`),
  ],
);

const tradeProposals = pgTable(
  "trade_proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromUserId: text("from_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    toUserId: text("to_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    offeredUserCardId: uuid("offered_user_card_id")
      .notNull()
      .references(() => userCards.id, { onDelete: "restrict" }),
    requestedUserCardId: uuid("requested_user_card_id")
      .notNull()
      .references(() => userCards.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("trade_proposals_to_user_status_idx").on(table.toUserId, table.status),
    index("trade_proposals_from_user_status_idx").on(table.fromUserId, table.status),
    check("trade_proposals_no_self", sql`${table.fromUserId} <> ${table.toUserId}`),
    check(
      "trade_proposals_status",
      sql`${table.status} in ('pending', 'accepted', 'rejected', 'cancelled')`,
    ),
  ],
);

const cardsRelations = relations(cards, ({ many }) => ({
  attacks: many(cardAttacks),
}));

const cardAttacksRelations = relations(cardAttacks, ({ one }) => ({
  card: one(cards, {
    fields: [cardAttacks.cardId],
    references: [cards.id],
  }),
}));

export {
  battleDeckCards,
  battleDecks,
  battleOpponentCards,
  battleOpponents,
  battles,
  boosterCards,
  boosters,
  cardAttacks,
  cardAttacksRelations,
  cardGenerationBatches,
  cardGenerationItems,
  cards,
  cardsRelations,
  coinLedger,
  follows,
  packOpeningCards,
  packOpenings,
  pokemonTypes,
  rarityWeights,
  tradeProposals,
  userCards,
  wallets,
};
export type { EnergyCostRow };
