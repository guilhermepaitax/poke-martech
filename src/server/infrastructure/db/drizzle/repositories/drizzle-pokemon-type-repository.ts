import { ENERGY_TYPES, isEnergyType } from "@/lib/value-objects/card";
import type { PokemonTypeRepository } from "@/server/application/contracts/repositories/pokemon-type-repository";
import { PokemonType } from "@/server/application/entities/pokemon-type";
import { db } from "@/server/infrastructure/db/drizzle/client";
import { pokemonTypes } from "@/server/infrastructure/db/drizzle/schema";

class DrizzlePokemonTypeRepository implements PokemonTypeRepository {
  async list(): Promise<PokemonType[]> {
    const rows = await db.select().from(pokemonTypes);
    const order = new Map(ENERGY_TYPES.map((code, index) => [code, index]));
    return rows
      .flatMap((row) => {
        if (!isEnergyType(row.code)) return [];
        return [new PokemonType(row.code, row.name)];
      })
      .sort((left, right) => (order.get(left.code) ?? ENERGY_TYPES.length) - (order.get(right.code) ?? ENERGY_TYPES.length));
  }
}

export { DrizzlePokemonTypeRepository };
