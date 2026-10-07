import { BoosterForm } from "@/components/booster-form/booster-form";

export default async function EditBoosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Editar pacote</h1>
      <BoosterForm boosterId={id} />
    </div>
  );
}
