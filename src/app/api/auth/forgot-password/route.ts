// src/app/api/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success — never reveal whether an account exists
    if (!user || user.deletedAt) {
      return NextResponse.json({
        message: "If an account exists for that email, a reset link has been sent.",
      });
    }

    const token    = await createPasswordResetToken(user.id);
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    await sendPasswordResetEmail(user.email, user.displayName, resetUrl);

    return NextResponse.json({
      message: "If an account exists for that email, a reset link has been sent.",
    });

  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
