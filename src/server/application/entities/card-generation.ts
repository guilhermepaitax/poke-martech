import type { GenerationItemStatus, GenerationStatus } from "@/lib/value-objects/card-generation";
import type { SourcePokemon } from "@/server/application/entities/source-pokemon";

class CardGenerationItem {
  constructor(
    readonly id: string,
    readonly position: number,
    readonly sourceUrl: string | null,
    readonly sourceData: SourcePokemon | null,
    readonly sourceImageUrl: string | null,
    readonly imagePrompt: string | null,
    readonly cardId: string | null,
    readonly status: GenerationItemStatus,
    readonly error: string | null,
  ) {}
}

class CardGenerationBatch {
  constructor(
    readonly id: string,
    readonly createdBy: string,
    readonly personName: string,
    readonly personDescription: string,
    readonly personImageUrl: string,
    readonly requestedCount: number,
    readonly status: GenerationStatus,
    readonly error: string | null,
    readonly createdAt: Date,
    readonly updatedAt: Date,
    readonly items: CardGenerationItem[],
  ) {}

  isActive(now: Date) {
    if (this.status !== "pending" && this.status !== "running") return false;
    return now.getTime() - this.updatedAt.getTime() < STALE_GENERATION_MS;
  }

  canRetry(now: Date) {
    return !this.isActive(now) && this.items.some((item) => item.status !== "done");
  }
}

const STALE_GENERATION_MS = 10 * 60 * 1000;

export { CardGenerationBatch, CardGenerationItem, STALE_GENERATION_MS };
