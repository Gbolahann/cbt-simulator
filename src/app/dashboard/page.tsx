// src/app/dashboard/page.tsx
// Flat route — NOT inside (dashboard) route group
// Import uses ../../config/courses (2 levels up from src/app/dashboard/)

import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { COURSES } from "../../../config/courses";
import Link from "next/link";

const prisma = new PrismaClient();

async function getCourseStats(userId: string) {
  const sessions = await prisma.examSession.findMany({
    where: { userId, status: "SUBMITTED" },
    select: {
      courseId: true,
      score: true,
      percentage: true,
      passed: true,
      submittedAt: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  const statsMap: Record<
    string,
    {
      attempts: number;
      bestScore: number | null;
      bestPct: number | null;
      lastAttempt: string | null;
      lastPassed: boolean | null;
    }
  > = {};

  for (const course of COURSES) {
    const cs = sessions.filter((s) => s.courseId === course.id);
    const best = cs.reduce<(typeof cs)[0] | null>(
      (b, s) => (!b || (s.score ?? 0) > (b.score ?? 0) ? s : b),
      null,
    );

    statsMap[course.id] = {
      attempts: cs.length,
      bestScore: best?.score ?? null,
      bestPct: best ? parseFloat(String(best.percentage ?? 0)) : null,
      lastAttempt: cs[0]?.submittedAt?.toISOString() ?? null,
      lastPassed: cs[0]?.passed ?? null,
    };
  }

  return statsMap;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const stats = await getCourseStats(session.user.id);

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
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ backgroundColor: "var(--color-accent-primary)" }}
            >
              <span className="text-white text-xs font-bold">CB</span>
            </div>
            <span
              className="font-semibold text-sm"
              style={{ color: "var(--color-text-body)" }}
            >
              CBT Simulator
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span
              className="text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              {session.user.displayName}
            </span>
            <Link
              href="/api/auth/signout"
              className="text-sm hover:underline"
              style={{ color: "var(--color-text-muted)" }}
            >
              Log out
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--color-text-body)" }}
          >
            Your Courses
          </h1>
        </div>

        {/* Course grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COURSES.map((course) => {
            const s = stats[course.id];
            return (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="block rounded-xl border p-5 transition-shadow hover:shadow-md"
                style={{
                  backgroundColor: "var(--color-bg-canvas)",
                  borderColor: "var(--color-border)",
                }}
              >
                {/* Code badge */}
                <div
                  className="inline-block px-2 py-0.5 rounded text-xs font-semibold mb-3"
                  style={{
                    backgroundColor: "var(--color-accent-primary)",
                    color: "white",
                  }}
                >
                  {course.code}
                </div>

                {/* Name */}
                <h2
                  className="text-sm font-semibold mb-4 leading-snug"
                  style={{ color: "var(--color-text-body)" }}
                >
                  {course.name}
                </h2>

                {/* Stats */}
                {s.attempts === 0 ? (
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    No attempts yet
                  </p>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "var(--color-text-muted)" }}>
                        Best score
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "var(--color-text-body)" }}
                      >
                        {s.bestScore} / 70
                        <span
                          className="ml-1"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          ({s.bestPct?.toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "var(--color-text-muted)" }}>
                        Attempts
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "var(--color-text-body)" }}
                      >
                        {s.attempts}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "var(--color-text-muted)" }}>
                        Last attempt
                      </span>
                      <span style={{ color: "var(--color-text-muted)" }}>
                        {formatDate(s.lastAttempt)}
                      </span>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div
                  className="mt-4 pt-3 border-t flex justify-between items-center"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {course.moduleCount} modules
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--color-accent-primary)" }}
                  >
                    {s.attempts === 0 ? "Start →" : "Practice again →"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
