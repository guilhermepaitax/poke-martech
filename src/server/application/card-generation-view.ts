import type { CardGenerationBatch } from "@/server/application/entities/card-generation";
import type { CardDetail, CardGenerationDetail, CardGenerationSummary } from "@/types/catalog";

function toCardGenerationSummary(batch: CardGenerationBatch): CardGenerationSummary {
  return {
    id: batch.id,
    personName: batch.personName,
    personImageUrl: batch.personImageUrl,
    requestedCount: batch.requestedCount,
    doneCount: batch.items.filter((item) => item.status === "done").length,
    failedCount: batch.items.filter((item) => item.status === "failed").length,
    status: batch.status,
    createdAt: batch.createdAt.toISOString(),
  };
}

function toCardGenerationDetail(
  batch: CardGenerationBatch,
  cards: Map<string, CardDetail>,
  now: Date,
): CardGenerationDetail {
  return {
    ...toCardGenerationSummary(batch),
    personDescription: batch.personDescription,
    error: batch.error,
    canRetry: batch.canRetry(now),
    items: batch.items.map((item) => ({
      id: item.id,
      position: item.position,
      sourceUrl: item.sourceUrl,
      sourceName: item.sourceData?.name ?? null,
      sourceImageUrl: item.sourceImageUrl,
      status: item.status,
      error: item.error,
      card: item.cardId ? (cards.get(item.cardId) ?? null) : null,
    })),
  };
}

export { toCardGenerationDetail, toCardGenerationSummary };
