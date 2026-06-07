"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

// WHY the split into two components:
// useSearchParams() cannot be used during static prerendering.
// The outer page component (ResetPasswordPage) is static and safe.
// The inner component (ResetPasswordForm) contains useSearchParams()
// and is only rendered inside Suspense — so the build skips prerendering it.

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset link.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      window.location.href = "/login";
    }, 2500);
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1
          className="text-xl font-semibold mb-2"
          style={{ color: "var(--color-text-body)" }}
        >
          Password updated
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Redirecting you to login…
        </p>
      </div>
    );
  }

  return (
    <>
      <h1
        className="text-2xl font-semibold mb-1"
        style={{ color: "var(--color-text-body)" }}
      >
        Choose a new password
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        Must be at least 8 characters
      </p>
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
            New password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
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
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--color-text-body)" }}
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Repeat your password"
              className="w-full px-3 py-2 pr-16 rounded-lg border text-sm outline-none"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-bg-canvas)",
                color: "var(--color-text-body)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-1 rounded"
              style={{ color: "var(--color-text-muted)" }}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: "var(--color-accent-primary)" }}
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link
          href="/login"
          className="hover:underline"
          style={{ color: "var(--color-accent-primary)" }}
        >
          ← Back to login
        </Link>
      </p>
    </>
  );
}

// Outer page — static, safe to prerender
export default function ResetPasswordPage() {
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
      </div>
      <div
        className="w-full max-w-md mx-auto rounded-xl shadow-sm border p-8"
        style={{
          backgroundColor: "var(--color-bg-canvas)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* Suspense wraps the component that uses useSearchParams() */}
        <Suspense
          fallback={
            <p
              className="text-sm text-center"
              style={{ color: "var(--color-text-muted)" }}
            >
              Loading…
            </p>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
