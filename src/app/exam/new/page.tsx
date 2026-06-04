// src/app/exam/new/page.tsx
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { COURSES } from "../../../../config/courses";

const prisma = new PrismaClient();

export default async function NewExamPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { courseId } = await searchParams;

  if (!courseId) {
    redirect("/dashboard");
  }

  const course = COURSES.find((c) => c.id === courseId);
  if (!course) {
    redirect("/dashboard");
  }

  // Create a new exam session
  const examSession = await prisma.examSession.create({
    data: {
      userId: session.user.id,
      courseId,
      status: "ACTIVE",
    },
  });

  // Redirect to the exam page
  redirect(`/exam/${examSession.id}`);
}
