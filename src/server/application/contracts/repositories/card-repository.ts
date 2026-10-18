import type { Card } from "@/server/application/entities/card";
import type { AdminCatalogCard, CardFace, CardSummary } from "@/types/catalog";

type PublishedCardRecord = {
  id: string;
  slug: string;
  face: CardFace;
};

interface CardRepository {
  listAll(): Promise<AdminCatalogCard[]>;
  listPublished(): Promise<CardSummary[]>;
  listPublishedCards(): Promise<PublishedCardRecord[]>;
  findById(id: string): Promise<Card | null>;
  findPublishedById(id: string): Promise<Card | null>;
  findPublishedBySlug(slug: string): Promise<Card | null>;
  ownedCount(userId: string, cardId: string): Promise<number>;
  create(
    card: Card,
  ): Promise<{ ok: true; id: string } | { ok: false; reason: "conflict" }>;
  update(
    card: Card,
  ): Promise<{ ok: true } | { ok: false; reason: "conflict" | "not_found" }>;
}

export type { CardRepository, PublishedCardRecord };
