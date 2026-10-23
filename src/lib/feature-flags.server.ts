import { aiCardGeneration, arena, arenaMapEditor, loja, pokedex, trocas } from "@/flags";
import type { FeatureFlag, FeatureFlagMap } from "@/lib/feature-flags";
import { evaluate } from "flags/next";

const FLAG_DECLARATIONS = {
  "ai-card-generation": aiCardGeneration,
  arena,
  "arena-map-editor": arenaMapEditor,
  pokedex,
  trocas,
  loja,
} as const satisfies Record<FeatureFlag, () => Promise<boolean>>;

async function readFeatureFlags(): Promise<FeatureFlagMap> {
  return evaluate(FLAG_DECLARATIONS);
}

async function isFeatureEnabled(flag: FeatureFlag): Promise<boolean> {
  return FLAG_DECLARATIONS[flag]();
}

export { isFeatureEnabled, readFeatureFlags };
