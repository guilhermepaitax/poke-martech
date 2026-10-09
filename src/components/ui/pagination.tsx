import { Button } from "@/components/ui/button";
import { pageWindow } from "@/lib/paginate";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

interface PaginationProps extends ComponentProps<"nav"> {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

function Pagination({ page, pageCount, onPageChange, className, ...props }: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = pageWindow(page, pageCount);
  return (
    <nav
      data-slot="pagination"
      aria-label={`Paginação, página ${page} de ${pageCount}`}
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
      {...props}
    >
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Anterior
      </Button>
      <div className="glass flex flex-wrap gap-1 rounded-full p-1">
        {pages.map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} aria-hidden className="px-1 text-sm text-foreground-subtle">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === page ? "page" : undefined}
              data-selected={item === page ? "" : undefined}
              onClick={() => onPageChange(item)}
              className="size-8 cursor-pointer rounded-full text-sm font-medium text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-selected:bg-primary data-selected:text-primary-foreground"
            >
              {item}
            </button>
          ),
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima
      </Button>
    </nav>
  );
}

export { Pagination };
