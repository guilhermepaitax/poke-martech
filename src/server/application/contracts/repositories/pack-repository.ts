import type { DrawEntry, DrawPackResult } from "@/server/application/draw-pack";
import type { Rarity } from "@/lib/value-objects/card";
import type { PackOpening } from "@/types/catalog";

type PurchaseStatus =
  | "not_found"
  | "inactive"
  | "insufficient_coins"
  | "out_of_stock"
  | "pool_too_small"
  | "featured_unavailable"
  | "no_wallet";

type PurchaseResult =
  | { status: "ok"; opening: PackOpening }
  | { status: PurchaseStatus };

interface PackPurchaseRepository {
  purchase(input: {
    userId: string;
    boosterSlug: string;
    draw: (input: {
      pool: DrawEntry[];
      count: number;
      featuredMinRarity: Rarity | null;
    }) => DrawPackResult;
  }): Promise<PurchaseResult>;
}

interface OpeningRepository {
  findForUser(id: string, userId: string): Promise<PackOpening | null>;
}

export type { OpeningRepository, PackPurchaseRepository, PurchaseResult };
