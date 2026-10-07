import type { Card } from "@/server/application/entities/card";
import type { CardSummary } from "@/types/catalog";

interface CardRepository {
  listAll(): Promise<CardSummary[]>;
  listPublished(): Promise<CardSummary[]>;
  findById(id: string): Promise<Card | null>;
  findPublishedById(id: string): Promise<Card | null>;
  ownedCount(userId: string, cardId: string): Promise<number>;
  create(card: Card): Promise<{ ok: true; id: string } | { ok: false; reason: "conflict" }>;
  update(card: Card): Promise<{ ok: true } | { ok: false; reason: "conflict" | "not_found" }>;
}

export type { CardRepository };
