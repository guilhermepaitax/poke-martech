import * as schema from "@/server/infrastructure/db/drizzle/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connection = postgres(process.env.DATABASE_URL!, {
  max: Number(process.env.DATABASE_POOL_MAX) || 3,
  prepare: process.env.DATABASE_PREPARE !== "false",
});

const db = drizzle(connection, { schema });

export { db };
