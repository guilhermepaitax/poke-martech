"use client";

import { Checkbox } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";

interface CheckboxFieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

function CheckboxField({ checked, onCheckedChange, label }: CheckboxFieldProps) {
  return (
    <label data-slot="checkbox-field" className="flex items-center gap-2 text-sm text-foreground">
      <Checkbox.Root
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="flex size-4 items-center justify-center rounded border border-white/80 bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-primary data-checked:text-primary-foreground"
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
