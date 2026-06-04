"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setSent(true);
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
      </div>

      <div className="w-full max-w-md mx-auto rounded-xl shadow-sm border p-8"
           style={{
             backgroundColor: "var(--color-bg-canvas)",
             borderColor:     "var(--color-border)",
           }}>

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">✉️</div>
            <h1 className="text-xl font-semibold mb-2"
                style={{ color: "var(--color-text-body)" }}>
              Check your inbox
            </h1>
            <p className="text-sm mb-6"
               style={{ color: "var(--color-text-muted)" }}>
              If an account exists for <strong>{email}</strong>, a password
              reset link has been sent. It expires in 1 hour.
            </p>
            <Link href="/login"
                  className="text-sm font-medium hover:underline"
                  style={{ color: "var(--color-accent-primary)" }}>
              ← Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold mb-1"
                style={{ color: "var(--color-text-body)" }}>
              Reset your password
            </h1>
            <p className="text-sm mb-6"
               style={{ color: "var(--color-text-muted)" }}>
              Enter your email and we&apos;ll send you a reset link
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
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{
                    borderColor:     "var(--color-border)",
                    backgroundColor: "var(--color-bg-canvas)",
                    color:           "var(--color-text-body)",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white
                           transition-opacity disabled:opacity-60"
                style={{ backgroundColor: "var(--color-accent-primary)" }}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm">
              <Link href="/login"
                    className="hover:underline"
                    style={{ color: "var(--color-accent-primary)" }}>
                ← Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
