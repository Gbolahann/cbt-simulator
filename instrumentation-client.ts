// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever the client-side app loads.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://9134089f0b67cee539834cb203e12bba@o4511524558536704.ingest.us.sentry.io/4511524564893696",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Capture unhandled promise rejections
  attachStacktrace: true,
});
