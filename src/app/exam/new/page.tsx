// src/app/exam/new/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { createSessionDraw } from "@/lib/randomizer";

const prisma = new PrismaClient();

export default async function NewExamPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { courseId } = await searchParams;
  if (!courseId) redirect("/dashboard");

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) redirect("/dashboard");

  // Resume an in-progress session for this course if one exists
  const existing = await prisma.examSession.findFirst({
    where: { userId: session.user.id, courseId, status: "ACTIVE" },
  });
  if (existing) redirect(`/exam/${existing.id}`);

  // Draw 35 stratified questions
  const allQuestions = await prisma.question.findMany({
    where: { courseId },
    select: { id: true, moduleNumber: true, correctOption: true },
  });

  const { questionIds, displayOrders } = createSessionDraw(allQuestions);

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

  redirect(`/exam/${newSession.id}`);
}
