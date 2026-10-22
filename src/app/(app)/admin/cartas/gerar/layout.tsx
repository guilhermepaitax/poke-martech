import { FeatureUnavailable } from "@/components/feature-flags/feature-unavailable";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { isFeatureEnabled } from "@/lib/feature-flags.server";

export default async function GenerateCardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isFeatureEnabled(FEATURE_FLAGS.aiCardGeneration))) {
    return <FeatureUnavailable title="Geração de cartas com IA" />;
  }

  return children;
}
