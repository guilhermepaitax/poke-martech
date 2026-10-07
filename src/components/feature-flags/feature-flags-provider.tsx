"use client";

import type { ReactNode } from "react";
import type { FeatureFlagMap } from "@/lib/feature-flags";
import { FeatureFlagsContext } from "./feature-flags-context";
import { useTrackFeatureFlags } from "./use-track-feature-flags";

function FeatureFlagsProvider({
  flags,
  children,
}: {
  flags: FeatureFlagMap;
  children: ReactNode;
}) {
  useTrackFeatureFlags(flags);

  return <FeatureFlagsContext.Provider value={flags}>{children}</FeatureFlagsContext.Provider>;
}

export { FeatureFlagsProvider };
