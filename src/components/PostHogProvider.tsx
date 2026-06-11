"use client";
// src/components/PostHogProvider.tsx
// PostHog is deferred by 3 seconds after page load.
// This removes it from the critical rendering path entirely.

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  useEffect(() => {
    // Delay PostHog initialisation — do not block initial page render
    const timer = setTimeout(async () => {
      const { initPostHog, posthog } = await import("@/lib/posthog");
      initPostHog();

      if (session?.user?.id) {
        posthog.identify(session.user.id, {
          name: session.user.displayName,
        });
      }
    }, 3000); // 3 seconds after mount

    return () => clearTimeout(timer);
  }, [session?.user?.id, session?.user?.displayName]);

  return <>{children}</>;
}
