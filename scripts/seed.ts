import { config } from "dotenv";
import type { EnergyType } from "../src/lib/value-objects/card";
import { RARITIES } from "../src/lib/value-objects/card";
import { pokemonTypes, rarityWeights } from "../src/server/infrastructure/db/drizzle/schema";

config({ path: ".env" });

const defaults: Record<(typeof RARITIES)[number], number> = {
  common: 1000,
  uncommon: 400,
  rare: 150,
  double_rare: 40,
  art_rare: 25,
  super_rare: 8,
  immersive: 2,
  crown: 1,
};

const POKEMON_TYPE_NAMES: Record<EnergyType, string> = {
  careca: "Careca",
  devops: "DevOps",
  "ux-ui": "UX/UI",
  "full-stack": "Full Stack",
  frontend: "Frontend",
  qa: "QA",
  backend: "Backend",
  "testes-automatizados": "Testes Automatizados",
  "admin-generico": "Admin Genérico",
  ia: "IA",
};

async function main() {
  const { db } = await import("../src/server/infrastructure/db/drizzle/client");

  for (const [code, name] of Object.entries(POKEMON_TYPE_NAMES) as [EnergyType, string][]) {
    await db.insert(pokemonTypes).values({ code, name }).onConflictDoNothing();
  }

  for (const rarity of RARITIES) {
    await db
      .insert(rarityWeights)
      .values({ rarity, weight: defaults[rarity] })
      .onConflictDoNothing();
  }

  console.log("Tipos e pesos de raridade prontos.");
  await db.$client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
