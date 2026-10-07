import { and, asc, eq, inArray } from "drizzle-orm";
import { isFinish, isRarity, type Finish } from "@/lib/value-objects/card";
import type {
  OpeningRepository,
  PackPurchaseRepository,
} from "@/server/application/contracts/repositories/pack-repository";
import { db } from "@/server/infrastructure/db/drizzle/client";
import {
  boosterCards,
  boosters,
  cardAttacks,
  cards,
  coinLedger,
  packOpeningCards,
  packOpenings,
  rarityWeights,
  userCards,
  wallets,
} from "@/server/infrastructure/db/drizzle/schema";
import {
  evolutionOriginsFor,
  toCardFace,
  type EvolutionOrigins,
} from "@/server/infrastructure/db/drizzle/to-card-face";
import type { OpeningCard, PackOpening } from "@/types/catalog";

class DrizzlePackPurchaseRepository implements PackPurchaseRepository {
  async purchase(input: Parameters<PackPurchaseRepository["purchase"]>[0]) {
    return db.transaction(async (tx) => {
      const boosterRows = await tx
        .select()
        .from(boosters)
        .where(eq(boosters.slug, input.boosterSlug))
        .for("update")
        .limit(1);
      const booster = boosterRows[0];
      if (!booster) return { status: "not_found" as const };
      if (!booster.active) return { status: "inactive" as const };
      if (booster.stock !== null && booster.stock <= 0) {
        return { status: "out_of_stock" as const };
      }

      const walletRows = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, input.userId))
        .for("update")
        .limit(1);
      const wallet = walletRows[0];
      if (!wallet) return { status: "no_wallet" as const };
      if (wallet.coins < booster.price) return { status: "insufficient_coins" as const };

      const poolRows = await tx
        .select({
          cardId: cards.id,
          rarity: cards.rarity,
          weightOverride: boosterCards.weightOverride,
          rarityWeight: rarityWeights.weight,
        })
        .from(boosterCards)
        .innerJoin(cards, eq(cards.id, boosterCards.cardId))
        .innerJoin(rarityWeights, eq(rarityWeights.rarity, cards.rarity))
        .where(and(eq(boosterCards.boosterId, booster.id), eq(cards.published, true)));

      const pool = poolRows.flatMap((row) => {
        if (!isRarity(row.rarity)) return [];
        return [
          {
            cardId: row.cardId,
            rarity: row.rarity,
            weight: row.weightOverride ?? row.rarityWeight,
          },
        ];
      });

      const featured = booster.featuredSlotMinRarity;
      const drawn = input.draw({
        pool,
        count: booster.cardsPerPack,
        featuredMinRarity: featured && isRarity(featured) ? featured : null,
      });
      if (!drawn.ok) return { status: drawn.reason };

      const balanceAfter = wallet.coins - booster.price;
      await tx
        .update(wallets)
        .set({ coins: balanceAfter })
        .where(eq(wallets.userId, input.userId));

      if (booster.stock !== null) {
        await tx
          .update(boosters)
          .set({ stock: booster.stock - 1, updatedAt: new Date() })
          .where(eq(boosters.id, booster.id));
      }

      const openingId = crypto.randomUUID();
      await tx.insert(packOpenings).values({
        id: openingId,
        userId: input.userId,
        boosterId: booster.id,
        coinsSpent: booster.price,
      });
      await tx.insert(coinLedger).values({
        userId: input.userId,
        amount: -booster.price,
        reason: "pack_purchase",
        balanceAfter,
        referenceId: openingId,
      });

      const details = await tx.select().from(cards).where(inArray(cards.id, drawn.cardIds));
      const attackRows = await tx
        .select()
        .from(cardAttacks)
        .where(inArray(cardAttacks.cardId, drawn.cardIds))
        .orderBy(asc(cardAttacks.sortOrder));
      const origins = await evolutionOriginsFor(tx, details);
      const byId = new Map(details.map((card) => [card.id, card]));
      const openingCards: OpeningCard[] = [];

      for (const [slot, cardId] of drawn.cardIds.entries()) {
        const card = byId.get(cardId);
        const openingCard = card ? toOpeningCard(card, slot, attackRows, origins) : null;
        if (!openingCard) {
          throw new Error("Carta sorteada inválida.");
        }
        const userCardId = crypto.randomUUID();
        await tx.insert(userCards).values({
          id: userCardId,
          userId: input.userId,
          cardId,
          boosterId: booster.id,
        });
        await tx.insert(packOpeningCards).values({
          packOpeningId: openingId,
          userCardId,
          cardId,
          slot,
        });
        openingCards.push(openingCard);
      }

      return {
        status: "ok" as const,
        opening: {
          id: openingId,
          boosterName: booster.name,
          boosterImageUrl: booster.imageUrl,
          boosterFinish: asFinish(booster.finish),
          cards: openingCards,
        },
      };
    });
  }
}

class DrizzleOpeningRepository implements OpeningRepository {
  async findForUser(id: string, userId: string): Promise<PackOpening | null> {
    const openings = await db
      .select({
        id: packOpenings.id,
        boosterName: boosters.name,
        boosterImageUrl: boosters.imageUrl,
        boosterFinish: boosters.finish,
      })
      .from(packOpenings)
      .innerJoin(boosters, eq(boosters.id, packOpenings.boosterId))
      .where(and(eq(packOpenings.id, id), eq(packOpenings.userId, userId)))
      .limit(1);
    const opening = openings[0];
    if (!opening) return null;

    const rows = await db
      .select({
        slot: packOpeningCards.slot,
        card: cards,
      })
      .from(packOpeningCards)
      .innerJoin(cards, eq(cards.id, packOpeningCards.cardId))
      .where(eq(packOpeningCards.packOpeningId, id))
      .orderBy(asc(packOpeningCards.slot));
    const attackRows =
      rows.length === 0
        ? []
        : await db
            .select()
            .from(cardAttacks)
            .where(inArray(cardAttacks.cardId, rows.map((row) => row.card.id)))
            .orderBy(asc(cardAttacks.sortOrder));
    const origins = await evolutionOriginsFor(db, rows.map((row) => row.card));

    return {
      id: opening.id,
      boosterName: opening.boosterName,
      boosterImageUrl: opening.boosterImageUrl,
      boosterFinish: asFinish(opening.boosterFinish),
      cards: rows.flatMap((row) => {
        const openingCard = toOpeningCard(row.card, row.slot, attackRows, origins);
        return openingCard ? [openingCard] : [];
      }),
    };
  }
}

function toOpeningCard(
  card: typeof cards.$inferSelect,
  slot: number,
  attackRows: (typeof cardAttacks.$inferSelect)[],
  origins: EvolutionOrigins,
): OpeningCard | null {
  const face = toCardFace(card, attackRows, origins);
  if (!face) return null;
  return { ...face, slot, cardId: card.id };
}

function asFinish(value: string): Finish {
  return isFinish(value) ? value : "mirror";
}

export { DrizzleOpeningRepository, DrizzlePackPurchaseRepository };
