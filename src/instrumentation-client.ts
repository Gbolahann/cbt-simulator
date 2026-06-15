// src/instrumentation-client.ts
import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry in production to avoid bloating dev builds
// and reduce bundle impact on the login page
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: "https://9134089f0b67cee539834cb203e12bba@o4511524558536704.ingest.us.sentry.io/4511524564893696",
    // CRITICAL: Reduce from 1.0 to 0.1 — 100% sampling is killing performance
    tracesSampleRate: 0.1,
    // Only capture errors in production, not every trace
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enableLogs: false, // Disable logs — not needed for a CBT app
    sendDefaultPii: false, // Don't send PII unless legally required
    attachStacktrace: true,
  });
}
