import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
  isGenerationItemStatus,
  isGenerationStatus,
  type GenerationItemStatus,
  type GenerationStatus,
} from "@/lib/value-objects/card-generation";
import type {
  CardGenerationItemPatch,
  CardGenerationRepository,
  NewCardGenerationBatch,
} from "@/server/application/contracts/repositories/card-generation-repository";
import {
  CardGenerationBatch,
  CardGenerationItem,
} from "@/server/application/entities/card-generation";
import { db } from "@/server/infrastructure/db/drizzle/client";
import {
  cardGenerationBatches,
  cardGenerationItems,
} from "@/server/infrastructure/db/drizzle/schema";

type BatchRow = typeof cardGenerationBatches.$inferSelect;
type ItemRow = typeof cardGenerationItems.$inferSelect;

class DrizzleCardGenerationRepository implements CardGenerationRepository {
  async create(batch: NewCardGenerationBatch): Promise<string> {
    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(cardGenerationBatches)
        .values({
          createdBy: batch.createdBy,
          personName: batch.personName,
          personDescription: batch.personDescription,
          personImageUrl: batch.personImageUrl,
          requestedCount: batch.items.length,
        })
        .returning({ id: cardGenerationBatches.id });
      await tx.insert(cardGenerationItems).values(
        batch.items.map((item) => ({
          batchId: created.id,
          position: item.position,
          sourceUrl: item.sourceUrl,
        })),
      );
      return created.id;
    });
  }

  async findById(id: string): Promise<CardGenerationBatch | null> {
    const rows = await db
      .select()
      .from(cardGenerationBatches)
      .where(eq(cardGenerationBatches.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const items = await db
      .select()
      .from(cardGenerationItems)
      .where(eq(cardGenerationItems.batchId, id))
      .orderBy(asc(cardGenerationItems.position));
    return toBatch(row, items);
  }

  async listRecent(limit: number): Promise<CardGenerationBatch[]> {
    const rows = await db
      .select()
      .from(cardGenerationBatches)
      .orderBy(desc(cardGenerationBatches.createdAt))
      .limit(limit);
    if (rows.length === 0) return [];
    const items = await db
      .select()
      .from(cardGenerationItems)
      .where(
        inArray(
          cardGenerationItems.batchId,
          rows.map((row) => row.id),
        ),
      )
      .orderBy(asc(cardGenerationItems.position));
    return rows.map((row) =>
      toBatch(
        row,
        items.filter((item) => item.batchId === row.id),
      ),
    );
  }

  async claim(id: string): Promise<boolean> {
    const claimed = await db
      .update(cardGenerationBatches)
      .set({ status: "running", error: null, updatedAt: new Date() })
      .where(and(eq(cardGenerationBatches.id, id), eq(cardGenerationBatches.status, "pending")))
      .returning({ id: cardGenerationBatches.id });
    return claimed.length > 0;
  }

  async updateBatch(id: string, patch: { status: GenerationStatus; error: string | null }) {
    await db
      .update(cardGenerationBatches)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(cardGenerationBatches.id, id));
  }

  async updateItem(id: string, patch: CardGenerationItemPatch) {
    await db
      .update(cardGenerationItems)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(cardGenerationItems.id, id));
  }

  async resetFailedItems(id: string): Promise<number> {
    const reset = await db
      .update(cardGenerationItems)
      .set({ status: "pending", error: null, updatedAt: new Date() })
      .where(and(eq(cardGenerationItems.batchId, id), eq(cardGenerationItems.status, "failed")))
      .returning({ id: cardGenerationItems.id });
    return reset.length;
  }
}

function toBatch(row: BatchRow, items: ItemRow[]) {
  return new CardGenerationBatch(
    row.id,
    row.createdBy,
    row.personName,
    row.personDescription,
    row.personImageUrl,
    row.requestedCount,
    asStatus(row.status),
    row.error,
    row.createdAt,
    row.updatedAt,
    items.map(
      (item) =>
        new CardGenerationItem(
          item.id,
          item.position,
          item.sourceUrl,
          item.sourceData,
          item.sourceImageUrl,
          item.imagePrompt,
          item.cardId,
          asItemStatus(item.status),
          item.error,
        ),
    ),
  );
}

function asStatus(value: string): GenerationStatus {
  if (!isGenerationStatus(value)) throw new Error("Status de geração inválido.");
  return value;
}

function asItemStatus(value: string): GenerationItemStatus {
  if (!isGenerationItemStatus(value)) throw new Error("Status de item inválido.");
  return value;
}

export { DrizzleCardGenerationRepository };
