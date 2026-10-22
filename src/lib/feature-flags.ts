const FEATURE_FLAGS = {
  aiCardGeneration: "ai-card-generation",
  arena: "arena",
  pokedex: "pokedex",
  trocas: "trocas",
  loja: "loja",
} as const;

type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

type FeatureFlagMap = Record<FeatureFlag, boolean>;

export { FEATURE_FLAGS };
export type { FeatureFlag, FeatureFlagMap };
