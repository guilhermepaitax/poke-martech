import { FeatureUnavailable } from "@/components/feature-flags/feature-unavailable";
import { FEATURE_FLAGS, isFeatureEnabled } from "@/lib/feature-flags";

export default function BattleLayout({ children }: { children: React.ReactNode }) {
  if (!isFeatureEnabled(FEATURE_FLAGS.battle)) {
    return <FeatureUnavailable title="Batalha" />;
  }

  return children;
}
