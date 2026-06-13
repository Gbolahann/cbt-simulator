"use client";
// src/app/login/page.tsx

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const verifiedParam = searchParams.get("verified");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (verifiedParam === "true") {
      setBanner("✅ Email verified! You can now log in.");
    }
    if (errorParam === "link-expired") {
      setError("This verification link has expired. Please register again.");
    }
    if (errorParam === "invalid-link") {
      setError(
        "This verification link is invalid. Please register again or contact support.",
      );
    }
  }, [verifiedParam, errorParam]);

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
      setError("Please verify your email before logging in. Check your inbox.");
      return;
    }
    if (result?.error || !result?.ok) {
      setError("Incorrect email or password. Please try again.");
      return;
    }

    window.location.href = "/dashboard";
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
