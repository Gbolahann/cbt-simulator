"use client";
// src/components/exam/NetworkStatus.tsx

import { useEffect, useState } from "react";

// WHY the lazy initializer pattern:
// The original code called setOnline(navigator.onLine) synchronously
// inside useEffect, which ESLint flags as "Calling setState synchronously
// within an effect can trigger cascading renders".
// The fix: pass a function to useState() as the initial value.
// useState(() => ...) runs that function ONCE on first render to compute
// the initial value — so navigator.onLine is read at mount time without
// needing to call setState inside an effect at all.
// The typeof window check guards against server-side rendering where
// navigator does not exist.

export default function NetworkStatus() {
  const [online, setOnline] = useState<boolean>(() =>
    typeof window !== "undefined" ? navigator.onLine : true,
  );
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // These handlers only update state in response to network events,
    // which is the correct pattern — no synchronous setState in effect body
    const goOnline = () => {
      setOnline(true);
      setShowBanner(false);
    };
    const goOffline = () => {
      setOnline(false);
      setShowBanner(true);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []); // empty deps — listeners are registered once on mount

  // Nothing to show when online and no banner pending
  if (online && !showBanner) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50
                 px-5 py-3 rounded-full text-sm font-medium
                 text-white shadow-lg flex items-center gap-2"
      style={{
        backgroundColor: online
          ? "var(--color-accent-success)"
          : "var(--color-accent-warning)",
      }}
    >
      {online ? (
        <>✓ Back online — answers syncing</>
      ) : (
        <>⚠ Offline — answers saved to your device</>
      )}
    </div>
  );
}
