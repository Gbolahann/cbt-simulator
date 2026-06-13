// src/app/api/verify-email/route.ts
// WHY this file lives outside /api/auth/:
// NextAuth v5 intercepts all routes under /api/auth/* and returns 400
// for any path it does not recognise. Email verification must be outside.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const userId = searchParams.get("userId");

  // Basic presence check
  if (!token || !userId) {
    console.warn("[verify-email] Missing token or userId in URL");
    return NextResponse.redirect(new URL("/login?error=invalid-link", req.url));
  }

  // WHY findUnique instead of findFirst with compound where:
  // The token field has @unique so findUnique is the correct query.
  // Using findFirst with { token, userId, usedAt: null } in a compound
  // where clause can silently return null in Prisma 5 when the nullable
  // DateTime field (usedAt) is included — the null comparison behaves
  // inconsistently. We validate each condition separately instead.
  let record;
  try {
    record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });
  } catch (err) {
    console.error("[verify-email] DB lookup failed:", err);
    return NextResponse.redirect(new URL("/login?error=invalid-link", req.url));
  }

  // Token does not exist at all
  if (!record) {
    console.warn("[verify-email] Token not found:", token.slice(0, 8) + "...");
    return NextResponse.redirect(new URL("/login?error=invalid-link", req.url));
  }

  // Token belongs to a different user (URL tampered)
  if (record.userId !== userId) {
    console.warn("[verify-email] userId mismatch");
    return NextResponse.redirect(new URL("/login?error=invalid-link", req.url));
  }

  // Token already used — redirect with a more specific error
  if (record.usedAt !== null) {
    console.warn("[verify-email] Token already used");
    return NextResponse.redirect(new URL("/login?verified=true", req.url));
    // Already verified — treat as success so clicking the link twice
    // does not confuse the user with an error
  }

  // Token expired
  if (record.expiresAt < new Date()) {
    console.warn("[verify-email] Token expired");
    return NextResponse.redirect(new URL("/login?error=link-expired", req.url));
  }

  // All checks passed — mark email as verified and token as used
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
  } catch (err) {
    console.error("[verify-email] Transaction failed:", err);
    return NextResponse.redirect(new URL("/login?error=invalid-link", req.url));
  }

  console.log("[verify-email] Email verified for userId:", userId);
  return NextResponse.redirect(new URL("/login?verified=true", req.url));
}
