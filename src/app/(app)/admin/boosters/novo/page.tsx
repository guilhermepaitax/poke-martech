import { BackLink } from "@/components/ui/back-link";
import { BoosterForm } from "@/components/booster-form/booster-form";

export default function NewBoosterPage() {
  return (
    <div className="flex flex-col gap-4">
      <BackLink fallback="/admin/boosters" />
      <h1 className="text-2xl font-semibold">Novo pacote</h1>
      <BoosterForm />
    </div>
  );
}
