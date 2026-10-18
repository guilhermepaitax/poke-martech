import { FeatureUnavailable } from "@/components/feature-flags/feature-unavailable";
import { FEATURE_FLAGS, isFeatureEnabled } from "@/lib/feature-flags";

export default function BatalhaLayout({ children }: { children: React.ReactNode }) {
  if (!isFeatureEnabled(FEATURE_FLAGS.arena)) {
    return <FeatureUnavailable title="Batalha" />;
  }

  return children;
}
