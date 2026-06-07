// src/lib/posthog.ts
// Initialises PostHog analytics. Call initPostHog() once in the root layout.
// Call posthog.capture() anywhere to track events.

import posthog from "posthog-js";

let initialised = false;

export function initPostHog(): void {
  // Only runs in the browser (not during server-side rendering)
  if (typeof window === "undefined") return;
  // Only initialise once even if called multiple times
  if (initialised) return;
  // Only run if the key is configured
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.warn(
      "[posthog] NEXT_PUBLIC_POSTHOG_KEY not set — analytics disabled",
    );
    return;
  }

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false, // we capture manually for accuracy
    capture_pageleave: true,
    autocapture: false, // manual control only
    persistence: "localStorage",
    disable_session_recording: false,
  });

  initialised = true;
}

// Re-export posthog so other files import from one place
export { posthog };
