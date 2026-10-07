"use client";

import Clarity from "@microsoft/clarity";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

function useObservabilityIdentity(userId: string, username: string) {
  useEffect(() => {
    Sentry.setUser({ id: userId, username });
    const clarity = (window as Window & { clarity?: unknown }).clarity;
    if (process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID && typeof clarity === "function") {
      Clarity.identify(userId, undefined, undefined, username);
    }
    return () => {
      Sentry.setUser(null);
    };
  }, [userId, username]);
}

export { useObservabilityIdentity };
