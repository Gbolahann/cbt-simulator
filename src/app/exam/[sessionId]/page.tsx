// src/app/exam/[sessionId]/page.tsx
// Thin server shell — loads the client-only ExamShell dynamically (no SSR)

import dynamic from "next/dynamic";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const ExamShell = dynamic(() => import("@/components/exam/ExamShell"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p style={{ color: "var(--color-text-muted)" }}>Loading exam...</p>
    </div>
  ),
});

export default async function ExamPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { sessionId } = await params;
  return <ExamShell sessionId={sessionId} />;
}
