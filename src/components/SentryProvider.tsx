"use client";
// src/components/SentryProvider.tsx
//
// WHY the sentry.client.config import was removed:
// The original file had: import "@/sentry.client.config"
//
// This failed because:
// - @/ maps to src/ in this project
// - sentry.client.config.ts lives at the PROJECT ROOT, not inside src/
// - So the import resolved to src/sentry.client.config.ts — a file that
//   does not exist — causing the "Module not found" build error.
//
// The import is also unnecessary. Next.js automatically loads
// sentry.client.config.ts from the project root at build time via the
// Sentry webpack plugin. No manual import is needed anywhere.

export default function SentryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sentry is already initialised by sentry.client.config.ts at the root.
  // This wrapper exists so you can add Sentry-specific React context here
  // in future if needed (e.g. setUser, ErrorBoundary, etc.)
  return <>{children}</>;
}
