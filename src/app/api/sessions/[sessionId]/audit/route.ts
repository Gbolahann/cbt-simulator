// src/app/api/sessions/[sessionId]/audit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// WHY Prisma.InputJsonValue instead of our own AuditEvent type:
// The auditLog column is typed as Json in the Prisma schema.
// When writing to it, Prisma requires a value that matches InputJsonValue.
// Our previous Record<string, unknown>[] was rejected because Prisma's
// InputJsonObject requires { [Key: string]: InputJsonValue } — the value
// type must also be InputJsonValue, not unknown.
// Using Prisma's own type satisfies this constraint without any workarounds.
type AuditEvent = Record<string, Prisma.InputJsonValue>;

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

  // Cast existing log to AuditEvent[] and append the new event
  const existingLog = (examSession.auditLog as AuditEvent[]) ?? [];
  const updatedLog: Prisma.InputJsonValue = [...existingLog, event];

  await prisma.examSession.update({
    where: { id: sessionId },
    data: { auditLog: updatedLog },
  });

  return NextResponse.json({ ok: true });
}
