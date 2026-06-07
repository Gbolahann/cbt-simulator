"use client";
// src/components/exam/ExamShellLoader.tsx
// Thin client-only wrapper that loads ExamShell with SSR disabled.

import dynamic from "next/dynamic";

const ExamShell = dynamic(() => import("./ExamShell"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p style={{ color: "var(--color-text-muted)" }}>Loading exam...</p>
    </div>
  ),
});

export default function ExamShellLoader({ sessionId }: { sessionId: string }) {
  return <ExamShell sessionId={sessionId} />;
}
