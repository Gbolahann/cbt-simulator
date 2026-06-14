// src/app/api/auth/resend-verification/route.ts
// Called when a registered but unverified user requests a new link.
// Rate-limited to one email per 2 minutes per address to prevent abuse.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

// In-memory store for last-sent timestamps (resets on cold start — acceptable)
const lastSent = new Map<string, number>();
const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 },
      );
    }

    const normalised = email.toLowerCase().trim();

    // Cooldown check — prevents spamming the resend button
    const last = lastSent.get(normalised) ?? 0;
    const elapsed = Date.now() - last;
    if (elapsed < COOLDOWN_MS) {
      const waitSecs = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      return NextResponse.json(
        {
          error: `Please wait ${waitSecs} seconds before requesting another link.`,
        },
        { status: 429 },
      );
    }

    // Find user — always return success even if email not found (security)
    const user = await prisma.user.findUnique({
      where: { email: normalised },
    });

    // Generic success — do not reveal whether the account exists
    if (!user || user.deletedAt || user.emailVerified) {
      return NextResponse.json({ ok: true });
    }

    // Delete any existing unused verification tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // Create a fresh token valid for 24 hours
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const verifyUrl = `${process.env.NEXTAUTH_URL}/api/verify-email?token=${token}&userId=${user.id}`;
    await sendVerificationEmail(user.email, user.displayName, verifyUrl);

    // Record send time for cooldown
    lastSent.set(normalised, Date.now());

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[resend-verification]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
