// src/app/api/sessions/[sessionId]/audit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// WHY: Prisma stores auditLog as Json. We cast to this type
// instead of any[] to satisfy the no-explicit-any ESLint rule.
type AuditEvent = Record<string, unknown>;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const event = (await req.json()) as AuditEvent;

  const examSession = await prisma.examSession.findUnique({
    where: { id: sessionId },
    select: { userId: true, auditLog: true },
  });

  if (!examSession || examSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const log = [...(examSession.auditLog as AuditEvent[]), event];
  await prisma.examSession.update({
    where: { id: sessionId },
    data: { auditLog: log },
  });

  return NextResponse.json({ ok: true });
}
