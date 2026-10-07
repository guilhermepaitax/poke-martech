import { CardGenerationForm } from "@/components/card-generation-form/card-generation-form";

export default function GenerateCardsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Gerar cartas com IA</h1>
      <CardGenerationForm />
    </div>
  );
}
