import { z } from "zod";
import { CARD_DECORATION_IDS } from "@/lib/card-decorations";
import { MAX_ATTACK_EFFECTS, STATUS_CONDITIONS } from "@/lib/value-objects/attack-effect";
import { BATTLE_DIFFICULTIES } from "@/lib/value-objects/battle";
import { ENERGY_TYPES, FINISHES, FRAMES, RARITIES, STAGES } from "@/lib/value-objects/card";
import { MAX_GENERATION_CARDS, POKEMON_ZONE_CARD_URL } from "@/lib/value-objects/card-generation";

const energyCostSchema = z.object({
  type: z.enum(ENERGY_TYPES),
  count: z.number().int().min(1).max(5),
});

const effectAmountSchema = z.number().int().min(10).max(300);
const effectCountSchema = z.number().int().min(1).max(5);
const effectTargetSchema = z.enum(["self", "opponent"]);

const attackEffectSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("heal_self"), amount: effectAmountSchema }),
  z.object({
    kind: z.literal("status"),
    condition: z.enum(STATUS_CONDITIONS),
    target: effectTargetSchema,
    coinFlip: z.boolean(),
  }),
  z.object({
    kind: z.literal("coin_bonus"),
    coins: effectCountSchema,
    amountPerHeads: effectAmountSchema,
  }),
  z.object({ kind: z.literal("coin_or_nothing") }),
  z.object({
    kind: z.literal("bench_damage"),
    amount: effectAmountSchema,
    scope: z.enum(["all", "one"]),
  }),
  z.object({ kind: z.literal("self_damage"), amount: effectAmountSchema }),
  z.object({ kind: z.literal("discard_energy"), count: effectCountSchema, target: effectTargetSchema }),
  z.object({ kind: z.literal("draw_cards"), count: effectCountSchema }),
  z.object({ kind: z.literal("attach_energy_self"), count: effectCountSchema }),
  z.object({ kind: z.literal("prevent_damage_next_turn"), coinFlip: z.boolean() }),
  z.object({ kind: z.literal("bonus_if_damaged"), amount: effectAmountSchema }),
]);

const attackSchema = z.object({
  name: z.string().trim().min(1).max(40),
  damage: z.number().int().min(0).max(500).nullable(),
  effectText: z.string().trim().max(280),
  effects: z.array(attackEffectSchema).max(MAX_ATTACK_EFFECTS),
  energyCost: z.array(energyCostSchema).max(6),
  sortOrder: z.number().int().min(0),
});

const imageUrlSchema = z
  .union([z.string().trim().url(), z.literal(""), z.null()])
  .transform((value) => value || null);

const placementSchema = z.number().int().min(0).max(100);
const scaleSchema = z.number().int().min(40).max(220);

const cardSchema = z.object({
  name: z.string().trim().min(1).max(60),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Identificador inválido."),
  imageUrl: imageUrlSchema,
  imageX: placementSchema,
  imageY: placementSchema,
  imageScale: scaleSchema,
  overlayImageUrl: imageUrlSchema,
  overlayX: placementSchema,
  overlayY: placementSchema,
  overlayScale: scaleSchema,
  decorationAsset: z.enum(CARD_DECORATION_IDS).nullable(),
  decorationImageUrl: imageUrlSchema,
  hp: z.number().int().min(10).max(400),
  energyType: z.enum(ENERGY_TYPES),
  stage: z.enum(STAGES),
  frame: z.enum(FRAMES),
  evolvesFromId: z.string().uuid().nullable(),
  retreatCost: z.number().int().min(0).max(5),
  weaknessType: z.enum(ENERGY_TYPES).nullable(),
  weaknessModifier: z.number().int().min(0).max(100),
  rarity: z.enum(RARITIES),
  flavorText: z.string().trim().max(280),
  published: z.boolean(),
  attacks: z.array(attackSchema).min(1).max(4),
});

const boosterCardSchema = z.object({
  cardId: z.string().uuid(),
  weightOverride: z.number().int().min(1).max(100000).nullable(),
});

const boosterSchema = z.object({
  name: z.string().trim().min(1).max(60),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Identificador inválido."),
  imageUrl: imageUrlSchema,
  description: z.string().trim().max(400),
  price: z.number().int().min(1).max(100000),
  cardsPerPack: z.number().int().min(1).max(10),
  stock: z.number().int().min(0).nullable(),
  featuredSlotMinRarity: z.enum(RARITIES).nullable(),
  finish: z.enum(FINISHES),
  active: z.boolean(),
  cards: z.array(boosterCardSchema).min(1),
});

const cardGenerationSchema = z
  .object({
    personName: z.string().trim().min(1, "Informe o nome da pessoa.").max(60),
    personDescription: z
      .string()
      .trim()
      .min(10, "Descreva a pessoa com pelo menos 10 caracteres.")
      .max(600),
    personImageUrl: z.string().trim().url("Envie a foto da pessoa."),
    sourceUrls: z
      .array(z.string().trim().regex(POKEMON_ZONE_CARD_URL, "Link do pokemon-zone inválido."))
      .max(MAX_GENERATION_CARDS),
    count: z.number().int().min(1).max(MAX_GENERATION_CARDS).nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.sourceUrls.length === 0 && value.count === null) {
      ctx.addIssue({
        code: "custom",
        path: ["count"],
        message: "Informe a quantidade de Pokémon a gerar.",
      });
    }
  });

const rarityWeightsSchema = z.array(
  z.object({
    rarity: z.enum(RARITIES),
    weight: z.number().int().min(1).max(100000),
  }),
);

const deckCardSchema = z.object({
  cardId: z.string().uuid(),
  copies: z.number().int().min(1).max(2),
});

const battleDeckSchema = z.object({
  name: z.string().trim().min(1).max(40),
  energyTypes: z.array(z.enum(ENERGY_TYPES)).min(1).max(3),
  cards: z.array(deckCardSchema).min(1),
});

const battleOpponentSchema = z.object({
  name: z.string().trim().min(1).max(60),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Identificador inválido."),
  avatarUrl: imageUrlSchema,
  description: z.string().trim().max(400),
  difficulty: z.enum(BATTLE_DIFFICULTIES),
  rewardCoins: z.number().int().min(0).max(10000),
  energyTypes: z.array(z.enum(ENERGY_TYPES)).min(1).max(3),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000),
  cards: z.array(z.object({ cardId: z.string().uuid(), copies: z.number().int().min(1).max(2) })).min(1),
});

const startBattleSchema = z.object({
  deckId: z.string().uuid(),
  opponentId: z.string().uuid(),
});

const battleActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("setup"),
    activeUid: z.string().min(1),
    benchUids: z.array(z.string().min(1)).max(3),
  }),
  z.object({ type: z.literal("attach_energy"), targetUid: z.string().min(1) }),
  z.object({ type: z.literal("play_basic"), handUid: z.string().min(1) }),
  z.object({
    type: z.literal("evolve"),
    handUid: z.string().min(1),
    targetUid: z.string().min(1),
  }),
  z.object({ type: z.literal("retreat"), benchUid: z.string().min(1) }),
  z.object({ type: z.literal("attack"), attackIndex: z.number().int().min(0).max(3) }),
  z.object({ type: z.literal("promote"), benchUid: z.string().min(1) }),
  z.object({ type: z.literal("end_turn") }),
]);

const submitBattleActionSchema = z.object({
  version: z.number().int().min(0),
  action: battleActionSchema,
});

const forfeitBattleSchema = z.object({
  version: z.number().int().min(0),
});

export {
  battleDeckSchema,
  battleOpponentSchema,
  boosterSchema,
  cardGenerationSchema,
  cardSchema,
  forfeitBattleSchema,
  rarityWeightsSchema,
  startBattleSchema,
  submitBattleActionSchema,
};
