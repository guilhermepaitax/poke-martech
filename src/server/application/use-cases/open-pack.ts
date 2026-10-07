import { drawPack } from "@/server/application/draw-pack";
import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { PackPurchaseRepository } from "@/server/application/contracts/repositories/pack-repository";
import { NotFoundError, ValidationError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { PackOpening } from "@/types/catalog";

const messages = {
  not_found: "Pacote não encontrado.",
  inactive: "Pacote indisponível.",
  insufficient_coins: "Moedas insuficientes.",
  out_of_stock: "Pacote esgotado.",
  pool_too_small: "O pacote não tem cartas suficientes para abrir.",
  featured_unavailable: "O pacote não tem carta para o slot de destaque.",
  no_wallet: "Carteira não encontrada.",
} as const;

class OpenPack {
  constructor(private readonly purchases: PackPurchaseRepository) {}

  async execute(
    input: { slug: string },
    actor: Actor | null,
  ): Promise<Result<PackOpening>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const result = await this.purchases.purchase({
      userId: auth.value.id,
      boosterSlug: input.slug,
      draw: drawPack,
    });
    if (result.status === "not_found") return err(new NotFoundError("Pacote"));
    if (result.status !== "ok") return err(new ValidationError(messages[result.status]));
    return success(result.opening);
  }
}

export { OpenPack };
