// src/app/api/admin/verify-user/route.ts
// Protected POST endpoint — manually verifies a user's email.
// The admin page uses a server action for the Verify button, but this
// route exists for any programmatic use (e.g. future tooling or scripts).

import { auth }         from "@/lib/auth";
import { prisma }       from "@/lib/prisma";
import { NextResponse }  from "next/server";

function isAdmin(email?: string | null): boolean {
  return !!email && email === process.env.ADMIN_EMAIL;
}

export async function POST(req: Request) {
  const session = await auth();

  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as { userId?: string };
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ message: "Already verified", userId }, { status: 200 });
  }

  await prisma.user.update({
    where: { id: userId },
    // Boolean schema → true.  DateTime? schema → new Date()
    data:  { emailVerified: true },
  });

  return NextResponse.json({ success: true, userId }, { status: 200 });
}
