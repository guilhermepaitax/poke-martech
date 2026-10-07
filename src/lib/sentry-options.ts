import * as Sentry from "@sentry/nextjs";

function readTracesSampleRate(): number {
  const raw = process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
  if (raw) {
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return process.env.NODE_ENV === "development" ? 1 : 0.1;
}

function sentryInitOptions() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.NODE_ENV,
    sendDefaultPii: false,
    tracesSampleRate: readTracesSampleRate(),
    integrations: [Sentry.featureFlagsIntegration()],
  };
}

export { sentryInitOptions };
