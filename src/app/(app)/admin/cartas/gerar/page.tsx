import { BackLink } from "@/components/ui/back-link";
import { CardGenerationForm } from "@/components/card-generation-form/card-generation-form";

export default function GenerateCardsPage() {
  return (
    <div className="flex flex-col gap-4">
      <BackLink fallback="/admin/cartas" />
      <h1 className="text-2xl font-semibold">Gerar cartas com IA</h1>
      <CardGenerationForm />
    </div>
  );
}
