import { z } from "zod";
import { CARD_DECORATION_IDS } from "@/lib/card-decorations";
import { ENERGY_TYPES, FINISHES, FRAMES, RARITIES, STAGES } from "@/lib/value-objects/card";
import { MAX_CARD_TAGS, MAX_CARD_TAG_LENGTH, normalizeCardTags } from "@/lib/value-objects/card-tag";
import { MAX_GENERATION_CARDS, POKEMON_ZONE_CARD_URL } from "@/lib/value-objects/card-generation";

const energyCostSchema = z.object({
  type: z.enum(ENERGY_TYPES),
  count: z.number().int().min(1).max(5),
});

const attackSchema = z.object({
  name: z.string().trim().min(1).max(40),
  damage: z.number().int().min(0).max(500).nullable(),
  effectText: z.string().trim().max(280),
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
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Informe a tag.")
        .max(MAX_CARD_TAG_LENGTH, "A tag pode ter no máximo 32 caracteres.")
        .refine((value) => !value.includes(","), "A tag não pode ter vírgula."),
    )
    .max(MAX_CARD_TAGS, "Uma carta pode ter no máximo 12 tags.")
    .default([])
    .transform((values) => normalizeCardTags(values)),
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

const createTradeSchema = z.object({
  targetUsername: z.string().trim().min(1),
  requestedCardId: z.string().uuid(),
  offeredCardId: z.string().uuid(),
});

export {
  boosterSchema,
  cardGenerationSchema,
  cardSchema,
  createTradeSchema,
  rarityWeightsSchema,
};
