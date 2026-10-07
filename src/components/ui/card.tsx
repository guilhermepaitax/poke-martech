import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("glass flex flex-col gap-4 rounded-3xl p-5", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1", className)} {...props} />;
}

function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2 data-slot="card-title" className={cn("text-lg font-semibold", className)} {...props} />
  );
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn(className)} {...props} />;
}

export { Card, CardContent, CardHeader, CardTitle };
