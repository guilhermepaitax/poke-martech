import { CardForm } from "@/components/card-form/card-form";

export default function NewCardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Nova carta</h1>
      <CardForm />
    </div>
  );
}
