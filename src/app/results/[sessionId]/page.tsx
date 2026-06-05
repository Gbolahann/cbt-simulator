// src/app/results/[sessionId]/page.tsx

import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { EXAM_CONFIG } from "../../../../config/exam.config";

const prisma = new PrismaClient();

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const { sessionId } = await params;

  const examSession = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: { course: true },
  });

  if (!examSession || examSession.userId !== session.user.id) notFound();
  if (examSession.status === "ACTIVE") redirect(`/exam/${sessionId}`);

  // Module breakdown
  const results = await prisma.sessionQuestionResult.findMany({
    where: { sessionId },
  });

  const moduleMap = new Map<
    number,
    { name: string; correct: number; total: number }
  >();
  for (const r of results) {
    if (!moduleMap.has(r.moduleNumber)) {
      const q = await prisma.question.findFirst({
        where: { id: r.questionId },
        select: { moduleName: true },
      });
      moduleMap.set(r.moduleNumber, {
        name: q?.moduleName ?? `Module ${r.moduleNumber}`,
        correct: 0,
        total: 0,
      });
    }
    const m = moduleMap.get(r.moduleNumber)!;
    m.total++;
    if (r.isCorrect) m.correct++;
  }

  const modules = [...moduleMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([num, data]) => ({
      num,
      name: data.name,
      correct: data.correct,
      total: data.total,
      pct: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }));

  // Attempt history
  const history = await prisma.examSession.findMany({
    where: {
      userId: session.user.id,
      courseId: examSession.courseId,
      status: "SUBMITTED",
    },
    orderBy: { submittedAt: "desc" },
    take: 5,
    select: {
      id: true,
      score: true,
      percentage: true,
      passed: true,
      timeUsedSecs: true,
      submittedAt: true,
    },
  });

  const score = examSession.score ?? 0;
  const pct = parseFloat(String(examSession.percentage ?? 0));
  const passed = examSession.passed ?? false;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-bg-surface)" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Zone 1 — Headline */}
        <div
          className="rounded-2xl border p-8 text-center"
          style={{
            backgroundColor: "var(--color-bg-canvas)",
            borderColor: "var(--color-border)",
          }}
        >
          <p
            className="text-sm mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            {examSession.course.name} — Session Complete
          </p>
          <div
            className="text-5xl font-bold mb-1"
            style={{ color: "var(--color-text-body)" }}
          >
            {score}
            <span
              className="text-2xl font-normal"
              style={{ color: "var(--color-text-muted)" }}
            >
              {" "}
              /{EXAM_CONFIG.MAX_SCORE}
            </span>
          </div>
          <div
            className="text-xl mb-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            {pct.toFixed(1)}%
          </div>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: passed ? "#F0FFF4" : "#FFF5F5",
              color: passed
                ? "var(--color-accent-success)"
                : "var(--color-accent-danger)",
            }}
          >
            {passed ? "✅ PASS" : "❌ FAIL"}
            <span
              className="font-normal"
              style={{ color: "var(--color-text-muted)" }}
            >
              (Passing: {EXAM_CONFIG.PASSING_SCORE}/{EXAM_CONFIG.MAX_SCORE})
            </span>
          </div>
          <p
            className="mt-3 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Time used: {formatTime(examSession.timeUsedSecs ?? 0)} of{" "}
            {formatTime(EXAM_CONFIG.TIME_LIMIT_SECONDS)}
          </p>
        </div>

        {/* Zone 2 — Module Breakdown */}
        <div
          className="rounded-2xl border p-6"
          style={{
            backgroundColor: "var(--color-bg-canvas)",
            borderColor: "var(--color-border)",
          }}
        >
          <h2
            className="text-sm font-semibold mb-4"
            style={{ color: "var(--color-text-body)" }}
          >
            Module Breakdown
          </h2>
          <div className="space-y-3">
            {modules.map((m) => {
              const color =
                m.pct >= 70
                  ? "var(--color-accent-success)"
                  : m.pct >= 50
                    ? "var(--color-accent-warning)"
                    : "var(--color-accent-danger)";
              return (
                <div key={m.num}>
                  <div className="flex justify-between text-xs mb-1">
                    <span
                      className="truncate max-w-[240px]"
                      style={{ color: "var(--color-text-body)" }}
                    >
                      Module {m.num} — {m.name}
                    </span>
                    <span style={{ color }}>
                      {m.correct}/{m.total} ({m.pct}%)
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--color-bg-surface)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${m.pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Zone 3 — Attempt History */}
        {history.length > 1 && (
          <div
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: "var(--color-bg-canvas)",
              borderColor: "var(--color-border)",
            }}
          >
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--color-text-body)" }}
            >
              Recent Attempts
            </h2>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span style={{ color: "var(--color-text-muted)" }}>
                    {i === 0 ? "This attempt" : `${i + 1} attempts ago`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "var(--color-text-body)" }}>
                      {h.score}/{EXAM_CONFIG.MAX_SCORE}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: h.passed ? "#F0FFF4" : "#FFF5F5",
                        color: h.passed
                          ? "var(--color-accent-success)"
                          : "var(--color-accent-danger)",
                      }}
                    >
                      {h.passed ? "PASS" : "FAIL"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href={`/review/${sessionId}`}
            className="flex-1 py-3 rounded-xl border text-sm font-medium text-center"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-body)",
            }}
          >
            Review Answers
          </Link>
          <Link
            href={`/courses/${examSession.courseId}`}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white text-center"
            style={{ backgroundColor: "var(--color-accent-primary)" }}
          >
            Practice Again
          </Link>
        </div>
      </div>
    </div>
  );
}
