import { FeatureUnavailable } from "@/components/feature-flags/feature-unavailable";
import { PackOpening } from "@/components/pack-opening/pack-opening";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { isFeatureEnabled } from "@/lib/feature-flags.server";

export default async function OpeningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isFeatureEnabled(FEATURE_FLAGS.loja))) {
    return <FeatureUnavailable title="Loja" />;
  }

  const { id } = await params;
  return <PackOpening id={id} />;
}
