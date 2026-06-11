"use client";
// src/components/exam/QuestionGrid.tsx
// 7×5 grid showing answered / unanswered / flagged / current state

import { useExamStore } from "@/store/examStore";

export default function QuestionGrid() {
  const { questions, answers, flagged, currentIndex, goTo, setGridOpen } =
    useExamStore();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/30"
        onClick={() => setGridOpen(false)}
      />

      {/* Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 rounded-t-2xl border-t p-5 shadow-xl sm:max-w-md sm:mx-auto sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border"
        style={{
          backgroundColor: "var(--color-bg-canvas)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-body)" }}
          >
            Question Navigator (G)
          </h2>
          <button
            onClick={() => setGridOpen(false)}
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Close ✕
          </button>
        </div>

        {/* Legend */}
        <div
          className="flex gap-4 mb-4 text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: "var(--color-accent-primary)" }}
            />
            Answered
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-full border"
              style={{ borderColor: "var(--color-border)" }}
            />
            Unanswered
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: "var(--color-accent-flagged)" }}
            />
            Flagged
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-2">
          {questions.map((q, i) => {
            const isAnswered = !!answers[q.id];
            const isFlagged = flagged.has(q.id);
            const isCurrent = i === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => goTo(i)}
                aria-label={`Question ${i + 1}${isFlagged ? " flagged" : ""}${isAnswered ? " answered" : ""}`}
                className="w-9 h-9 rounded-full flex items-center justify-center
                                 text-xs font-medium transition-colors min-w-11 min-h-11"
                style={{
                  backgroundColor: isCurrent
                    ? "var(--color-accent-primary)"
                    : isFlagged
                      ? "var(--color-accent-flagged)"
                      : isAnswered
                        ? "#DBEAFE"
                        : "transparent",
                  border: isCurrent
                    ? "2px solid var(--color-accent-primary)"
                    : isFlagged
                      ? "2px solid var(--color-accent-flagged)"
                      : isAnswered
                        ? "2px solid #93C5FD"
                        : "2px solid var(--color-border)",
                  color: isCurrent
                    ? "white"
                    : isFlagged
                      ? "#7C5800"
                      : isAnswered
                        ? "var(--color-accent-primary)"
                        : "var(--color-text-muted)",
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Summary */}
        <div
          className="mt-4 pt-3 border-t flex justify-between text-xs"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <span>{Object.keys(answers).length} answered</span>
          <span>{flagged.size} flagged</span>
          <span>
            {questions.length - Object.keys(answers).length} remaining
          </span>
        </div>
      </div>
    </>
  );
}
