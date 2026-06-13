"use client";
// src/components/exam/QuestionCard.tsx
// Navigation buttons (Back / Flag / Next) have been moved to a fixed footer
// in ExamShell.tsx. This component now only renders the question stem and
// answer options, which scroll freely under the fixed footer.

import { ExamQuestion } from "@/store/examStore";
import Image from "next/image";

interface Props {
  question: ExamQuestion;
  index: number;
  total: number;
  selectedSlot: string | null;
  isFlagged: boolean;
  onSelect: (slot: string) => void;
  onFlag: () => void;
}

export default function QuestionCard({
  question,
  index,
  total,
  selectedSlot,
  isFlagged,
  onSelect,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Question counter */}
      <p
        className="text-xs font-medium"
        style={{ color: "var(--color-text-muted)" }}
      >
        Question {index + 1} of {total}
        {isFlagged && (
          <span className="ml-2" style={{ color: "#7C5800" }}>
            🚩 Flagged
          </span>
        )}
      </p>

      {/* Question stem */}
      <div
        className="rounded-xl border p-5"
        style={{
          backgroundColor: "var(--color-bg-canvas)",
          borderColor: "var(--color-border)",
        }}
      >
        {question.imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <Image
              src={question.imageUrl}
              alt="Question diagram"
              width={600}
              height={300}
              className="w-full object-contain"
            />
          </div>
        )}
        <p
          className="text-base leading-relaxed"
          style={{ color: "var(--color-text-body)" }}
        >
          {question.stem}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2" role="radiogroup" aria-label="Answer options">
        {question.options.map(({ slot, text }) => {
          const selected = selectedSlot === slot;
          return (
            <button
              key={slot}
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(slot)}
              className="w-full text-left px-4 py-3 rounded-xl border flex items-start gap-3 transition-colors"
              style={{
                minHeight: "44px",
                backgroundColor: selected
                  ? "#EBF3FD"
                  : "var(--color-bg-canvas)",
                borderColor: selected
                  ? "var(--color-accent-primary)"
                  : "var(--color-border)",
                borderLeftWidth: selected ? "4px" : "1px",
              }}
            >
              <span
                className="shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold mt-0.5"
                style={{
                  borderColor: selected
                    ? "var(--color-accent-primary)"
                    : "var(--color-border)",
                  backgroundColor: selected
                    ? "var(--color-accent-primary)"
                    : "transparent",
                  color: selected ? "white" : "var(--color-text-muted)",
                }}
              >
                {slot.toUpperCase()}
              </span>
              <span
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-text-body)" }}
              >
                {text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
