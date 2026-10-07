"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

function useCaptureException(error: Error) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
}

export { useCaptureException };
