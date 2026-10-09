"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { MicrosoftClarity } from "@/components/analytics/microsoft-clarity";
import { FeatureFlagsProvider } from "@/components/feature-flags/feature-flags-provider";
import { ToastProvider } from "@/components/ui/toaster";
import type { FeatureFlagMap } from "@/lib/feature-flags";
import { queryClient } from "@/lib/query-client";

function Providers({
  children,
  featureFlags,
}: {
  children: ReactNode;
  featureFlags: FeatureFlagMap;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <MicrosoftClarity />
      <FeatureFlagsProvider flags={featureFlags}>
        <ToastProvider>{children}</ToastProvider>
      </FeatureFlagsProvider>
    </QueryClientProvider>
  );
}

export { Providers };
