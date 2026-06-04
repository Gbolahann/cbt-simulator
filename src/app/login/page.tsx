"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [rememberMe,   setRememberMe]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email:      email.toLowerCase(),
      password,
      rememberMe: String(rememberMe),
      redirect:   false,
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

    // Next.js 16 requires full page reload for session cookie to be recognised
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen py-12 px-4"
         style={{ backgroundColor: "var(--color-bg-surface)" }}>

      {/* Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ backgroundColor: "var(--color-accent-primary)" }}>
            <span className="text-white text-sm font-bold">CB</span>
          </div>
          <span className="text-lg font-semibold"
                style={{ color: "var(--color-text-body)" }}>
            CBT Simulator
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Practice MCQ Platform
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md mx-auto rounded-xl shadow-sm border p-8"
           style={{
             backgroundColor: "var(--color-bg-canvas)",
             borderColor:     "var(--color-border)",
           }}>

        <h1 className="text-2xl font-semibold mb-1"
            style={{ color: "var(--color-text-body)" }}>
          Welcome back
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          Log in to continue your practice
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm"
               style={{
                 backgroundColor: "#FFF5F5",
                 color:           "var(--color-accent-danger)",
                 border:          "1px solid #FFCDD2",
               }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1"
                   style={{ color: "var(--color-text-body)" }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                borderColor:     "var(--color-border)",
                backgroundColor: "var(--color-bg-canvas)",
                color:           "var(--color-text-body)",
              }}
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium"
                     style={{ color: "var(--color-text-body)" }}>
                Password
              </label>
              <Link href="/forgot-password"
                    className="text-xs hover:underline"
                    style={{ color: "var(--color-accent-primary)" }}>
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3 py-2 pr-16 rounded-lg border text-sm outline-none"
                style={{
                  borderColor:     "var(--color-border)",
                  backgroundColor: "var(--color-bg-canvas)",
                  color:           "var(--color-text-body)",
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

          {/* Remember me */}
          <div className="flex items-center gap-2">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="remember"
                   className="text-sm"
                   style={{ color: "var(--color-text-muted)" }}>
              Remember me for 30 days
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white
                       transition-opacity disabled:opacity-60"
            style={{ backgroundColor: "var(--color-accent-primary)" }}>
            {loading ? "Logging in…" : "Log in"}
          </button>

        </form>

        <p className="mt-6 text-center text-sm"
           style={{ color: "var(--color-text-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register"
                className="font-medium hover:underline"
                style={{ color: "var(--color-accent-primary)" }}>
            Create one
          </Link>
        </p>

      </div>

      <p className="mt-6 text-center text-xs"
         style={{ color: "var(--color-text-muted)" }}>
        NDPR Compliant · Your data stays private
      </p>
    </div>
  );
}
