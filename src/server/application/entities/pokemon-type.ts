import type { EnergyType } from "@/lib/value-objects/card";

class PokemonType {
  constructor(
    readonly code: EnergyType,
    readonly name: string,
  ) {}
}

export { PokemonType };
