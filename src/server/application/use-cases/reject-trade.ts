import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { TradeRepository } from "@/server/application/contracts/repositories/trade-repository";
import { ConflictError, ForbiddenError, NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";

class RejectTrade {
  constructor(private readonly trades: TradeRepository) {}

  async execute(input: { id: string }, actor: Actor | null): Promise<Result<{ id: string }>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const proposal = await this.trades.findById(input.id);
    if (!proposal) return err(new NotFoundError("Proposta"));
    if (proposal.toUserId !== auth.value.id) {
      return err(new ForbiddenError("Só quem recebe a proposta pode recusar."));
    }
    if (proposal.status !== "pending") {
      return err(new ConflictError("Essa proposta não está pendente."));
    }
    const updated = await this.trades.setStatus(input.id, "rejected");
    if (!updated) return err(new ConflictError("Essa proposta não está pendente."));
    return success({ id: input.id });
  }
}

export { RejectTrade };
