import { BackLink } from "@/components/ui/back-link";
import { CardForm } from "@/components/card-form/card-form";

export default async function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-4">
      <BackLink fallback="/admin/cartas" />
      <h1 className="text-2xl font-semibold">Editar carta</h1>
      <CardForm cardId={id} />
    </div>
  );
}
