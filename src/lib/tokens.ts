// src/lib/tokens.ts
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma    = new PrismaClient();
const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  await prisma.passwordResetToken.deleteMany({ where: { userId } });

  const token     = generateToken();
  const expiresAt = new Date(Date.now() + EXPIRY_MS);

  await prisma.passwordResetToken.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

export async function validatePasswordResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where:   { token },
    include: { user: true },
  });

  if (!record)                       return { valid: false, reason: "NOT_FOUND"    };
  if (record.usedAt)                 return { valid: false, reason: "ALREADY_USED" };
  if (record.expiresAt < new Date()) return { valid: false, reason: "EXPIRED"      };

  return { valid: true, record };
}

export async function markTokenUsed(token: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { token },
    data:  { usedAt: new Date() },
  });
}
