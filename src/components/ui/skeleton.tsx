import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("skeleton-shimmer rounded-2xl", className)}
      {...props}
    />
  );
}

function LoadingScreen({
  label,
  className,
  children,
  ...props
}: ComponentProps<"div"> & { label: string }) {
  return (
    <div
      data-slot="loading-screen"
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={className}
      {...props}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function ListRowSkeleton({
  thumb = "square",
  lines = 2,
}: {
  thumb?: "square" | "circle" | "pack" | "none";
  lines?: 1 | 2;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-3xl px-3 py-3" aria-hidden>
      {thumb === "square" ? <Skeleton className="size-14 shrink-0 rounded-2xl" /> : null}
      {thumb === "circle" ? <Skeleton className="size-12 shrink-0 rounded-full" /> : null}
      {thumb === "pack" ? <Skeleton className="h-16 w-10 shrink-0 rounded-md" /> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/5 max-w-48" />
        {lines === 2 ? <Skeleton className="h-3 w-1/4 max-w-32" /> : null}
      </div>
      <Skeleton className="h-3 w-14 shrink-0" />
    </div>
  );
}

function ListSkeleton({
  count = 5,
  thumb = "square",
  lines = 2,
}: {
  count?: number;
  thumb?: "square" | "circle" | "pack" | "none";
  lines?: 1 | 2;
}) {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <ListRowSkeleton key={index} thumb={thumb} lines={lines} />
      ))}
    </div>
  );
}

function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="aspect-[63/88] w-full rounded-[4%]" />
          <Skeleton className="mx-auto h-3 w-12" />
          <Skeleton className="mx-auto h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

function ShopGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="glass flex h-full flex-col gap-4 rounded-3xl p-4">
          <Skeleton className="mx-auto aspect-[2/3] w-3/4 rounded-2xl" />
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      ))}
    </div>
  );
}

function ProposalSkeleton() {
  return (
    <div className="glass flex flex-col gap-4 rounded-3xl p-4" aria-hidden>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-14 w-10 shrink-0 rounded-md" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-8 w-24 rounded-full" />
    </div>
  );
}

function FormPanelSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="glass flex flex-col gap-5 rounded-3xl p-5" aria-hidden>
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export {
  CardGridSkeleton,
  FormPanelSkeleton,
  ListSkeleton,
  LoadingScreen,
  ProposalSkeleton,
  ShopGridSkeleton,
  Skeleton,
};
