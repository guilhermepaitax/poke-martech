import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env" });

async function main() {
  const { db } = await import("../src/server/infrastructure/db/drizzle/client");

  const before = await db.execute<{
    min: number | null;
    max: number | null;
    count: number;
  }>(sql`
    SELECT MIN(number)::int AS min, MAX(number)::int AS max, COUNT(*)::int AS count
    FROM cards
  `);
  const snapshot = before[0];

  if (!snapshot || snapshot.count === 0) {
    console.log("Nenhuma carta para renumerar.");
    await db.$client.end();
    return;
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`
      UPDATE cards
      SET number = -number
    `);

    await tx.execute(sql`
      WITH numbered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY ABS(number), id) AS n
        FROM cards
      )
      UPDATE cards AS c
      SET number = numbered.n
      FROM numbered
      WHERE c.id = numbered.id
    `);

    await tx.execute(sql`
      SELECT setval(
        'cards_number_seq',
        GREATEST((SELECT MAX(number) FROM cards), 1),
        true
      )
    `);
  });

  const after = await db.execute<{
    min: number;
    max: number;
    count: number;
  }>(sql`
    SELECT MIN(number)::int AS min, MAX(number)::int AS max, COUNT(*)::int AS count
    FROM cards
  `);
  const result = after[0];

  console.log(
    `${result.count} cartas renumeradas: #${snapshot.min}–#${snapshot.max} passou a #${result.min}–#${result.max}.`,
  );
  await db.$client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
