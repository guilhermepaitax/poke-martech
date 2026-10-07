"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";
import type { FeatureFlagMap } from "@/lib/feature-flags";
import { trackFeatureFlags } from "@/lib/track-feature-flags";

function clarityReady(): boolean {
  const clarity = (window as Window & { clarity?: unknown }).clarity;
  return typeof clarity === "function";
}

function useTrackFeatureFlags(flags: FeatureFlagMap) {
  useEffect(() => {
    trackFeatureFlags(flags);
    if (!process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || !clarityReady()) return;
    for (const [name, enabled] of Object.entries(flags)) {
      Clarity.setTag(`feature.${name}`, enabled ? "on" : "off");
    }
  }, [flags]);
}

export { useTrackFeatureFlags };
