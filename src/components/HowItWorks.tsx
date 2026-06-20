"use client";
// src/components/HowItWorks.tsx

import { useState } from "react";

const STORAGE_KEY = "cbt_intro_dismissed";

export default function HowItWorks() {
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
        // WHY color-mix() instead of the hardcoded "#EBF3FD":
        // That flat pastel blue stayed light blue in dark mode, while
        // the heading text (var(--color-text-body)) correctly switched
        // to a light/white color for dark mode — resulting in nearly
        // invisible white-on-pale-blue text. Blending 10% of the accent
        // color into --color-bg-canvas (the same "page surface" variable
        // used everywhere else, which is white in light mode and dark in
        // dark mode) produces a tinted card that stays proportionate to
        // whichever theme is active, so the text color always has
        // correct contrast against it.
        backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 10%, var(--color-bg-canvas))",
        borderColor:     "var(--color-accent-primary)",
        borderLeftWidth: "4px",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-semibold mb-0.5"
              style={{ color: "var(--color-text-body)" }}>
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
            borderColor:     "var(--color-accent-primary)",
            color:           "var(--color-accent-primary)",
            // WHY var(--color-bg-canvas) instead of hardcoded "white":
            // Same reasoning as the card above — keeps this button's
            // surface consistent with whichever theme is active instead
            // of staying a fixed light color.
            backgroundColor: "var(--color-bg-canvas)",
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
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-body)" }}>
              35 questions per session
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Drawn randomly from 200 questions in the course bank,
              spread proportionally across all modules.
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <span className="text-xl shrink-0">⏱</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-body)" }}>
              25-minute timer
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Turns amber at 5:00 remaining and red at 2:00. The session
              auto-submits at 0:00.
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <span className="text-xl shrink-0">🎯</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-body)" }}>
              Passing score: 40 / 70
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Each correct answer is worth 2 marks. Maximum score is 70.
              You need 40 or above to pass (57%).
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <span className="text-xl shrink-0">🔍</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-body)" }}>
              Review after every session
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              After submitting, review all 35 questions — correct answers,
              your answers, and an explanation for each.
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <span className="text-xl shrink-0">🚩</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-body)" }}>
              Flag questions during the exam
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Press{" "}
              <kbd
                className="px-1 py-0.5 rounded text-xs font-mono"
                style={{
                  backgroundColor: "var(--color-bg-canvas)",
                  border: "1px solid var(--color-border)",
                }}
              >
                F
              </kbd>{" "}
              or tap Flag to mark a question to revisit. Use Grid to see
              all 35 questions at a glance.
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <span className="text-xl shrink-0">💾</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-body)" }}>
              Answers saved automatically
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Every answer is saved to your device and to the server every
              2 seconds. If you lose connection, your answers are safe.
            </p>
          </div>
        </div>

      </div>

      {/* Footer tip */}
      <p
        className="text-xs mt-4 pt-3 border-t"
        style={{ borderColor: "var(--color-accent-primary)", color: "var(--color-text-muted)" }}
      >
        💡 <strong>Tip:</strong> You can practice the same course as many times as you like —
        each session draws a fresh set of questions. Aim to consistently score above 40/70
        before your exam day.
      </p>
    </div>
  );
}
