// src/app/api/verify-email/route.ts
// IMPORTANT: Must live at /api/verify-email — NOT inside /api/auth/
// NextAuth v5 intercepts everything under /api/auth/* and returns 400 for unknown actions

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token  = searchParams.get("token");
  const userId = searchParams.get("userId");

  if (!token || !userId) {
    return NextResponse.redirect(
      new URL("/login?error=invalid-link", req.url)
    );
  }

  // Find the token record
  const tokenRecord = await prisma.passwordResetToken.findFirst({
    where: {
      token,
      userId,
      usedAt: null,
    },
  });

  if (!tokenRecord) {
    return NextResponse.redirect(
      new URL("/login?error=invalid-link", req.url)
    );
  }

  if (tokenRecord.expiresAt < new Date()) {
    return NextResponse.redirect(
      new URL("/login?error=link-expired", req.url)
    );
  }

  // Mark token as used and set emailVerified = true (boolean, not DateTime)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data:  { emailVerified: true },
    }),
    prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data:  { usedAt: new Date() },
    }),
  ]);

  return NextResponse.redirect(
    new URL("/login?verified=true", req.url)
  );
}
