"use client";
// src/components/exam/QuestionCard.tsx

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
  onNext: () => void;
  onBack: () => void;
}

export default function QuestionCard({
  question,
  index,
  total,
  selectedSlot,
  isFlagged,
  onSelect,
  onFlag,
  onNext,
  onBack,
}: Props) {
  return (
    <div className="space-y-5">
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
              className="w-full text-left px-4 py-3 rounded-xl border flex items-start
                               gap-3 transition-colors min-h-11"
              style={{
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
                className="shrink-0 w-6 h-6 rounded-full border flex items-center
                               justify-center text-xs font-semibold mt-0.5"
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

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          disabled={index === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium border
                           disabled:opacity-40 transition-opacity"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-body)",
          }}
          aria-keyshortcuts="B"
        >
          ← Back (B)
        </button>

        <button
          onClick={onFlag}
          className="px-3 py-2 rounded-lg text-sm border transition-colors"
          style={{
            backgroundColor: isFlagged
              ? "var(--color-accent-flagged)"
              : "transparent",
            borderColor: isFlagged
              ? "var(--color-accent-flagged)"
              : "var(--color-border)",
            color: isFlagged ? "#7C5800" : "var(--color-text-muted)",
          }}
          aria-keyshortcuts="F"
        >
          {isFlagged ? "🚩 Flagged (F)" : "Flag (F)"}
        </button>

        <button
          onClick={onNext}
          disabled={index === total - 1}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white
                           disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: "var(--color-accent-primary)" }}
          aria-keyshortcuts="N"
        >
          Next (N) →
        </button>
      </div>
    </div>
  );
}
