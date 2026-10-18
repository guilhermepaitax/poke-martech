const FEATURE_FLAGS = {
  aiCardGeneration: "ai-card-generation",
  arena: "arena",
} as const;

type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

type FeatureFlagMap = Record<FeatureFlag, boolean>;

const FEATURE_FLAG_ENV: Record<FeatureFlag, string> = {
  "ai-card-generation": "FEATURE_FLAG_AI_CARD_GENERATION",
  arena: "FEATURE_FLAG_ARENA",
};

const DISABLED_VALUES = new Set(["false", "0", "off", "no"]);

function isEnabledValue(value: string | undefined): boolean {
  if (value === undefined || value.trim() === "") return true;
  return !DISABLED_VALUES.has(value.trim().toLowerCase());
}

function readFeatureFlags(): FeatureFlagMap {
  return {
    "ai-card-generation": isEnabledValue(process.env[FEATURE_FLAG_ENV["ai-card-generation"]]),
    arena: isEnabledValue(process.env[FEATURE_FLAG_ENV.arena]),
  };
}

function isFeatureEnabled(flag: FeatureFlag): boolean {
  return readFeatureFlags()[flag];
}

export { FEATURE_FLAGS, isFeatureEnabled, readFeatureFlags };
export type { FeatureFlag, FeatureFlagMap };
