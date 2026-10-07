import { RARITIES } from "@/lib/value-objects/card";
import type { Actor } from "@/server/application/actor";
import { requireAdmin } from "@/server/application/authorize";
import type { RarityRepository } from "@/server/application/contracts/repositories/rarity-repository";
import { RarityWeight } from "@/server/application/entities/rarity-weight";
import { ValidationError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { RarityWeight as RarityWeightDto } from "@/types/catalog";

class ListRarityWeights {
  constructor(private readonly rarities: RarityRepository) {}

  async execute(actor: Actor | null): Promise<Result<RarityWeightDto[]>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    const weights = await this.rarities.list();
    return success(weights.map((weight) => ({ rarity: weight.rarity, weight: weight.weight })));
  }
}

class UpsertRarityWeights {
  constructor(private readonly rarities: RarityRepository) {}

  async execute(input: RarityWeightDto[], actor: Actor | null): Promise<Result<RarityWeightDto[]>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    const seen = new Set(input.map((item) => item.rarity));
    if (seen.size !== RARITIES.length || RARITIES.some((rarity) => !seen.has(rarity))) {
      return err(new ValidationError("Informe o peso de todas as raridades."));
    }
    await this.rarities.replaceAll(input.map((item) => new RarityWeight(item.rarity, item.weight)));
    return success(input);
  }
}

export { ListRarityWeights, UpsertRarityWeights };
