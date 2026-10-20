import type { Tag } from "@/server/application/entities/tag";

interface TagRepository {
  list(): Promise<Tag[]>;
}

export type { TagRepository };
