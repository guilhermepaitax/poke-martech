"use client";

import { useContext } from "react";
import type { FeatureFlag, FeatureFlagMap } from "@/lib/feature-flags";
import { FeatureFlagsContext } from "./feature-flags-context";

function useFeatureFlags(): FeatureFlagMap {
  const flags = useContext(FeatureFlagsContext);
  if (!flags) throw new Error("Feature flags indisponíveis.");
  return flags;
}

function useFeatureFlag(flag: FeatureFlag): boolean {
  return useFeatureFlags()[flag];
}

export { useFeatureFlag, useFeatureFlags };
