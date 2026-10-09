import { BackLink } from "@/components/ui/back-link";
import { FeatureUnavailable } from "@/components/feature-flags/feature-unavailable";
import { OpponentForm } from "@/components/opponent-form/opponent-form";
import { FEATURE_FLAGS, isFeatureEnabled } from "@/lib/feature-flags";

export default function NewOpponentPage() {
  if (!isFeatureEnabled(FEATURE_FLAGS.opponentRegistration)) {
    return <FeatureUnavailable title="Cadastro de adversários" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <BackLink fallback="/admin/adversarios" />
      <h1 className="text-2xl font-semibold">Novo adversário</h1>
      <OpponentForm />
    </div>
  );
}
