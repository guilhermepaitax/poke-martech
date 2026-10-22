import { FeatureUnavailable } from "@/components/feature-flags/feature-unavailable";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { isFeatureEnabled } from "@/lib/feature-flags.server";

export default async function LojaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isFeatureEnabled(FEATURE_FLAGS.loja))) {
    return <FeatureUnavailable title="Loja" />;
  }

  return children;
}
