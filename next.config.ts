// next.config.ts
import type { NextConfig } from "next";
import withSerwist from "@serwist/next";
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

// 1. Bundle Analyzer setup
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// 2. Base Next.js config
// (Removed 'optimizePackageImports' because it was causing a TypeScript error in your version)
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

// 3. Wrap with Serwist (PWA)
const withSerwistConfig = withSerwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
})(nextConfig);

// 4. Wrap with Bundle Analyzer and Sentry
// (Fixed: Replaced the deprecated 'disableClientWebpackPlugin' with the modern Sentry v10 'sourcemaps' option)
export default withSentryConfig(withBundleAnalyzer(withSerwistConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: {
    disable: process.env.NODE_ENV === "development",
  },
});

// 5. Sentry server-side registration
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}
