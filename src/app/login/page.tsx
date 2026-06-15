"use client";
// src/app/login/page.tsx

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();

  const [banner, setBanner] = useState<string>(() => {
    if (searchParams.get("verified") === "true") {
      return "✅ Email verified! You can now log in.";
    }
    return "";
  });

  const [error, setError] = useState<string>(() => {
    const err = searchParams.get("error");
    if (err === "link-expired")
      return "This verification link has expired. Request a new one below.";
    if (err === "invalid-link")
      return "This verification link is invalid. Request a new one below.";
    return "";
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Controls whether the "Resend verification" UI is shown
  const [showResend, setShowResend] = useState(
    // Pre-show if arriving from an expired/invalid link
    () =>
      ["link-expired", "invalid-link"].includes(
        searchParams.get("error") ?? "",
      ),
  );
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendFeedback, setResendFeedback] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBanner("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      rememberMe: String(rememberMe),
      redirect: false,
    });

    setLoading(false);

    if (result?.error === "EMAIL_NOT_VERIFIED") {
      setError(
        "Your email is not yet verified. Check your inbox or request a new link below.",
      );
      setShowResend(true);
      setResendEmail(email); // pre-fill resend field
      return;
    }
    if (result?.error || !result?.ok) {
      setError("Incorrect email or password. Please try again.");
      return;
    }

    window.location.href = "/dashboard";
  }

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setResendFeedback("");
    setResendLoading(true);

    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resendEmail }),
    });

    const data = await res.json();
    setResendLoading(false);

    if (!res.ok) {
      setResendFeedback(
        data.error ?? "Something went wrong. Please try again.",
      );
    } else {
      setResendFeedback(
        "✅ If that email has an unverified account, a new link is on its way. Check your inbox (and spam folder).",
      );
    }
  }

  return (
    <div
      className="w-full max-w-md mx-auto rounded-xl shadow-sm border p-8"
      style={{
        backgroundColor: "var(--color-bg-canvas)",
        borderColor: "var(--color-border)",
      }}
    >
      <h1
        className="text-2xl font-semibold mb-1"
        style={{ color: "var(--color-text-body)" }}
      >
        Welcome back
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        Log in to continue your practice
      </p>

      {banner && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm"
          style={{
            backgroundColor: "#F0FFF4",
            color: "#1A7F37",
            border: "1px solid #BBDFC8",
          }}
        >
          {banner}
        </div>
      )}

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm"
          style={{
            backgroundColor: "#FFF5F5",
            color: "var(--color-accent-danger)",
            border: "1px solid #FFCDD2",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Login form ── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--color-text-body)" }}
          >
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-bg-canvas)",
              color: "var(--color-text-body)",
            }}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              className="block text-sm font-medium"
              style={{ color: "var(--color-text-body)" }}
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs hover:underline"
              style={{ color: "var(--color-accent-primary)" }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3 py-2 pr-16 rounded-lg border text-sm outline-none"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-bg-canvas)",
                color: "var(--color-text-body)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-1 rounded"
              style={{ color: "var(--color-text-muted)" }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded"
          />
          <label
            htmlFor="remember"
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Remember me for 30 days
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: "var(--color-accent-primary)" }}
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      {/* ── Resend verification section — shown after EMAIL_NOT_VERIFIED or bad link ── */}
      {showResend && (
        <div
          className="mt-5 pt-5 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          <p
            className="text-sm font-medium mb-1"
            style={{ color: "var(--color-text-body)" }}
          >
            Didn&apos;t receive a verification email?
          </p>
          <p
            className="text-xs mb-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            Enter your email and we&apos;ll send a fresh link. Also check your
            spam folder.
          </p>

          {resendFeedback ? (
            <p
              className="text-sm px-3 py-2 rounded-lg"
              style={{
                backgroundColor: resendFeedback.startsWith("✅")
                  ? "#F0FFF4"
                  : "#FFF5F5",
                color: resendFeedback.startsWith("✅")
                  ? "#1A7F37"
                  : "var(--color-accent-danger)",
              }}
            >
              {resendFeedback}
            </p>
          ) : (
            <form onSubmit={handleResend} className="flex gap-2">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-bg-canvas)",
                  color: "var(--color-text-body)",
                }}
              />
              <button
                type="submit"
                disabled={resendLoading}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: "var(--color-accent-primary)" }}
              >
                {resendLoading ? "Sending…" : "Resend"}
              </button>
            </form>
          )}
        </div>
      )}

      <p
        className="mt-6 text-center text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium hover:underline"
          style={{ color: "var(--color-accent-primary)" }}
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{ backgroundColor: "var(--color-bg-surface)" }}
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--color-accent-primary)" }}
          >
            <span className="text-white text-sm font-bold">CB</span>
          </div>
          <span
            className="text-lg font-semibold"
            style={{ color: "var(--color-text-body)" }}
          >
            CBT Simulator
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Practice MCQ Platform
        </p>
      </div>

      <Suspense
        fallback={
          <div
            className="w-full max-w-md mx-auto rounded-xl border p-8"
            style={{
              backgroundColor: "var(--color-bg-canvas)",
              borderColor: "var(--color-border)",
            }}
          >
            <p
              className="text-sm text-center"
              style={{ color: "var(--color-text-muted)" }}
            >
              Loading…
            </p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
