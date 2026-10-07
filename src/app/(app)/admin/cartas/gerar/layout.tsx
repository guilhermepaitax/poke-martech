import { FeatureUnavailable } from "@/components/feature-flags/feature-unavailable";
import { FEATURE_FLAGS, isFeatureEnabled } from "@/lib/feature-flags";

export default function GenerateCardsLayout({ children }: { children: React.ReactNode }) {
  if (!isFeatureEnabled(FEATURE_FLAGS.aiCardGeneration)) {
    return <FeatureUnavailable title="Geração de cartas com IA" />;
  }

  return children;
}
