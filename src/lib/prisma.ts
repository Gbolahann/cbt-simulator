// src/lib/prisma.ts
//
// WHY THIS FILE EXISTS — Prisma Client Singleton Pattern
// ───────────────────────────────────────────────────────
// Problem: Every file that does `new PrismaClient()` opens a fresh
// connection pool to the database. In Next.js development, the module
// system re-executes files on every hot-reload. Without this singleton,
// each save in VS Code creates a new pool — you can exhaust Neon's free
// tier connection limit (typically 10) in minutes, causing P1001 errors.
//
// Solution: Store one PrismaClient instance on `globalThis`. Because
// globalThis persists across hot-reloads (it is the Node.js global
// object, not a module), all files share the same single instance.
// In production (Vercel) each serverless function boots fresh so
// globalThis is always empty — new PrismaClient() is created once
// per function invocation, which is correct behaviour.
//
// HOW TO USE IN YOUR FILES:
// Instead of:   const prisma = new PrismaClient()
// Write:        import { prisma } from "@/lib/prisma"

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]   // log errors and warnings in dev
        : ["error"],          // errors only in production
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
