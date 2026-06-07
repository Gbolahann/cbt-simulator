// src/app/exam/[sessionId]/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ExamShellLoader from "@/components/exam/ExamShellLoader";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { sessionId } = await params;
  return <ExamShellLoader sessionId={sessionId} />;
}
