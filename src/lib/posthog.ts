// src/lib/posthog.ts
// PostHog analytics initialisation — deferred 3s after mount so it does
// not block the critical rendering path or inflate Total Blocking Time.

import posthog from "posthog-js";

let initialised = false;

export function initPostHog(): void {
  if (typeof window === "undefined") return;
  if (initialised) return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.warn(
      "[posthog] NEXT_PUBLIC_POSTHOG_KEY not set — analytics disabled",
    );
    return;
  }

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    persistence: "localStorage",

    // WHY disable_surveys: true
    // PostHog loads surveys.js (25 KB) by default even when you have no
    // surveys configured. Lighthouse flagged this as 25 KB of unused
    // JavaScript on every page load. Disabling it entirely removes that
    // download and eliminates the wasted-bytes warning.
    disable_surveys: true,

    // Disable session recording — not needed for a practice exam platform
    // and it adds significant CPU work on the client.
    disable_session_recording: true,
  });

  initialised = true;
}

export { posthog };
