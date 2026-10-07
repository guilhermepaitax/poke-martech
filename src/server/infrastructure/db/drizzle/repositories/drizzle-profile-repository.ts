import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type {
  PokedexRepository,
  ProfileRepository,
} from "@/server/application/contracts/repositories/profile-repository";
import { db } from "@/server/infrastructure/db/drizzle/client";
import {
  cardAttacks,
  cards,
  user,
  userCards,
  wallets,
} from "@/server/infrastructure/db/drizzle/schema";
import { evolutionOriginsFor, toCardFace } from "@/server/infrastructure/db/drizzle/to-card-face";
import type { PokedexEntry, Profile } from "@/types/catalog";

class DrizzleProfileRepository implements ProfileRepository {
  async findByUserId(userId: string): Promise<Profile | null> {
    const rows = await db
      .select({
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
        bio: user.bio,
        coins: wallets.coins,
      })
      .from(user)
      .leftJoin(wallets, eq(wallets.userId, user.id))
      .where(eq(user.id, userId))
      .limit(1);
    const row = rows[0];
    if (!row) return null;

    const recent = await db
      .select({
        id: userCards.id,
        obtainedAt: userCards.obtainedAt,
        card: cards,
      })
      .from(userCards)
      .innerJoin(cards, eq(cards.id, userCards.cardId))
      .where(eq(userCards.userId, userId))
      .orderBy(desc(userCards.obtainedAt))
      .limit(8);
    const attackRows = await attacksFor(recent.map((item) => item.card.id));
    const origins = await evolutionOriginsFor(db, recent.map((item) => item.card));

    return {
      id: row.id,
      username: row.username,
      name: row.name,
      image: row.image,
      bio: row.bio,
      coins: row.coins ?? 0,
      recentCards: recent.flatMap((item) => {
        const face = toCardFace(item.card, attackRows, origins);
        if (!face) return [];
        return [
          {
            id: item.id,
            cardId: item.card.id,
            number: item.card.number,
            obtainedAt: item.obtainedAt.toISOString(),
            card: face,
          },
        ];
      }),
    };
  }

  async findPublicByUsername(username: string) {
    const rows = await db
      .select({
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
        bio: user.bio,
      })
      .from(user)
      .where(eq(user.username, username))
      .limit(1);
    return rows[0] ?? null;
  }
}

class DrizzlePokedexRepository implements PokedexRepository {
  async listForUser(userId: string): Promise<PokedexEntry[]> {
    const rows = await db
      .select({
        card: cards,
        ownedCount: sql<number>`count(${userCards.id})::int`,
      })
      .from(cards)
      .leftJoin(
        userCards,
        and(eq(userCards.cardId, cards.id), eq(userCards.userId, userId)),
      )
      .where(eq(cards.published, true))
      .groupBy(cards.id)
      .orderBy(asc(cards.number));
    const owned = rows.flatMap((row) => (row.ownedCount > 0 ? [row.card] : []));
    const attackRows = await attacksFor(owned.map((card) => card.id));
    const origins = await evolutionOriginsFor(db, owned);

    return rows.flatMap((row): PokedexEntry[] => {
      if (row.ownedCount === 0) {
        return [{ id: row.card.id, number: row.card.number, ownedCount: 0, card: null }];
      }
      const face = toCardFace(row.card, attackRows, origins);
      if (!face) return [];
      return [{ id: row.card.id, number: row.card.number, ownedCount: row.ownedCount, card: face }];
    });
  }
}

function attacksFor(cardIds: string[]) {
  const ids = [...new Set(cardIds)];
  if (ids.length === 0) return Promise.resolve([]);
  return db
    .select()
    .from(cardAttacks)
    .where(inArray(cardAttacks.cardId, ids))
    .orderBy(asc(cardAttacks.sortOrder));
}

export { DrizzlePokedexRepository, DrizzleProfileRepository };
