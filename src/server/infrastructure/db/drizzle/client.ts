import * as schema from "@/server/infrastructure/db/drizzle/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connection = postgres(process.env.DATABASE_URL!, { max: 1 });

const db = drizzle(connection, { schema });

export { db };
