"use client";
// src/components/exam/Timer.tsx

import { useExamStore } from "@/store/examStore";
import { EXAM_CONFIG } from "../../../config/exam.config";

export default function Timer() {
  const { timeRemaining, isTimerVisible, setTimerVisible } = useExamStore();

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

  // Timer forced visible at T-5:00 per blueprint
  const show = isTimerVisible || isWarning;

  return (
    <button
      onClick={() => !isWarning && setTimerVisible(!isTimerVisible)}
      aria-label="Toggle timer (H)"
      aria-live="polite"
      className="text-sm font-mono font-semibold tabular-nums min-w-[52px] text-center"
      style={{ color: show ? color : "var(--color-text-muted)" }}
    >
      {show ? `${mins}:${secs}` : "H hide"}
    </button>
  );
}
