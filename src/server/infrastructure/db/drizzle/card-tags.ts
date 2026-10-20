import { asc, eq, inArray } from "drizzle-orm";
import { foldText, normalizeCardTags } from "@/lib/value-objects/card-tag";
import type { db } from "@/server/infrastructure/db/drizzle/client";
import { cardTags, tags } from "@/server/infrastructure/db/drizzle/schema";

type Executor = Pick<typeof db, "select" | "insert" | "delete">;

async function tagsByCard(
  executor: Pick<typeof db, "select">,
  cardIds: string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (cardIds.length === 0) return result;
  const rows = await executor
    .select({ cardId: cardTags.cardId, name: tags.name })
    .from(cardTags)
    .innerJoin(tags, eq(tags.id, cardTags.tagId))
    .where(inArray(cardTags.cardId, cardIds))
    .orderBy(asc(cardTags.sortOrder), asc(tags.name));
  for (const row of rows) {
    const list = result.get(row.cardId);
    if (list) list.push(row.name);
    else result.set(row.cardId, [row.name]);
  }
  return result;
}

async function replaceCardTags(executor: Executor, cardId: string, names: string[]) {
  await executor.delete(cardTags).where(eq(cardTags.cardId, cardId));
  const values = normalizeCardTags(names).map((name) => ({
    name,
    normalizedName: foldText(name),
  }));
  if (values.length === 0) return;
  await executor.insert(tags).values(values).onConflictDoNothing({ target: tags.normalizedName });
  const rows = await executor
    .select({ id: tags.id, normalizedName: tags.normalizedName })
    .from(tags)
    .where(
      inArray(
        tags.normalizedName,
        values.map((value) => value.normalizedName),
      ),
    );
  const ids = new Map(rows.map((row) => [row.normalizedName, row.id]));
  await executor.insert(cardTags).values(
    values.flatMap((value, sortOrder) => {
      const tagId = ids.get(value.normalizedName);
      return tagId ? [{ cardId, tagId, sortOrder }] : [];
    }),
  );
}

export { replaceCardTags, tagsByCard };
