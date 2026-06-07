"use client";
// src/components/exam/ExamHeader.tsx
// WHY EXAM_CONFIG was removed:
// It was imported but never referenced in this component — ESLint
// no-unused-vars rule flags any import that is declared but not used.
// If you need EXAM_CONFIG values here in future, re-add the import then.

import { useExamStore } from "@/store/examStore";
import Timer from "./Timer";

export default function ExamHeader({
  onSubmitClick,
}: {
  onSubmitClick: () => void;
}) {
  const {
    courseId,
    currentIndex,
    questions,
    isGridOpen,
    setGridOpen,
    syncStatus,
  } = useExamStore();

  return (
    <header
      className="sticky top-0 z-20 border-b px-4 h-14 flex items-center justify-between"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center gap-4">
        {/* Course name */}
        <span
          className="text-sm font-medium hidden sm:block truncate max-w-xs"
          style={{ color: "var(--color-text-body)" }}
        >
          {courseId?.toUpperCase().replace(/(\w+)(\d+)/, "$1 $2")} — Practice
        </span>

        {/* Question counter */}
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Question {currentIndex + 1} of {questions.length}
        </span>

        {/* Grid toggle */}
        <button
          onClick={() => setGridOpen(!isGridOpen)}
          aria-label="Toggle question grid (G)"
          className="text-xs px-2 py-1 rounded border"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          Grid
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Sync status */}
        <span
          className="text-xs hidden sm:block"
          style={{
            color:
              syncStatus === "saved"
                ? "var(--color-accent-success)"
                : syncStatus === "saving"
                  ? "var(--color-text-muted)"
                  : "var(--color-accent-danger)",
          }}
        >
          {syncStatus === "saved"
            ? "✓ Saved"
            : syncStatus === "saving"
              ? "Saving…"
              : "⚠ Offline"}
        </span>

        <Timer />

        {/* Submit button */}
        <button
          onClick={onSubmitClick}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ backgroundColor: "var(--color-accent-primary)" }}
        >
          Submit
        </button>
      </div>
    </header>
  );
}
