import { and, asc, eq } from "drizzle-orm";
import { isFinish, isRarity, type Finish, type Rarity } from "@/lib/value-objects/card";
import type { BoosterRepository } from "@/server/application/contracts/repositories/booster-repository";
import { Booster } from "@/server/application/entities/booster";
import { db } from "@/server/infrastructure/db/drizzle/client";
import { isUniqueViolation } from "@/server/infrastructure/db/drizzle/repositories/drizzle-card-repository";
import { boosterCards, boosters } from "@/server/infrastructure/db/drizzle/schema";
import type { BoosterSummary } from "@/types/catalog";

class DrizzleBoosterRepository implements BoosterRepository {
  async listActive(): Promise<BoosterSummary[]> {
    const rows = await db
      .select()
      .from(boosters)
      .where(eq(boosters.active, true))
      .orderBy(asc(boosters.name));
    return rows.map(toSummary);
  }

  async listAll(): Promise<BoosterSummary[]> {
    const rows = await db.select().from(boosters).orderBy(asc(boosters.name));
    return rows.map(toSummary);
  }

  async findActiveBySlug(slug: string): Promise<Booster | null> {
    const rows = await db
      .select()
      .from(boosters)
      .where(and(eq(boosters.slug, slug), eq(boosters.active, true)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.hydrate(row);
  }

  async findById(id: string): Promise<Booster | null> {
    const rows = await db.select().from(boosters).where(eq(boosters.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.hydrate(row);
  }

  async create(booster: Booster) {
    try {
      const id = crypto.randomUUID();
      await db.transaction(async (tx) => {
        await tx.insert(boosters).values(toInsert(id, booster));
        if (booster.cards.length > 0) {
          await tx.insert(boosterCards).values(
            booster.cards.map((card) => ({
              boosterId: id,
              cardId: card.cardId,
              weightOverride: card.weightOverride,
            })),
          );
        }
      });
      return { ok: true as const, id };
    } catch (error) {
      if (isUniqueViolation(error)) return { ok: false as const, reason: "conflict" as const };
      throw error;
    }
  }

  async update(booster: Booster) {
    try {
      return await db.transaction(async (tx) => {
        const updated = await tx
          .update(boosters)
          .set({ ...toInsert(booster.id, booster), updatedAt: new Date() })
          .where(eq(boosters.id, booster.id))
          .returning({ id: boosters.id });
        if (updated.length === 0) return { ok: false as const, reason: "not_found" as const };
        await tx.delete(boosterCards).where(eq(boosterCards.boosterId, booster.id));
        if (booster.cards.length > 0) {
          await tx.insert(boosterCards).values(
            booster.cards.map((card) => ({
              boosterId: booster.id,
              cardId: card.cardId,
              weightOverride: card.weightOverride,
            })),
          );
        }
        return { ok: true as const };
      });
    } catch (error) {
      if (isUniqueViolation(error)) return { ok: false as const, reason: "conflict" as const };
      throw error;
    }
  }

  private async hydrate(row: typeof boosters.$inferSelect): Promise<Booster> {
    const links = await db
      .select()
      .from(boosterCards)
      .where(eq(boosterCards.boosterId, row.id));
    return new Booster(
      row.id,
      row.name,
      row.slug,
      row.imageUrl,
      row.description,
      row.price,
      row.cardsPerPack,
      row.stock,
      asOptionalRarity(row.featuredSlotMinRarity),
      asFinish(row.finish),
      row.active,
      links.map((link) => ({
        cardId: link.cardId,
        weightOverride: link.weightOverride,
      })),
    );
  }
}

function toSummary(row: typeof boosters.$inferSelect): BoosterSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.imageUrl,
    description: row.description,
    price: row.price,
    cardsPerPack: row.cardsPerPack,
    stock: row.stock,
    featuredSlotMinRarity: asOptionalRarity(row.featuredSlotMinRarity),
    finish: asFinish(row.finish),
    active: row.active,
  };
}

function toInsert(id: string, booster: Booster) {
  return {
    id,
    name: booster.name,
    slug: booster.slug,
    imageUrl: booster.imageUrl,
    description: booster.description,
    price: booster.price,
    cardsPerPack: booster.cardsPerPack,
    stock: booster.stock,
    featuredSlotMinRarity: booster.featuredSlotMinRarity,
    finish: booster.finish,
    active: booster.active,
  };
}

function asOptionalRarity(value: string | null): Rarity | null {
  if (!value) return null;
  if (!isRarity(value)) throw new Error("Raridade inválida.");
  return value;
}

function asFinish(value: string): Finish {
  if (!isFinish(value)) throw new Error("Acabamento inválido.");
  return value;
}

export { DrizzleBoosterRepository };
