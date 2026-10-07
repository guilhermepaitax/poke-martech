import { Badge } from "@/components/ui/badge";
import type { GenerationStatus } from "@/lib/value-objects/card-generation";

const STATUS_LABELS: Record<GenerationStatus, string> = {
  pending: "Na fila",
  running: "Gerando",
  completed: "Concluída",
  failed: "Falhou",
};

const STATUS_VARIANTS = {
  pending: "outline",
  running: "accent",
  completed: "secondary",
  failed: "outline",
} as const;

function CardGenerationStatus({ status }: { status: GenerationStatus }) {
  return (
    <Badge
      data-slot="card-generation-status"
      variant={STATUS_VARIANTS[status]}
      className={status === "failed" ? "text-destructive" : undefined}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export { CardGenerationStatus };
