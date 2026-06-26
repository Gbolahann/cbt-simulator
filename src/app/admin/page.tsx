// src/app/admin/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

// ── Gate ─────────────────────────────────────────────────────────────────────
// No role column, no migration — purely driven by ADMIN_EMAIL env var.
function isAdmin(email?: string | null): boolean {
  return !!email && email === process.env.ADMIN_EMAIL;
}

// ── Server action — manually verify one user ──────────────────────────────────
// Replaces the manual Neon trip to set emailVerified = true.
async function verifyUser(formData: FormData) {
  "use server";
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return;

  const userId = formData.get("userId") as string;
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    // Boolean schema → true.  DateTime? schema → new Date()
    data: { emailVerified: true },
  });

  revalidatePath("/admin");
}

// ── Data ──────────────────────────────────────────────────────────────────────
async function getAdminData() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    unverifiedUsers,
    sessionsToday,
    submittedToday,
    activeSessions,
    allSubmitted,
    courses,
    recentSessions,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.user.findMany({
      where: { emailVerified: false },
      select: { id: true, displayName: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),

    prisma.examSession.count({
      where: { startedAt: { gte: todayStart } },
    }),

    prisma.examSession.count({
      where: { status: "SUBMITTED", submittedAt: { gte: todayStart } },
    }),

    prisma.examSession.count({
      where: { status: "ACTIVE" },
    }),

    prisma.examSession.findMany({
      where: { status: "SUBMITTED" },
      select: {
        courseId: true,
        score: true,
        passed: true,
        submittedAt: true,
      },
    }),

    prisma.course.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),

    prisma.examSession.findMany({
      where: { status: "SUBMITTED" },
      take: 20,
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        courseId: true,
        score: true,
        passed: true,
        timeUsedSecs: true,
        submittedAt: true,
        user: { select: { displayName: true, email: true } },
      },
    }),
  ]);

  // Build per-course stats from allSubmitted (computed in JS — fast enough
  // for hundreds of sessions, avoids a complex groupBy query)
  const courseMap = new Map(courses.map((c) => [c.id, c.name]));

  type CourseStat = {
    courseId: string;
    name: string;
    total: number;
    today: number;
    avgScore: number | null;
    passRate: number | null;
  };

  const byId: Record<string, CourseStat> = {};

  for (const s of allSubmitted) {
    if (!byId[s.courseId]) {
      byId[s.courseId] = {
        courseId: s.courseId,
        name: courseMap.get(s.courseId) ?? s.courseId,
        total: 0,
        today: 0,
        avgScore: null,
        passRate: null,
      };
    }
    byId[s.courseId].total += 1;
    if (s.submittedAt && s.submittedAt >= todayStart) {
      byId[s.courseId].today += 1;
    }
  }

  for (const courseId of Object.keys(byId)) {
    const rows = allSubmitted.filter((s) => s.courseId === courseId);
    const scored = rows.filter((s) => s.score !== null);
    byId[courseId].avgScore = scored.length
      ? scored.reduce((n, s) => n + (s.score ?? 0), 0) / scored.length
      : null;
    byId[courseId].passRate = rows.length
      ? (rows.filter((s) => s.passed).length / rows.length) * 100
      : null;
  }

  const courseStats = Object.values(byId).sort((a, b) => b.total - a.total);

  return {
    totalUsers,
    unverifiedCount: unverifiedUsers.length,
    unverifiedUsers,
    sessionsToday,
    submittedToday,
    activeSessions,
    courseStats,
    courseMap,
    recentSessions,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtTime(secs: number | null) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const th = "text-left px-4 py-2 text-xs font-medium";
const td = "px-4 py-3";

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function AdminPage() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) notFound();

  const d = await getAdminData();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-bg-surface)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          backgroundColor: "var(--color-bg-canvas)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span
            className="font-semibold text-sm"
            style={{ color: "var(--color-text-body)" }}
          >
            CBT Admin
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {session?.user?.email}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* ── Section 1: Overview ─────────────────────────────────────────── */}
        <section>
          <h2
            className="text-base font-semibold mb-4"
            style={{ color: "var(--color-text-body)" }}
          >
            Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(
              [
                { label: "Total users", value: d.totalUsers },
                {
                  label: "Unverified emails",
                  value: d.unverifiedCount,
                  warn: d.unverifiedCount > 0,
                },
                { label: "Sessions today", value: d.sessionsToday },
                { label: "Submitted today", value: d.submittedToday },
                { label: "Active right now", value: d.activeSessions },
              ] as { label: string; value: number; warn?: boolean }[]
            ).map(({ label, value, warn }) => (
              <div
                key={label}
                className="rounded-xl border p-4"
                style={{
                  backgroundColor: "var(--color-bg-canvas)",
                  borderColor: warn
                    ? "var(--color-accent-danger)"
                    : "var(--color-border)",
                }}
              >
                <div
                  className="text-2xl font-semibold"
                  style={{
                    color: warn
                      ? "var(--color-accent-danger)"
                      : "var(--color-text-body)",
                  }}
                >
                  {value}
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 2: Unverified accounts ──────────────────────────────── */}
        <section>
          <h2
            className="text-base font-semibold mb-1"
            style={{ color: "var(--color-text-body)" }}
          >
            Unverified accounts
          </h2>
          <p
            className="text-xs mb-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            Students who registered but haven&apos;t clicked their verification
            link. Verify gives them immediate access without them needing to
            click the email.
          </p>

          {d.unverifiedUsers.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              ✓ No unverified accounts.
            </p>
          ) : (
            <div
              className="rounded-xl border overflow-x-auto"
              style={{ borderColor: "var(--color-border)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--color-bg-surface)" }}>
                    {["Name", "Email", "Registered", ""].map((h) => (
                      <th
                        key={h}
                        className={th}
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.unverifiedUsers.map((u, i) => (
                    <tr
                      key={u.id}
                      style={{
                        backgroundColor: "var(--color-bg-canvas)",
                        borderTop:
                          i > 0 ? "1px solid var(--color-border)" : undefined,
                      }}
                    >
                      <td
                        className={`${td} font-medium`}
                        style={{ color: "var(--color-text-body)" }}
                      >
                        {u.displayName}
                      </td>
                      <td
                        className={td}
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {u.email}
                      </td>
                      <td
                        className={`${td} text-xs`}
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {fmt(u.createdAt)}
                      </td>
                      <td className={td}>
                        <form action={verifyUser}>
                          <input type="hidden" name="userId" value={u.id} />
                          <button
                            type="submit"
                            className="text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer"
                            style={{
                              backgroundColor: "var(--color-accent-primary)",
                              color: "white",
                              border: "none",
                            }}
                          >
                            Verify
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Section 3: Course activity ───────────────────────────────────── */}
        <section>
          <h2
            className="text-base font-semibold mb-4"
            style={{ color: "var(--color-text-body)" }}
          >
            Course activity
          </h2>

          {d.courseStats.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              No submitted sessions yet.
            </p>
          ) : (
            <div
              className="rounded-xl border overflow-x-auto"
              style={{ borderColor: "var(--color-border)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--color-bg-surface)" }}>
                    {[
                      "Course",
                      "All-time",
                      "Today",
                      "Avg score",
                      "Pass rate",
                    ].map((h) => (
                      <th
                        key={h}
                        className={th}
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.courseStats.map((cs, i) => (
                    <tr
                      key={cs.courseId}
                      style={{
                        backgroundColor: "var(--color-bg-canvas)",
                        borderTop:
                          i > 0 ? "1px solid var(--color-border)" : undefined,
                      }}
                    >
                      <td
                        className={`${td} font-medium`}
                        style={{ color: "var(--color-text-body)" }}
                      >
                        {cs.name}
                      </td>
                      <td
                        className={td}
                        style={{ color: "var(--color-text-body)" }}
                      >
                        {cs.total}
                      </td>
                      <td
                        className={td}
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {cs.today}
                      </td>
                      <td
                        className={td}
                        style={{ color: "var(--color-text-body)" }}
                      >
                        {cs.avgScore !== null
                          ? `${cs.avgScore.toFixed(1)} / 70`
                          : "—"}
                      </td>
                      <td className={td}>
                        {cs.passRate !== null ? (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor:
                                cs.passRate >= 57 ? "#D1FAE5" : "#FEE2E2",
                              color: cs.passRate >= 57 ? "#065F46" : "#991B1B",
                            }}
                          >
                            {cs.passRate.toFixed(0)}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Section 4: Recent sessions ───────────────────────────────────── */}
        <section>
          <h2
            className="text-base font-semibold mb-4"
            style={{ color: "var(--color-text-body)" }}
          >
            Recent sessions (last 20)
          </h2>

          {d.recentSessions.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              No submitted sessions yet.
            </p>
          ) : (
            <div
              className="rounded-xl border overflow-x-auto"
              style={{ borderColor: "var(--color-border)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--color-bg-surface)" }}>
                    {[
                      "Student",
                      "Course",
                      "Score",
                      "Time used",
                      "Submitted",
                    ].map((h) => (
                      <th
                        key={h}
                        className={th}
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.recentSessions.map((s, i) => (
                    <tr
                      key={s.id}
                      style={{
                        backgroundColor: "var(--color-bg-canvas)",
                        borderTop:
                          i > 0 ? "1px solid var(--color-border)" : undefined,
                      }}
                    >
                      <td className={td}>
                        <div
                          className="font-medium"
                          style={{ color: "var(--color-text-body)" }}
                        >
                          {s.user.displayName}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {s.user.email}
                        </div>
                      </td>
                      <td
                        className={`${td} text-xs`}
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {d.courseMap.get(s.courseId) ?? s.courseId}
                      </td>
                      <td className={td}>
                        <span
                          className="font-semibold"
                          style={{
                            color: s.passed
                              ? "var(--color-accent-success)"
                              : "var(--color-accent-danger)",
                          }}
                        >
                          {s.score ?? "—"} / 70
                        </span>
                      </td>
                      <td
                        className={`${td} text-xs`}
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {fmtTime(s.timeUsedSecs)}
                      </td>
                      <td
                        className={`${td} text-xs`}
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {fmt(s.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
