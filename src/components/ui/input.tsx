import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "h-11 w-full rounded-2xl border border-gray-200 bg-white/50 px-3 text-sm text-foreground outline-none backdrop-blur-md placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full rounded-2xl border border-gray-200 bg-white/50 px-3 py-2 text-sm text-foreground outline-none backdrop-blur-md placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("text-sm font-medium text-foreground-subtle", className)}
      {...props}
    />
  );
}

export { Input, Label, Textarea };
