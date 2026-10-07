"use client";

import { Select } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel: string;
}

function SelectField({ value, onValueChange, options, placeholder, ariaLabel }: SelectFieldProps) {
  return (
    <Select.Root
      value={value}
      onValueChange={(next) => {
        if (typeof next === "string") onValueChange(next);
      }}
    >
      <Select.Trigger
        aria-label={ariaLabel}
        className="glass flex h-11 w-full items-center justify-between rounded-2xl px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown className="size-4" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="z-50" sideOffset={6}>
          <Select.Popup className="glass max-h-72 min-w-[var(--anchor-width)] overflow-auto rounded-3xl p-1">
            <Select.List>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground data-highlighted:bg-muted"
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

export { SelectField };
export type { SelectOption };
