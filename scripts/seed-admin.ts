import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { user } from "../src/server/infrastructure/db/drizzle/schema";

config({ path: ".env" });

const email = process.argv[2];
if (!email) {
  console.error("Uso: pnpm db:seed-admin email@exemplo.com");
  process.exit(1);
}

async function main() {
  const { db } = await import("../src/server/infrastructure/db/drizzle/client");

  const updated = await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.email, email))
    .returning({ id: user.id });

  if (updated.length === 0) {
    console.error("Nenhum usuário com esse e-mail. Cadastre-o antes de promover.");
    process.exit(1);
  }

  console.log(`Admin definido para ${email}.`);
  await db.$client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
