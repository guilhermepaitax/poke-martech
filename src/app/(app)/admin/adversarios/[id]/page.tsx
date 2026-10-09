import { BackLink } from "@/components/ui/back-link";
import { OpponentForm } from "@/components/opponent-form/opponent-form";

export default async function EditOpponentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-4">
      <BackLink fallback="/admin/adversarios" />
      <h1 className="text-2xl font-semibold">Editar adversário</h1>
      <OpponentForm opponentId={id} />
    </div>
  );
}
