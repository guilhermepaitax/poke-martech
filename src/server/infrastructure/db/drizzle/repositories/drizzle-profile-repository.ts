import { and, asc, desc, eq, ilike, inArray, sql, type SQL } from "drizzle-orm";
import { RARITY_RANK } from "@/lib/value-objects/card";
import type { PokedexSortKey } from "@/lib/value-objects/pokedex";
import { sliceRows, type PageRequest, type PageSlice } from "@/server/application/page";
import type {
  PokedexFilters,
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
import type { PokedexEntry, ProfileBase } from "@/types/catalog";

class DrizzleProfileRepository implements ProfileRepository {
  async findByUserId(userId: string): Promise<ProfileBase | null> {
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
  async page(
    userId: string,
    filters: PokedexFilters,
    request: PageRequest,
  ): Promise<PageSlice<PokedexEntry>> {
    const owned = ownedByUser(userId);
    const discovered = sql`${owned.cardId} is not null`;
    const term = filters.query.trim();
    const where = and(
      eq(cards.published, true),
      filters.ownedOnly || term || filters.type ? discovered : undefined,
      term ? ilike(cards.name, `%${term.replace(/[\\%_]/g, "\\$&")}%`) : undefined,
      filters.type ? eq(cards.energyType, filters.type) : undefined,
    );
    const rows = await db
      .select({ card: cards, ownedCount: sql<number>`coalesce(${owned.count}, 0)::int` })
      .from(cards)
      .leftJoin(owned, eq(owned.cardId, cards.id))
      .where(where)
      .orderBy(...pokedexOrder(filters.sort, discovered), asc(cards.number))
      .limit(request.limit + 1)
      .offset(request.cursor);
    const slice = sliceRows(rows, request);
    const ownedCards = slice.items.flatMap((row) => (row.ownedCount > 0 ? [row.card] : []));
    const [attackRows, origins] = await Promise.all([
      attacksFor(ownedCards.map((card) => card.id)),
      evolutionOriginsFor(db, ownedCards),
    ]);
    return {
      hasMore: slice.hasMore,
      items: slice.items.flatMap((row): PokedexEntry[] => {
        if (row.ownedCount === 0) {
          return [{ id: row.card.id, number: row.card.number, ownedCount: 0, card: null }];
        }
        const face = toCardFace(row.card, attackRows, origins);
        if (!face) return [];
        return [{ id: row.card.id, number: row.card.number, ownedCount: row.ownedCount, card: face }];
      }),
    };
  }

  async totals(userId: string): Promise<{ owned: number; total: number }> {
    const owned = ownedByUser(userId);
    const rows = await db
      .select({
        owned: sql<number>`count(${owned.cardId})::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(cards)
      .leftJoin(owned, eq(owned.cardId, cards.id))
      .where(eq(cards.published, true));
    return { owned: rows[0]?.owned ?? 0, total: rows[0]?.total ?? 0 };
  }

  async ownedCardIdsAmong(userId: string, cardIds: string[]): Promise<string[]> {
    if (cardIds.length === 0) return [];
    const rows = await db
      .selectDistinct({ cardId: userCards.cardId })
      .from(userCards)
      .where(and(eq(userCards.userId, userId), inArray(userCards.cardId, cardIds)));
    return rows.map((row) => row.cardId);
  }
}

function ownedByUser(userId: string) {
  return db
    .select({
      cardId: userCards.cardId,
      count: sql<number>`count(*)`.as("owned_count"),
    })
    .from(userCards)
    .where(eq(userCards.userId, userId))
    .groupBy(userCards.cardId)
    .as("owned");
}

function pokedexOrder(sort: PokedexSortKey, discovered: SQL): SQL[] {
  if (sort === "number") return [];
  const onlyDiscovered = (value: SQL) => sql`case when ${discovered} then ${value} end`;
  const missingLast = sql`(${discovered}) desc`;
  if (sort === "name") return [missingLast, asc(onlyDiscovered(sql`lower(${cards.name})`))];
  if (sort === "hp") return [missingLast, desc(onlyDiscovered(sql`${cards.hp}`))];
  return [missingLast, desc(onlyDiscovered(rarityRank()))];
}

function rarityRank(): SQL {
  const branches = Object.entries(RARITY_RANK).map(
    ([rarity, rank]) => sql`when ${rarity} then ${sql.raw(String(Number(rank)))}`,
  );
  return sql`case ${cards.rarity} ${sql.join(branches, sql` `)} end`;
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
