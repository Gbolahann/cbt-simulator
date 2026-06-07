"use client";
// src/components/PostHogProvider.tsx
// Initialises PostHog on app load and identifies the logged-in user.

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { initPostHog, posthog } from "@/lib/posthog";

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  useEffect(() => {
    initPostHog();
  }, []);

  // When a user logs in, identify them in PostHog
  // This links all their events to one profile
  useEffect(() => {
    if (session?.user?.id) {
      posthog.identify(session.user.id, {
        // Only send non-sensitive properties
        name: session.user.displayName,
      });
    } else {
      // When logged out, reset to anonymous
      posthog.reset();
    }
  }, [session?.user?.displayName, session?.user?.id]);

  return <>{children}</>;
}
