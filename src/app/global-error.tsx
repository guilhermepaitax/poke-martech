"use client";

import { Sora } from "next/font/google";
import { AppErrorFallback } from "@/components/app-error/app-error-fallback";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="pt-BR" className={`${sora.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <AppErrorFallback error={error} retry={retry} />
      </body>
    </html>
  );
}
