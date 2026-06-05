// PATCH /api/sessions/[sessionId]/answers
// Autosaves current answer state. Called every 2 seconds while exam is active.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { EXAM_CONFIG } from "../../../../../../config/exam.config";

const prisma = new PrismaClient();

export async function PATCH(
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
    select: { userId: true, status: true, startedAt: true },
  });

  if (!examSession || examSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (examSession.status !== "ACTIVE") {
    return NextResponse.json({ error: "Session not active" }, { status: 409 });
  }

  // Reject if time has expired
  const elapsed = (Date.now() - examSession.startedAt.getTime()) / 1000;
  if (
    elapsed >
    EXAM_CONFIG.TIME_LIMIT_SECONDS + EXAM_CONFIG.SUBMISSION_GRACE_SECS
  ) {
    return NextResponse.json({ error: "SESSION_EXPIRED" }, { status: 410 });
  }

  await prisma.examSession.update({
    where: { id: sessionId },
    data: { answers, flagged },
  });

  return NextResponse.json({ saved: true });
}
