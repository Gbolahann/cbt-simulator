// src/app/dashboard/page.tsx
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { COURSES } from "../../../config/courses";
import { EXAM_CONFIG } from "../../../config/exam.config";
import HowItWorks from "@/components/HowItWorks";

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

function formatDate(iso: string | null) {
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
              className="text-sm hidden sm:block"
              style={{ color: "var(--color-text-muted)" }}
            >
              {session.user.displayName}
            </span>
            {/* Server-action form — required by eslint(@next/next/no-html-link-for-pages).
                A plain <a> to /api/auth/signout is treated as a page route by Next.js.
                Using a form + server action is the correct NextAuth v5 pattern. */}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-sm hover:underline bg-transparent border-0 p-0 cursor-pointer"
                style={{ color: "var(--color-text-muted)" }}
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Intro card — shown to first-time users, dismissible */}
        <HowItWorks />

        {/* Page heading */}
        <div className="mb-6">
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--color-text-body)" }}
          >
            Your Courses
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {COURSES.length} courses · 200 questions each ·{" "}
            {EXAM_CONFIG.QUESTION_COUNT} drawn per session ·{" "}
            {EXAM_CONFIG.TIME_LIMIT_SECONDS / 60} minutes
          </p>
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
                {/* Course code badge */}
                <div
                  className="inline-block px-2 py-0.5 rounded text-xs font-semibold mb-3"
                  style={{
                    backgroundColor: "var(--color-accent-primary)",
                    color: "white",
                  }}
                >
                  {course.code}
                </div>

                {/* Course name */}
                <h2
                  className="text-sm font-semibold mb-4 leading-snug"
                  style={{ color: "var(--color-text-body)" }}
                >
                  {course.name}
                </h2>

                {/* Stats or first-time CTA */}
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
                        {s.bestScore} / {EXAM_CONFIG.MAX_SCORE}
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

                {/* Footer */}
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
