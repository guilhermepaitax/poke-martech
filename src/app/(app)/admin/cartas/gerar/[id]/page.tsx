import { CardGenerationProgress } from "@/components/card-generation-form/card-generation-progress";

export default async function CardGenerationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Geração de cartas</h1>
      <CardGenerationProgress generationId={id} />
    </div>
  );
}
