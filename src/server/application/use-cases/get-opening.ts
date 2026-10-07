import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { OpeningRepository } from "@/server/application/contracts/repositories/pack-repository";
import { NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { PackOpening } from "@/types/catalog";

class GetOpening {
  constructor(private readonly openings: OpeningRepository) {}

  async execute(input: { id: string }, actor: Actor | null): Promise<Result<PackOpening>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const opening = await this.openings.findForUser(input.id, auth.value.id);
    if (!opening) return err(new NotFoundError("Abertura"));
    return success(opening);
  }
}

export { GetOpening };
