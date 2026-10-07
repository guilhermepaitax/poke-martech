import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  tunnelRoute: "/monitoring",
  sourcemaps: {
    disable: process.env.SENTRY_AUTH_TOKEN ? false : "disable-upload",
  },
  webpack: {
    automaticVercelMonitors: false,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
