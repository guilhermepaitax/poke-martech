import * as Sentry from "@sentry/nextjs";
import type { FeatureFlag, FeatureFlagMap } from "@/lib/feature-flags";

function trackFeatureFlag(name: FeatureFlag, enabled: boolean) {
  Sentry.setTag(`feature.${name}`, enabled ? "on" : "off");
  const integration =
    Sentry.getClient()?.getIntegrationByName<Sentry.FeatureFlagsIntegration>("FeatureFlags");
  integration?.addFeatureFlag(name, enabled);
}

function trackFeatureFlags(flags: FeatureFlagMap) {
  for (const name of Object.keys(flags) as FeatureFlag[]) {
    trackFeatureFlag(name, flags[name]);
  }
}

export { trackFeatureFlag, trackFeatureFlags };
