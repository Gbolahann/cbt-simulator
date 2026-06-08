/**
 * src/lib/scorer.ts
 * Server-side only — never import in client components.
 *
 * Computes session score after submission:
 *   - Total score (correct × 2, max 70)
 *   - Pass/fail (threshold: 40/70)
 *   - Module breakdown
 *   - Writes SessionQuestionResult rows
 */

import { PrismaClient } from "@prisma/client";
import { EXAM_CONFIG } from "../../config/exam.config";
import { resolveCorrectDisplayLetter } from "./randomizer";
import type { OptionOrder } from "./randomizer";
import type { ScoreReport, ModuleResult } from "../types";

const prisma = new PrismaClient();

interface ScoringInput {
  sessionId: string;
  userId: string;
  courseId: string;
  courseName: string;
  questionIds: string[];
  displayOrders: Record<string, OptionOrder>;
  answers: Record<string, string>;
  flagged: string[];
  startedAt: Date;
  submittedAt: Date;
}

export async function scoreSession(input: ScoringInput): Promise<ScoreReport> {
  // WHY flagged is omitted from destructuring:
  // flagged is part of ScoringInput (kept in the interface so the caller
  // can pass it without a type error), but the scoring logic itself does
  // not use it — only correct/incorrect answers affect the score.
  // Destructuring it would trigger "assigned a value but never used".
  const {
    sessionId,
    userId,
    courseId,
    courseName,
    questionIds,
    displayOrders,
    answers,
    startedAt,
    submittedAt,
  } = input;

  // Fetch full question data server-side only
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      correctOption: true, // NEVER sent to client
      cognitiveLevel: true, // NEVER sent to client
      moduleNumber: true,
      moduleName: true,
    },
  });

  const qMap = new Map(questions.map((q) => [q.id, q]));

  let correctCount = 0;
  const results: Array<{
    sessionId: string;
    questionId: string;
    selectedOption: string | null;
    isCorrect: boolean;
    moduleNumber: number;
    cognitiveLevel: string;
  }> = [];

  const moduleMap = new Map<
    number,
    { name: string; correct: number; total: number }
  >();

  for (const qId of questionIds) {
    const q = qMap.get(qId);
    if (!q) continue;

    const displayOrder = displayOrders[qId] as OptionOrder;
    const userAnswer = answers[qId] ?? null;
    const correctDisplaySlot = resolveCorrectDisplayLetter(
      displayOrder,
      q.correctOption,
    );
    const isCorrect = userAnswer !== null && userAnswer === correctDisplaySlot;

    if (isCorrect) correctCount++;

    results.push({
      sessionId,
      questionId: qId,
      selectedOption: userAnswer,
      isCorrect,
      moduleNumber: q.moduleNumber,
      cognitiveLevel: q.cognitiveLevel,
    });

    if (!moduleMap.has(q.moduleNumber)) {
      moduleMap.set(q.moduleNumber, {
        name: q.moduleName,
        correct: 0,
        total: 0,
      });
    }
    const mod = moduleMap.get(q.moduleNumber)!;
    mod.total++;
    if (isCorrect) mod.correct++;
  }

  const score = correctCount * EXAM_CONFIG.MARKS_PER_QUESTION;
  const percentage = parseFloat(
    ((score / EXAM_CONFIG.MAX_SCORE) * 100).toFixed(2),
  );
  const passed = score >= EXAM_CONFIG.PASSING_SCORE;
  const timeUsedSecs = Math.round(
    (submittedAt.getTime() - startedAt.getTime()) / 1000,
  );

  await prisma.$transaction([
    prisma.sessionQuestionResult.createMany({
      data: results,
      skipDuplicates: true,
    }),
    prisma.examSession.update({
      where: { id: sessionId },
      data: {
        status: "SUBMITTED",
        score,
        percentage,
        passed,
        timeUsedSecs,
        submittedAt,
      },
    }),
  ]);

  const moduleBreakdown: ModuleResult[] = [...moduleMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([moduleNumber, data]) => ({
      moduleNumber,
      moduleName: data.name,
      correct: data.correct,
      total: data.total,
      percentage:
        data.total > 0
          ? parseFloat(((data.correct / data.total) * 100).toFixed(1))
          : 0,
    }));

  const history = await prisma.examSession.findMany({
    where: { userId, courseId, status: "SUBMITTED" },
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

  return {
    sessionId,
    courseId,
    courseName,
    score,
    maxScore: EXAM_CONFIG.MAX_SCORE,
    percentage,
    passed,
    passingScore: EXAM_CONFIG.PASSING_SCORE,
    timeUsedSecs,
    submittedAt: submittedAt.toISOString(),
    moduleBreakdown,
    attemptHistory: history.map((h) => ({
      sessionId: h.id,
      score: h.score ?? 0,
      percentage: parseFloat(String(h.percentage ?? 0)),
      passed: h.passed ?? false,
      timeUsedSecs: h.timeUsedSecs ?? 0,
      submittedAt: h.submittedAt?.toISOString() ?? "",
    })),
  };
}
