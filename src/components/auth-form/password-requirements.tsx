import type { PasswordCheck } from "@/lib/password-policy";
import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";

function PasswordRequirements({
  checks,
  invalid,
}: {
  checks: PasswordCheck[];
  invalid: boolean;
}) {
  return (
    <ul
      id="password-requirements"
      data-slot="password-requirements"
      aria-label="Requisitos da senha"
      className="flex flex-col gap-1.5"
    >
      {checks.map((check) => (
        <li
          key={check.id}
          data-met={check.met ? "" : undefined}
          data-invalid={!check.met && invalid ? "" : undefined}
          className="flex items-center gap-2 text-sm text-foreground-subtle data-invalid:text-destructive data-met:text-foreground"
        >
          {check.met ? (
            <Check className="size-3.5 shrink-0 text-primary" />
          ) : (
            <Circle
              className={cn(
                "size-3.5 shrink-0",
                invalid && "text-destructive",
              )}
            />
          )}
          <span className="sr-only">{check.met ? "Atendido: " : "Pendente: "}</span>
          {check.label}
        </li>
      ))}
    </ul>
  );
}

export { PasswordRequirements };
