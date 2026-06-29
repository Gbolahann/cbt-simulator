"use client";
// src/app/check-email/page.tsx
// Shown immediately after registration — tells the student to check their inbox.

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const email        = searchParams.get("email") ?? "";

  const [loading,  setLoading]  = useState(false);
  const [feedback, setFeedback] = useState("");
  const [cooldown, setCooldown] = useState(false);

  async function handleResend() {
    if (cooldown || !email) return;
    setLoading(true);
    setFeedback("");

    const res  = await fetch("/api/auth/resend-verification", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setFeedback(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setFeedback("A new link has been sent. Check your inbox and spam folder.");
    setCooldown(true);
    // Re-enable button after 2 minutes to match server-side cooldown
    setTimeout(() => setCooldown(false), 2 * 60 * 1000);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
         style={{ backgroundColor: "var(--color-bg-surface)" }}>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border p-8 text-center"
           style={{ backgroundColor: "var(--color-bg-canvas)", borderColor: "var(--color-border)" }}>

        {/* Envelope icon */}
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
             style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 12%, var(--color-bg-canvas))" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
               stroke="var(--color-accent-primary)" strokeWidth="1.8"
               strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 7l10 7 10-7" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold mb-2"
            style={{ color: "var(--color-text-body)" }}>
          Check your inbox
        </h1>

        {/* Subheading */}
        <p className="text-sm mb-1" style={{ color: "var(--color-text-muted)" }}>
          We sent a verification link to
        </p>
        {email && (
          <p className="text-sm font-semibold mb-5"
             style={{ color: "var(--color-text-body)" }}>
            {email}
          </p>
        )}

        {/* Info box */}
        <div className="rounded-xl px-4 py-3 mb-6 text-sm"
             style={{
               backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 8%, var(--color-bg-canvas))",
               color:           "var(--color-accent-primary)",
               border:          "1px solid color-mix(in srgb, var(--color-accent-primary) 25%, transparent)",
             }}>
          Click the link in your email to verify your account and start practising.
        </div>

        {/* Feedback from resend */}
        {feedback && (
          <p className="text-xs mb-4 px-3 py-2 rounded-lg"
             style={{
               backgroundColor: feedback.includes("sent")
                 ? "color-mix(in srgb, var(--color-accent-success) 10%, var(--color-bg-canvas))"
                 : "color-mix(in srgb, var(--color-accent-danger) 10%, var(--color-bg-canvas))",
               color: feedback.includes("sent")
                 ? "var(--color-accent-success)"
                 : "var(--color-accent-danger)",
             }}>
            {feedback}
          </p>
        )}

        {/* Resend button */}
        <button
          onClick={handleResend}
          disabled={loading || cooldown || !email}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white
                     transition-opacity disabled:opacity-50 mb-3 flex items-center justify-center gap-2"
          style={{ backgroundColor: "var(--color-accent-primary)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 7l10 7 10-7" />
          </svg>
          {loading ? "Sending…" : cooldown ? "Email sent ✓" : "Resend verification email"}
        </button>

        {/* Back to sign in */}
        <Link href="/login"
              className="w-full py-3 rounded-xl text-sm font-medium border flex items-center justify-center transition-colors"
              style={{
                borderColor:     "var(--color-border)",
                color:           "var(--color-text-body)",
                backgroundColor: "transparent",
              }}>
          Back to sign in
        </Link>

        {/* Small hint */}
        <p className="text-xs mt-5" style={{ color: "var(--color-text-muted)" }}>
          Didn&apos;t receive it? Check your spam folder, or resend above.
        </p>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center"
           style={{ backgroundColor: "var(--color-bg-surface)" }}>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading…</p>
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  );
                  }
