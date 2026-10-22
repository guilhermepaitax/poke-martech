import { vercelAdapter } from "@flags-sdk/vercel";
import { flag } from "flags/next";

const booleanOptions = [
  { value: false, label: "Desligada" },
  { value: true, label: "Ligada" },
];

function booleanFlag(key: string, description: string) {
  return flag<boolean>({
    key,
    description,
    defaultValue: true,
    options: booleanOptions,
    adapter: vercelAdapter,
  });
}

const aiCardGeneration = booleanFlag(
  "ai-card-generation",
  "Geração de cartas com IA no admin",
);
const arena = booleanFlag("arena", "Batalha na arena");
const pokedex = booleanFlag("pokedex", "Acesso à Pokédex");
const trocas = booleanFlag("trocas", "Acesso às trocas");
const loja = booleanFlag("loja", "Acesso à loja");

export { aiCardGeneration, arena, loja, pokedex, trocas };
