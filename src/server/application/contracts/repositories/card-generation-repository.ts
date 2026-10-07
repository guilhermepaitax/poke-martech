import type { GenerationItemStatus, GenerationStatus } from "@/lib/value-objects/card-generation";
import type { CardGenerationBatch } from "@/server/application/entities/card-generation";
import type { SourcePokemon } from "@/server/application/entities/source-pokemon";

type NewCardGenerationBatch = {
  createdBy: string;
  personName: string;
  personDescription: string;
  personImageUrl: string;
  items: { position: number; sourceUrl: string | null }[];
};

type CardGenerationItemPatch = Partial<{
  sourceData: SourcePokemon;
  sourceImageUrl: string | null;
  imagePrompt: string;
  cardId: string;
  status: GenerationItemStatus;
  error: string | null;
}>;

interface CardGenerationRepository {
  create(batch: NewCardGenerationBatch): Promise<string>;
  findById(id: string): Promise<CardGenerationBatch | null>;
  listRecent(limit: number): Promise<CardGenerationBatch[]>;
  claim(id: string): Promise<boolean>;
  updateBatch(id: string, patch: { status: GenerationStatus; error: string | null }): Promise<void>;
  updateItem(id: string, patch: CardGenerationItemPatch): Promise<void>;
  resetFailedItems(id: string): Promise<number>;
}

export type { CardGenerationItemPatch, CardGenerationRepository, NewCardGenerationBatch };
