import { cn } from "@/lib/utils";

interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  value: string;
  options: SegmentedOption[];
  onValueChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}

function SegmentedControl({
  value,
  options,
  onValueChange,
  ariaLabel,
  className,
}: SegmentedControlProps) {
  return (
    <div
      data-slot="segmented-control"
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "glass flex w-fit max-w-full flex-wrap gap-1 rounded-3xl p-1",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          data-selected={value === option.value ? "" : undefined}
          onClick={() => onValueChange(option.value)}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-selected:bg-primary data-selected:text-primary-foreground cursor-pointer"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export { SegmentedControl };
export type { SegmentedOption };
