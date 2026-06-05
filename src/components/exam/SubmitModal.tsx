"use client";
// src/components/exam/SubmitModal.tsx
// Double-gate submit confirmation — blueprint spec Section 2.7

interface Props {
  answeredCount: number;
  totalCount: number;
  flaggedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function SubmitModal({
  answeredCount,
  totalCount,
  flaggedCount,
  onConfirm,
  onCancel,
  isSubmitting,
}: Props) {
  const unanswered = totalCount - answeredCount;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
        <div
          className="w-full max-w-sm rounded-2xl p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-title"
          style={{
            backgroundColor: "var(--color-bg-canvas)",
            borderColor: "var(--color-border)",
          }}
        >
          <h2
            id="submit-title"
            className="text-lg font-semibold mb-1"
            style={{ color: "var(--color-text-body)" }}
          >
            Submit Practice Session?
          </h2>

          <p
            className="text-sm mb-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            You are about to end this session. This cannot be undone.
          </p>

          {/* Status summary */}
          <div
            className="rounded-lg p-3 mb-5 space-y-1 text-sm"
            style={{ backgroundColor: "var(--color-bg-surface)" }}
          >
            <div className="flex justify-between">
              <span style={{ color: "var(--color-text-muted)" }}>Answered</span>
              <span
                className="font-medium"
                style={{ color: "var(--color-text-body)" }}
              >
                {answeredCount} / {totalCount}
              </span>
            </div>
            {unanswered > 0 && (
              <div className="flex justify-between">
                <span style={{ color: "var(--color-accent-warning)" }}>
                  Unanswered
                </span>
                <span
                  className="font-medium"
                  style={{ color: "var(--color-accent-warning)" }}
                >
                  {unanswered}
                </span>
              </div>
            )}
            {flaggedCount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-muted)" }}>
                  Flagged for review
                </span>
                <span
                  className="font-medium"
                  style={{ color: "var(--color-text-body)" }}
                >
                  {flaggedCount}
                </span>
              </div>
            )}
          </div>

          {unanswered > 0 && (
            <p
              className="text-xs mb-4 font-medium"
              style={{ color: "var(--color-accent-warning)" }}
            >
              ⚠ {unanswered} question{unanswered > 1 ? "s" : ""} left
              unanswered. Unanswered questions score 0.
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium border disabled:opacity-50"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-body)",
              }}
            >
              Cancel (Esc)
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-accent-danger)" }}
            >
              {isSubmitting ? "Submitting…" : "Submit Session"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
