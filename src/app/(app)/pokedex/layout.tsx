import { FeatureUnavailable } from "@/components/feature-flags/feature-unavailable";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { isFeatureEnabled } from "@/lib/feature-flags.server";

export default async function PokedexLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isFeatureEnabled(FEATURE_FLAGS.pokedex))) {
    return <FeatureUnavailable title="Pokédex" />;
  }

  return children;
}
