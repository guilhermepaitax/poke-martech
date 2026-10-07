"use client";

import { useObservabilityIdentity } from "./use-observability-identity";

function ObservabilityIdentity({ userId, username }: { userId: string; username: string }) {
  useObservabilityIdentity(userId, username);
  return null;
}

export { ObservabilityIdentity };
