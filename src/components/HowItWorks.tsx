"use client";
// src/components/HowItWorks.tsx
// Dismissible intro card shown at the top of the dashboard.
// Once dismissed, localStorage records the choice so it stays hidden
// on every subsequent visit — students who know the platform are not
// forced to read it every time.

import { useState } from "react";

const STORAGE_KEY = "cbt_intro_dismissed";

export default function HowItWorks() {
  // Lazy initializer: reads localStorage once on first render.
  // No useEffect needed — avoids the react-hooks/set-state-in-effect lint error
  // and eliminates the flash-of-hidden-content on returning users.
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(STORAGE_KEY);
  });

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="rounded-xl border p-5 mb-6"
      style={{
        backgroundColor: "#EBF3FD",
        borderColor: "var(--color-accent-primary)",
        borderLeftWidth: "4px",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2
            className="text-base font-semibold mb-0.5"
            style={{ color: "var(--color-text-body)" }}
          >
            👋 Welcome to the CBT Practice Simulator
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Here is everything you need to know before your first session.
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss introduction"
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg border font-medium"
          style={{
            borderColor: "var(--color-accent-primary)",
            color: "var(--color-accent-primary)",
            backgroundColor: "white",
          }}
        >
          Got it ✓
        </button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex gap-3 items-start">
          <span className="text-xl shrink-0">📋</span>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-body)" }}
            >
              35 questions per session
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Drawn randomly from 200 questions in the course bank, spread
              proportionally across all modules.
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <span className="text-xl shrink-0">⏱</span>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-body)" }}
            >
              25-minute timer
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              The timer counts down from 25:00. It turns amber at 5:00 and red
              at 2:00. The session auto-submits at 0:00.
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <span className="text-xl shrink-0">🎯</span>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-body)" }}
            >
              Passing score: 40 / 70
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Each correct answer is worth 2 marks. Maximum score is 70. You
              need 40 or above to pass (57%).
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <span className="text-xl shrink-0">🔍</span>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-body)" }}
            >
              Review after every session
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              After submitting, you can review all 35 questions — correct
              answers, your answers, and an explanation for each.
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <span className="text-xl shrink-0">🚩</span>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-body)" }}
            >
              Flag questions during the exam
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Press{" "}
              <kbd
                className="px-1 py-0.5 rounded text-xs font-mono"
                style={{
                  backgroundColor: "white",
                  border: "1px solid #CBD5E0",
                }}
              >
                F
              </kbd>{" "}
              or tap Flag to mark a question to revisit. Use the Grid button to
              see all 35 questions at a glance.
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <span className="text-xl shrink-0">💾</span>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-body)" }}
            >
              Your answers are saved automatically
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Every answer is saved to your device and to the server every 2
              seconds. If you lose connection, your answers are safe.
            </p>
          </div>
        </div>
      </div>

      {/* Footer tip */}
      <p
        className="text-xs mt-4 pt-3 border-t"
        style={{
          borderColor: "var(--color-accent-primary)",
          color: "var(--color-text-muted)",
        }}
      >
        💡 <strong>Tip:</strong> You can practice the same course as many times
        as you like — each session draws a fresh set of questions. Aim to
        consistently score above 40/70 before your exam day.
      </p>
    </div>
  );
}
