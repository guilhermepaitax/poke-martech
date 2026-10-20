import type { Actor } from "@/server/application/actor";
import { requireAdmin } from "@/server/application/authorize";
import type { TagRepository } from "@/server/application/contracts/repositories/tag-repository";
import { success, type Result } from "@/server/shared/result";
import type { CardTag } from "@/types/catalog";

class ListAdminTags {
  constructor(private readonly tags: TagRepository) {}

  async execute(actor: Actor | null): Promise<Result<CardTag[]>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    const tags = await this.tags.list();
    return success(tags.map((tag) => ({ id: tag.id, name: tag.name })));
  }
}

export { ListAdminTags };
