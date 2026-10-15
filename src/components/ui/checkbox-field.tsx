"use client";

import { Checkbox } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";

interface CheckboxFieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  id?: string;
  name?: string;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

function CheckboxField({
  checked,
  onCheckedChange,
  label,
  id,
  name,
  required,
  invalid,
  describedBy,
}: CheckboxFieldProps) {
  return (
    <label
      data-slot="checkbox-field"
      data-invalid={invalid ? "" : undefined}
      className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground data-invalid:text-destructive cursor-pointer"
    >
      <Checkbox.Root
        id={id}
        name={name}
        checked={checked}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        data-invalid={invalid ? "" : undefined}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-gray-300 cursor-pointer bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-primary data-checked:text-primary-foreground data-invalid:border-destructive"
      >
        <Checkbox.Indicator>
          <Check className="size-3" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      {label}
    </label>
  );
}

export { CheckboxField };
