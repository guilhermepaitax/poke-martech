import { asc } from "drizzle-orm";
import type { TagRepository } from "@/server/application/contracts/repositories/tag-repository";
import { Tag } from "@/server/application/entities/tag";
import { db } from "@/server/infrastructure/db/drizzle/client";
import { tags } from "@/server/infrastructure/db/drizzle/schema";

class DrizzleTagRepository implements TagRepository {
  async list(): Promise<Tag[]> {
    const rows = await db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .orderBy(asc(tags.normalizedName));
    return rows.map((row) => new Tag(row.id, row.name));
  }
}

export { DrizzleTagRepository };
