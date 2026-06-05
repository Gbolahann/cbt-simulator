// POST /api/sessions
// Creates a new exam session for a course. Draws 35 stratified questions.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { createSessionDraw } from "../../../lib/randomizer";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId } = await req.json();
  if (!courseId)
    return NextResponse.json({ error: "courseId required" }, { status: 400 });

  // Check course exists
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course)
    return NextResponse.json({ error: "Course not found" }, { status: 404 });

  // Check for an already-active session on this course
  const existing = await prisma.examSession.findFirst({
    where: { userId: session.user.id, courseId, status: "ACTIVE" },
  });
  if (existing) {
    return NextResponse.json({ sessionId: existing.id }, { status: 200 });
  }

  // Fetch all 200 questions (id + moduleNumber only — minimal data)
  const allQuestions = await prisma.question.findMany({
    where: { courseId },
    select: { id: true, moduleNumber: true, correctOption: true },
  });

  // Draw 35 stratified questions + build display orders
  const { questionIds, displayOrders } = createSessionDraw(allQuestions);

  // Create session record
  const newSession = await prisma.examSession.create({
    data: {
      userId: session.user.id,
      courseId,
      questionIds,
      displayOrders,
      answers: {},
      flagged: [],
      status: "ACTIVE",
    },
  });

  return NextResponse.json({ sessionId: newSession.id }, { status: 201 });
}
