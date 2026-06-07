// src/app/courses/[courseId]/page.tsx
// Flat route — NOT inside (dashboard) route group

import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { COURSES } from "../../../../config/courses";
import { EXAM_CONFIG } from "../../../../config/exam.config";

const prisma = new PrismaClient();

function formatDate(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(secs: number | null) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default async function CourseLobbyPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { courseId } = await params;
  const course = COURSES.find((c) => c.id === courseId);
  if (!course) notFound();

  const attempts = await prisma.examSession.findMany({
    where: { userId: session.user.id, courseId, status: "SUBMITTED" },
    orderBy: { submittedAt: "desc" },
    take: 10,
    select: {
      id: true,
      score: true,
      percentage: true,
      passed: true,
      timeUsedSecs: true,
      submittedAt: true,
    },
  });

  const best = attempts.reduce<(typeof attempts)[0] | null>(
    (b, s) => (!b || (s.score ?? 0) > (b.score ?? 0) ? s : b),
    null,
  );

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
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            ← Dashboard
          </Link>
          <Link
            href="/api/auth/signout"
            className="text-sm hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            Log out
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Course header card */}
        <div
          className="rounded-xl border p-6"
          style={{
            backgroundColor: "var(--color-bg-canvas)",
            borderColor: "var(--color-border)",
          }}
        >
          <div
            className="inline-block px-2 py-0.5 rounded text-xs font-semibold mb-3"
            style={{
              backgroundColor: "#EBF3FD",
              color: "var(--color-accent-primary)",
            }}
          >
            {course.code}
          </div>

          <h1
            className="text-xl font-semibold mb-1"
            style={{ color: "var(--color-text-body)" }}
          >
            {course.name}
          </h1>
          <p
            className="text-sm mb-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            {course.moduleCount} modules ·{EXAM_CONFIG.TIME_LIMIT_SECONDS / 60}{" "}
            minutes
          </p>

          {/* Stats */}
          {attempts.length > 0 && (
            <div
              className="grid grid-cols-3 gap-4 mb-5 pb-5 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div>
                <p
                  className="text-xs mb-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Best score
                </p>
                <p
                  className="text-lg font-semibold"
                  style={{ color: "var(--color-text-body)" }}
                >
                  {best?.score}
                  <span
                    className="text-sm font-normal ml-1"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    / {EXAM_CONFIG.MAX_SCORE}
                  </span>
                </p>
              </div>
              <div>
                <p
                  className="text-xs mb-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Attempts
                </p>
                <p
                  className="text-lg font-semibold"
                  style={{ color: "var(--color-text-body)" }}
                >
                  {attempts.length}
                </p>
              </div>
              <div>
                <p
                  className="text-xs mb-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Last attempt
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-body)" }}
                >
                  {formatDate(attempts[0]?.submittedAt ?? null)}
                </p>
              </div>
            </div>
          )}

          {/* Start button */}
          <Link
            href={`/exam/new?courseId=${courseId}`}
            className="flex items-center justify-center w-full py-3 rounded-lg
                           text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--color-accent-primary)" }}
          >
            {attempts.length === 0
              ? "Start Practice Session"
              : "Start New Session"}{" "}
            →
          </Link>
        </div>

        {/* Attempt history */}
        {attempts.length > 0 && (
          <div
            className="rounded-xl border"
            style={{
              backgroundColor: "var(--color-bg-canvas)",
              borderColor: "var(--color-border)",
            }}
          >
            <div
              className="px-5 py-4 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--color-text-body)" }}
              >
                Attempt History
              </h2>
            </div>
            <div
              className="divide-y"
              style={{ borderColor: "var(--color-border)" }}
            >
              {attempts.map((attempt, i) => {
                const pct = parseFloat(String(attempt.percentage ?? 0));
                const passed = attempt.passed;
                return (
                  <div
                    key={attempt.id}
                    className="px-5 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs w-5 text-right"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--color-text-body)" }}
                        >
                          {attempt.score} / {EXAM_CONFIG.MAX_SCORE}
                          <span
                            className="ml-1 text-xs"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            ({pct.toFixed(0)}%)
                          </span>
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {formatDate(attempt.submittedAt ?? null)} ·{" "}
                          {formatTime(attempt.timeUsedSecs)}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: passed ? "#F0FFF4" : "#FFF5F5",
                        color: passed
                          ? "var(--color-accent-success)"
                          : "var(--color-accent-danger)",
                      }}
                    >
                      {passed ? "PASS" : "FAIL"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {attempts.length === 0 && (
          <div
            className="rounded-xl border p-8 text-center"
            style={{
              backgroundColor: "var(--color-bg-canvas)",
              borderColor: "var(--color-border)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              No attempts yet. Start your first session above.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
