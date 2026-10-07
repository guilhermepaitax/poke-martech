import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { BoosterRepository } from "@/server/application/contracts/repositories/booster-repository";
import { success, type Result } from "@/server/shared/result";
import type { BoosterSummary } from "@/types/catalog";

class ListBoosters {
  constructor(private readonly boosters: BoosterRepository) {}

  async execute(actor: Actor | null): Promise<Result<BoosterSummary[]>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    return success(await this.boosters.listActive());
  }
}

export { ListBoosters };
