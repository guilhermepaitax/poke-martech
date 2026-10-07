import type { PokemonTypeRepository } from "@/server/application/contracts/repositories/pokemon-type-repository";
import { success, type Result } from "@/server/shared/result";
import type { PokemonType as PokemonTypeDto } from "@/types/catalog";

class ListPokemonTypes {
  constructor(private readonly types: PokemonTypeRepository) {}

  async execute(): Promise<Result<PokemonTypeDto[]>> {
    const types = await this.types.list();
    return success(types.map((type) => ({ code: type.code, name: type.name })));
  }
}

export { ListPokemonTypes };
