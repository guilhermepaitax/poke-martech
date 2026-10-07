"use client";

import { QueryClient } from "@tanstack/react-query";

declare global {
  var _queryClient: QueryClient | undefined;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
  });
}

const queryClient = globalThis._queryClient ?? makeQueryClient();
if (process.env.NODE_ENV !== "production") globalThis._queryClient = queryClient;

export { queryClient };
