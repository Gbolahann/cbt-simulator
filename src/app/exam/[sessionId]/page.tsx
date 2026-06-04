// src/app/exam/[sessionId]/page.tsx
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { COURSES } from "../../../../config/courses";

const prisma = new PrismaClient();

export default async function ExamPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { sessionId } = await params;

  // Fetch the exam session
  const examSession = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: { results: true },
  });

  if (!examSession) {
    notFound();
  }

  // Verify ownership
  if (examSession.userId !== session.user.id) {
    redirect("/dashboard");
  }

  const course = COURSES.find((c) => c.id === examSession.courseId);
  if (!course) notFound();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-bg-surface)" }}
    >
      {/* Navigation */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          backgroundColor: "var(--color-bg-canvas)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {course.name}
            </p>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-body)" }}
            >
              Question 1 of 40
            </p>
          </div>
          <div
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-body)" }}
          >
            Time: --:--
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div
          className="rounded-xl border p-8"
          style={{
            backgroundColor: "var(--color-bg-canvas)",
            borderColor: "var(--color-border)",
          }}
        >
          <p
            className="text-sm mb-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            Question 1
          </p>
          <h2
            className="text-lg font-semibold mb-6"
            style={{ color: "var(--color-text-body)" }}
          >
            Loading question...
          </h2>

          <div className="space-y-3 mb-8">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Options will appear here
            </p>
          </div>

          <div className="flex gap-4">
            <button
              className="px-6 py-2 rounded-lg border text-sm font-medium hover:opacity-80 transition-opacity"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-body)",
              }}
            >
              ← Previous
            </button>
            <button
              className="px-6 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--color-accent-primary)" }}
            >
              Next →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
