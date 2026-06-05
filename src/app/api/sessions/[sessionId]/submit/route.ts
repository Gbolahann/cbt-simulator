// POST /api/sessions/[sessionId]/submit
// Finalises the session and runs the scoring function.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { scoreSession } from "@/lib/scorer";
import type { OptionOrder } from "@/lib/randomizer";
import { EXAM_CONFIG } from "../../../../../../config/exam.config";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const { answers, flagged } = await req.json();

  const examSession = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: { course: true },
  });

  if (!examSession || examSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (examSession.status !== "ACTIVE") {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }

  const submittedAt = new Date();
  const elapsed =
    (submittedAt.getTime() - examSession.startedAt.getTime()) / 1000;

  // Hard server-side time enforcement
  if (
    elapsed >
    EXAM_CONFIG.TIME_LIMIT_SECONDS + EXAM_CONFIG.SUBMISSION_GRACE_SECS
  ) {
    await prisma.examSession.update({
      where: { id: sessionId },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "TIME_EXCEEDED" }, { status: 403 });
  }

  const scoreReport = await scoreSession({
    sessionId,
    userId: session.user.id,
    courseId: examSession.courseId,
    courseName: examSession.course.name,
    questionIds: examSession.questionIds as string[],
    displayOrders: examSession.displayOrders as Record<string, OptionOrder>,
    answers: answers ?? (examSession.answers as Record<string, string>),
    flagged: flagged ?? (examSession.flagged as string[]),
    startedAt: examSession.startedAt,
    submittedAt,
  });

  return NextResponse.json({ sessionId, ...scoreReport });
}
