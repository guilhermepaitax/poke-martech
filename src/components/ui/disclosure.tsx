import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DisclosureProps {
  title: string;
  children: ReactNode;
  className?: string;
}

function Disclosure({ title, children, className }: DisclosureProps) {
  return (
    <details data-slot="disclosure" className={cn("glass group rounded-3xl p-4", className)}>
      <summary className="cursor-pointer list-none font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-3">
          {title}
          <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </details>
  );
}

export { Disclosure };
