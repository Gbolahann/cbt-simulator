"use client";
// src/components/exam/Timer.tsx

// WHY useRef + useEffect are imported:
// The Phase 6 accessibility feature uses useRef to track whether the
// T-5:00 screen reader announcement has already fired (so it only fires once),
// and useEffect to watch timeRemaining and inject the ARIA alert element.
import { useRef, useEffect } from "react";
import { useExamStore } from "@/store/examStore";
import { EXAM_CONFIG } from "../../../config/exam.config";

export default function Timer() {
  const { timeRemaining, isTimerVisible, setTimerVisible } = useExamStore();
  const hasAnnouncedWarning = useRef(false);

  const mins = Math.floor(timeRemaining / 60)
    .toString()
    .padStart(2, "0");
  const secs = (timeRemaining % 60).toString().padStart(2, "0");

  const isWarning = timeRemaining <= EXAM_CONFIG.TIMER_WARNING_AT;
  const isDanger = timeRemaining <= EXAM_CONFIG.TIMER_DANGER_AT;

  const color = isDanger
    ? "var(--color-accent-danger)"
    : isWarning
      ? "var(--color-accent-warning)"
      : "var(--color-text-muted)";

  const show = isTimerVisible || isWarning;

  // Phase 6 — screen reader announcement at exactly T-5:00
  // Injects a visually hidden ARIA alert that screen readers announce aloud,
  // then removes it after 3 seconds so it does not linger in the DOM.
  useEffect(() => {
    if (
      timeRemaining === EXAM_CONFIG.TIMER_WARNING_AT &&
      !hasAnnouncedWarning.current
    ) {
      hasAnnouncedWarning.current = true;
      const el = document.createElement("div");
      el.setAttribute("aria-live", "assertive");
      el.setAttribute("role", "alert");
      el.className = "sr-only";
      el.textContent = "Warning: 5 minutes remaining.";
      document.body.appendChild(el);
      setTimeout(() => {
        if (document.body.contains(el)) document.body.removeChild(el);
      }, 3000);
    }
  }, [timeRemaining]);

  return (
    <button
      onClick={() => !isWarning && setTimerVisible(!isTimerVisible)}
      aria-label="Toggle timer (H)"
      aria-live="polite"
      className="text-sm font-mono font-semibold tabular-nums min-w-13 text-center"
      style={{ color: show ? color : "var(--color-text-muted)" }}
    >
      {show ? `${mins}:${secs}` : "H hide"}
    </button>
  );
}
