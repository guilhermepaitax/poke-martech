import * as Sentry from "@sentry/nextjs";
import { sentryInitOptions } from "@/lib/sentry-options";

Sentry.init(sentryInitOptions());

export function onRouterTransitionStart(
  href: string,
  navigationType: "push" | "replace" | "traverse",
) {
  Sentry.captureRouterTransitionStart(href, navigationType);
}
