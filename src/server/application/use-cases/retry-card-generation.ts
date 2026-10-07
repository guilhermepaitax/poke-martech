import type { Actor } from "@/server/application/actor";
import { requireAdmin } from "@/server/application/authorize";
import type { CardGenerationRepository } from "@/server/application/contracts/repositories/card-generation-repository";
import { ConflictError, NotFoundError, ValidationError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";

class RetryCardGeneration {
  constructor(private readonly generations: CardGenerationRepository) {}

  async execute(input: { id: string }, actor: Actor | null): Promise<Result<{ id: string }>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    const batch = await this.generations.findById(input.id);
    if (!batch) return err(new NotFoundError("Geração"));
    const now = new Date();
    if (batch.isActive(now)) return err(new ConflictError("A geração ainda está em andamento."));
    if (!batch.canRetry(now)) return err(new ValidationError("Não há cartas com falha para gerar de novo."));
    await this.generations.resetFailedItems(batch.id);
    await this.generations.updateBatch(batch.id, { status: "pending", error: null });
    return success({ id: batch.id });
  }
}

export { RetryCardGeneration };
