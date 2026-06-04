// src/app/api/auth/reset-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { validatePasswordResetToken, markTokenUsed } from "@/lib/tokens";
import { EXAM_CONFIG } from "../../../../../config/exam.config";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const result = await validatePasswordResetToken(token);

    if (!result.valid) {
      const messages: Record<string, string> = {
        NOT_FOUND:    "This reset link is invalid.",
        ALREADY_USED: "This reset link has already been used.",
        EXPIRED:      "This reset link has expired. Please request a new one.",
      };
      return NextResponse.json(
        { error: messages[result.reason!] ?? "Invalid reset link." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, EXAM_CONFIG.BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: result.record!.userId },
      data:  { passwordHash },
    });

    await markTokenUsed(token);

    return NextResponse.json({ message: "Password updated successfully." });

  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
