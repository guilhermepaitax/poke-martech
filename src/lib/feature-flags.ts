const FEATURE_FLAGS = {
  battle: "battle",
  aiCardGeneration: "ai-card-generation",
  opponentRegistration: "opponent-registration",
} as const;

type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

type FeatureFlagMap = Record<FeatureFlag, boolean>;

const FEATURE_FLAG_ENV: Record<FeatureFlag, string> = {
  battle: "FEATURE_FLAG_BATTLE",
  "ai-card-generation": "FEATURE_FLAG_AI_CARD_GENERATION",
  "opponent-registration": "FEATURE_FLAG_OPPONENT_REGISTRATION",
};

const DISABLED_VALUES = new Set(["false", "0", "off", "no"]);

function isEnabledValue(value: string | undefined): boolean {
  if (value === undefined || value.trim() === "") return true;
  return !DISABLED_VALUES.has(value.trim().toLowerCase());
}

function readFeatureFlags(): FeatureFlagMap {
  return {
    battle: isEnabledValue(process.env[FEATURE_FLAG_ENV.battle]),
    "ai-card-generation": isEnabledValue(process.env[FEATURE_FLAG_ENV["ai-card-generation"]]),
    "opponent-registration": isEnabledValue(process.env[FEATURE_FLAG_ENV["opponent-registration"]]),
  };
}

function isFeatureEnabled(flag: FeatureFlag): boolean {
  return readFeatureFlags()[flag];
}

export { FEATURE_FLAGS, isFeatureEnabled, readFeatureFlags };
export type { FeatureFlag, FeatureFlagMap };
