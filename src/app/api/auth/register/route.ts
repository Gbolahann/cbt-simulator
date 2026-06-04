// src/app/api/auth/register/route.ts
// NOTE: Import uses 5 levels (../../../../../) because this file is at:
// src/app/api/auth/register/route.ts → root is 5 directories up

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { EXAM_CONFIG } from "../../../../../config/exam.config";

const prisma = new PrismaClient();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();

    // Validate required fields
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (displayName.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Check for existing account
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, EXAM_CONFIG.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email:         email.toLowerCase(),
        displayName:   displayName.trim(),
        passwordHash,
        emailVerified: false,
      },
    });

    // Create a verification token (reuses the PasswordResetToken table)
    const verifyToken = generateToken();
    const expiresAt   = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.passwordResetToken.create({
      data: {
        userId:    user.id,
        token:     verifyToken,
        expiresAt,
      },
    });

    // Send verification email — URL points to /api/verify-email (outside auth namespace)
    const verifyUrl = `${process.env.NEXTAUTH_URL}/api/verify-email?token=${verifyToken}&userId=${user.id}`;
    await sendVerificationEmail(user.email, user.displayName, verifyUrl);

    return NextResponse.json(
      { message: "Account created. Check your email to verify your account." },
      { status: 201 }
    );

  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
