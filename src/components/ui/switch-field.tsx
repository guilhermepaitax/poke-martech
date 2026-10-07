"use client";

import { Switch } from "@base-ui/react/switch";

interface SwitchFieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

function SwitchField({ checked, onCheckedChange, label }: SwitchFieldProps) {
  return (
    <label data-slot="switch-field" className="flex items-center justify-between gap-3 rounded-2xl bg-white/45 px-3 py-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
        className="group relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-primary"
      >
        <Switch.Thumb className="size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform group-data-checked:translate-x-5" />
      </Switch.Root>
    </label>
  );
}

export { SwitchField };
