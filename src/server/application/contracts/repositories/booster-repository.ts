import type { Booster } from "@/server/application/entities/booster";
import type { BoosterSummary } from "@/types/catalog";

interface BoosterRepository {
  listActive(): Promise<BoosterSummary[]>;
  listAll(): Promise<BoosterSummary[]>;
  findActiveBySlug(slug: string): Promise<Booster | null>;
  findById(id: string): Promise<Booster | null>;
  create(booster: Booster): Promise<{ ok: true; id: string } | { ok: false; reason: "conflict" }>;
  update(booster: Booster): Promise<{ ok: true } | { ok: false; reason: "conflict" | "not_found" }>;
}

export type { BoosterRepository };
