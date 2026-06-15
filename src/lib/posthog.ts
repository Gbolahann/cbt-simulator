// src/lib/posthog.ts
import posthog from "posthog-js";

// ✅ Export moved to the top to satisfy strict TypeScript checks
export { posthog };

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
    disable_surveys: true,
    disable_session_recording: true,
  });

  initialised = true;
}