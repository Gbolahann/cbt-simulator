// src/app/review/[sessionId]/page.tsx
// Read-only replay of all 35 questions with correct answers and rationale

import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

const prisma = new PrismaClient();

type Filter = "all" | "incorrect" | "flagged" | "unanswered";

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const { sessionId } = await params;
  const { filter = "all" } = (await searchParams) as { filter?: Filter };

  const examSession = await prisma.examSession.findUnique({
    where: { id: sessionId },
  });
  if (!examSession || examSession.userId !== session.user.id) notFound();
  if (examSession.status === "ACTIVE") redirect(`/exam/${sessionId}`);

  const answers = examSession.answers as Record<string, string>;
  const flagged = new Set(examSession.flagged as string[]);
  const displayOrders = examSession.displayOrders as Record<string, string[]>;
  const questionIds = examSession.questionIds as string[];

  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      stem: true,
      optionA: true,
      optionB: true,
      optionC: true,
      optionD: true,
      correctOption: true,
      rationale: true,
      sourceRef: true,
    },
  });

  const qMap = new Map(questions.map((q) => [q.id, q]));

  const reviewItems = questionIds.map((id, i) => {
    const q = qMap.get(id)!;
    const order = displayOrders[id];
    const optMap: Record<string, string> = {
      a: q.optionA,
      b: q.optionB,
      c: q.optionC,
      d: q.optionD,
    };
    const options = order.map((dbKey, si) => ({
      slot: ["a", "b", "c", "d"][si],
      text: optMap[dbKey],
      dbKey,
    }));
    const userSlot = answers[id] ?? null;
    const correctDbKey = q.correctOption;
    const correctSlot =
      options.find((o) => o.dbKey === correctDbKey)?.slot ?? null;
    const isCorrect = userSlot !== null && userSlot === correctSlot;
    return {
      id,
      index: i,
      stem: q.stem,
      options,
      userSlot,
      correctSlot,
      isCorrect,
      isFlagged: flagged.has(id),
      rationale: q.rationale,
      sourceRef: q.sourceRef,
    };
  });

  const filtered = reviewItems.filter((item) => {
    if (filter === "incorrect")
      return !item.isCorrect && item.userSlot !== null;
    if (filter === "flagged") return item.isFlagged;
    if (filter === "unanswered") return item.userSlot === null;
    return true;
  });

  const counts = {
    incorrect: reviewItems.filter((i) => !i.isCorrect && i.userSlot !== null)
      .length,
    flagged: reviewItems.filter((i) => i.isFlagged).length,
    unanswered: reviewItems.filter((i) => i.userSlot === null).length,
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-bg-surface)" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <Link
            href={`/results/${sessionId}`}
            className="text-sm hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            ← Results
          </Link>
          <h1
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-body)" }}
          >
            Answer Review
          </h1>
        </div>

        {/* Filter bar */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "incorrect", "flagged", "unanswered"] as Filter[]).map(
            (f) => (
              <Link
                key={f}
                href={`?filter=${f}`}
                className="px-3 py-1.5 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor:
                    filter === f
                      ? "var(--color-accent-primary)"
                      : "transparent",
                  borderColor:
                    filter === f
                      ? "var(--color-accent-primary)"
                      : "var(--color-border)",
                  color: filter === f ? "white" : "var(--color-text-muted)",
                }}
              >
                {f === "all" ? `All ${reviewItems.length}` : ""}
                {f === "incorrect" ? `Incorrect ${counts.incorrect}` : ""}
                {f === "flagged" ? `Flagged ${counts.flagged}` : ""}
                {f === "unanswered" ? `Unanswered ${counts.unanswered}` : ""}
              </Link>
            ),
          )}
        </div>

        {/* Questions */}
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border p-5 space-y-4"
            style={{
              backgroundColor: "var(--color-bg-canvas)",
              borderColor: "var(--color-border)",
            }}
          >
            <p
              className="text-xs font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              Question {item.index + 1}
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--color-text-body)" }}
            >
              {item.stem}
            </p>
            <div className="space-y-2">
              {item.options.map(({ slot, text }) => {
                const isUserAnswer = item.userSlot === slot;
                const isCorrectAnswer = item.correctSlot === slot;
                return (
                  <div
                    key={slot}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm"
                    style={{
                      backgroundColor: isCorrectAnswer
                        ? "color-mix(in srgb, var(--color-accent-success) 12%, transparent)"
                        : isUserAnswer && !isCorrectAnswer
                          ? "color-mix(in srgb, var(--color-accent-danger) 12%, transparent)"
                          : "transparent",
                      border: `1px solid ${
                        isCorrectAnswer
                          ? "var(--color-accent-success)"
                          : isUserAnswer && !isCorrectAnswer
                            ? "var(--color-accent-danger)"
                            : "var(--color-border)"
                      }`,
                    }}
                  >
                    <span className="shrink-0 text-xs font-semibold w-5">
                      {slot.toUpperCase()}
                    </span>
                    <span style={{ color: "var(--color-text-body)" }}>
                      {text}
                    </span>
                    {isCorrectAnswer && (
                      <span
                        className="ml-auto text-xs shrink-0"
                        style={{ color: "var(--color-accent-success)" }}
                      >
                        ✓ Correct
                      </span>
                    )}
                    {isUserAnswer && !isCorrectAnswer && (
                      <span
                        className="ml-auto text-xs shrink-0"
                        style={{ color: "var(--color-accent-danger)" }}
                      >
                        Your answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {item.rationale && (
              <div
                className="rounded-lg p-3 text-sm"
                style={{
                  backgroundColor: "var(--color-bg-surface)",
                  color: "var(--color-text-muted)",
                }}
              >
                <p
                  className="font-medium mb-1"
                  style={{ color: "var(--color-text-body)" }}
                >
                  Explanation
                </p>
                <p>{item.rationale}</p>
              </div>
            )}
            {item.sourceRef && (
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                📄 {item.sourceRef}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
