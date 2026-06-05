// GET /api/sessions/[sessionId]
// Returns session state + all 35 questions (NO correct answers)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { EXAM_CONFIG } from "../../../../../config/exam.config";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;

  const examSession = await prisma.examSession.findUnique({
    where: { id: sessionId },
  });

  if (!examSession)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (examSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if session has expired (server-side enforcement)
  const elapsed = (Date.now() - examSession.startedAt.getTime()) / 1000;
  if (
    examSession.status === "ACTIVE" &&
    elapsed > EXAM_CONFIG.TIME_LIMIT_SECONDS + EXAM_CONFIG.SUBMISSION_GRACE_SECS
  ) {
    await prisma.examSession.update({
      where: { id: sessionId },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "SESSION_EXPIRED" }, { status: 410 });
  }

  // Fetch questions — NEVER include correctOption or cognitiveLevel
  const questions = await prisma.question.findMany({
    where: { id: { in: examSession.questionIds as string[] } },
    select: {
      id: true,
      stem: true,
      imageUrl: true,
      optionA: true,
      optionB: true,
      optionC: true,
      optionD: true,
    },
  });

  // Build an ID → question map for ordered retrieval
  const qMap = new Map(questions.map((q) => [q.id, q]));

  // Apply display orders to build shuffled option arrays
  const displayOrders = examSession.displayOrders as Record<string, string[]>;
  const orderedQuestions = (examSession.questionIds as string[]).map((id) => {
    const q = qMap.get(id)!;
    const order = displayOrders[id]; // e.g. ['b','d','a','c']
    const optMap: Record<string, string> = {
      a: q.optionA,
      b: q.optionB,
      c: q.optionC,
      d: q.optionD,
    };
    return {
      id: q.id,
      stem: q.stem,
      imageUrl: q.imageUrl,
      options: order.map((dbKey, i) => ({
        slot: ["a", "b", "c", "d"][i],
        text: optMap[dbKey],
      })),
    };
  });

  const timeRemainingMs = Math.max(
    0,
    examSession.startedAt.getTime() +
      EXAM_CONFIG.TIME_LIMIT_SECONDS * 1000 -
      Date.now(),
  );

  return NextResponse.json({
    sessionId: examSession.id,
    courseId: examSession.courseId,
    questions: orderedQuestions,
    answers: examSession.answers,
    flagged: examSession.flagged,
    status: examSession.status,
    startedAt: examSession.startedAt,
    timeRemainingMs,
  });
}
