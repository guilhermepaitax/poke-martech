import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { ArenaMatchRepository } from "@/server/application/contracts/repositories/arena-match-repository";
import { ConflictError, NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";

class RecordArenaDefeat {
  constructor(private readonly matches: ArenaMatchRepository) {}

  async execute(input: { matchId: string }, actor: Actor | null): Promise<Result<void>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const result = await this.matches.recordDefeat({
      matchId: input.matchId,
      userId: auth.value.id,
    });
    if (result.status === "not_found") return err(new NotFoundError("Partida"));
    if (result.status === "already_finished") {
      return err(new ConflictError("Partida já finalizada."));
    }
    return success(undefined);
  }
}

export { RecordArenaDefeat };
