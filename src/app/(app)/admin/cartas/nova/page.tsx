import { BackLink } from "@/components/ui/back-link";
import { CardForm } from "@/components/card-form/card-form";

export default function NewCardPage() {
  return (
    <div className="flex flex-col gap-4">
      <BackLink fallback="/admin/cartas" />
      <h1 className="text-2xl font-semibold">Nova carta</h1>
      <CardForm />
    </div>
  );
}
