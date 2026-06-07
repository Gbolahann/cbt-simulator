"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSuccess("Account created! Check your email to verify, then log in.");
  }

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{ backgroundColor: "var(--color-bg-surface)" }}
    >
      {/* Brand */}
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

      {/* Card */}
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
          Create your account
        </h1>
        <p
          className="text-sm mb-6"
          style={{ color: "var(--color-text-muted)" }}
        >
          Join to start practising
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

        {success && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm"
            style={{
              backgroundColor: "#F0FFF4",
              color: "#1A7F37",
              border: "1px solid #BBDFC8",
            }}
          >
            {success}
            <div className="mt-2">
              <Link
                href="/login"
                className="font-medium underline"
                style={{ color: "var(--color-accent-primary)" }}
              >
                Go to login →
              </Link>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--color-text-body)" }}
              >
                Full name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
                placeholder="e.g. Adebola Fashola"
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-bg-canvas)",
                  color: "var(--color-text-body)",
                }}
              />
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--color-text-body)" }}
              >
                Password
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

            {/* Confirm password */}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white
                         transition-opacity disabled:opacity-60"
              style={{ backgroundColor: "var(--color-accent-primary)" }}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}

        <p
          className="mt-6 text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium hover:underline"
            style={{ color: "var(--color-accent-primary)" }}
          >
            Log in
          </Link>
        </p>
      </div>

      <p
        className="mt-6 text-center text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        NDPR Compliant · Your data stays private
      </p>
    </div>
  );
}
