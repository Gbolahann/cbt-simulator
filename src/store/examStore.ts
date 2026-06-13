"use client";
// src/store/examStore.ts

import { create } from "zustand";
import { EXAM_CONFIG } from "../../config/exam.config";

export interface ExamQuestion {
  id: string;
  stem: string;
  imageUrl: string | null;
  options: { slot: string; text: string }[];
}

export interface SessionInitData {
  sessionId: string;
  courseId: string;
  questions: ExamQuestion[];
  startedAt: string;
  timeRemainingMs: number;
  answers?: Record<string, string>;
  flagged?: string[];
}

type SyncStatus = "saved" | "saving" | "error" | "offline";

// WHY a typed interface for DEFAULT_STATE instead of inline type assertions:
//
// Writing `null as string | null` inside an object literal is a TypeScript
// type assertion used as an expression value. ESLint's
// `@typescript-eslint/no-unused-expressions` rule flags expressions whose
// return value is discarded — and in some project configurations, type
// assertion expressions inside object literals can trigger this because
// the linter sees `null as X` as a standalone expression rather than an
// assignment value.
//
// Typing the object explicitly with an interface (`const DEFAULT_STATE:
// DefaultState = { ... }`) removes all inline assertions. TypeScript
// enforces the types at the assignment level, not through expressions,
// so no linting violations occur.
interface DefaultState {
  sessionId: string | null;
  courseId: string | null;
  questions: ExamQuestion[];
  startedAt: number | null;
  currentIndex: number;
  answers: Record<string, string>;
  flagged: Set<string>;
  timeRemaining: number;
  syncStatus: SyncStatus;
  violationCount: number;
  isGridOpen: boolean;
  isTimerVisible: boolean;
  isSubmitting: boolean;
  showSubmitModal: boolean;
}

const DEFAULT_STATE: DefaultState = {
  sessionId: null,
  courseId: null,
  questions: [],
  startedAt: null,
  currentIndex: 0,
  answers: {},
  flagged: new Set(),
  timeRemaining: EXAM_CONFIG.TIME_LIMIT_SECONDS,
  syncStatus: "saved",
  violationCount: 0,
  isGridOpen: false,
  isTimerVisible: true,
  isSubmitting: false,
  showSubmitModal: false,
};

interface ExamStore extends DefaultState {
  initSession: (data: SessionInitData) => void;
  resetSession: () => void;
  selectAnswer: (questionId: string, slot: string) => void;
  toggleFlag: (questionId: string) => void;
  goTo: (index: number) => void;
  next: () => void;
  back: () => void;
  tickTimer: () => void;
  setSyncStatus: (s: SyncStatus) => void;
  setGridOpen: (v: boolean) => void;
  setTimerVisible: (v: boolean) => void;
  setSubmitModal: (v: boolean) => void;
  setSubmitting: (v: boolean) => void;
  addViolation: () => void;
}

export const useExamStore = create<ExamStore>((set) => ({
  ...DEFAULT_STATE,

  initSession: (data: SessionInitData) =>
    set({
      sessionId: data.sessionId,
      courseId: data.courseId,
      questions: data.questions,
      startedAt: new Date(data.startedAt).getTime(),
      timeRemaining: Math.floor(data.timeRemainingMs / 1000),
      answers: data.answers ?? {},
      flagged: new Set(data.flagged ?? []),
      currentIndex: 0,
      isGridOpen: false,
      isTimerVisible: true,
      isSubmitting: false,
      showSubmitModal: false,
      syncStatus: "saved",
      violationCount: 0,
    }),

  // Wipes all session state back to defaults before navigating away.
  // Prevents the previous session's questions flashing on the next exam mount.
  resetSession: () => set({ ...DEFAULT_STATE, flagged: new Set() }),

  selectAnswer: (questionId, slot) =>
    set((s) => ({
      answers: { ...s.answers, [questionId]: slot },
      syncStatus: "saving",
    })),

  // WHY if/else instead of a ternary expression:
  //
  // The original code used:
  //   flagged.has(q) ? flagged.delete(q) : flagged.add(q)
  //
  // This is a ternary expression used purely for its side effects — the
  // return value (true/false from Set methods) is thrown away. ESLint's
  // `@typescript-eslint/no-unused-expressions` rule exists to catch
  // exactly this pattern because it is a common source of bugs (developers
  // accidentally write an expression when they meant to write a statement).
  //
  // An if/else statement makes the intent unambiguous — we are branching
  // for side effects, not selecting a value — which satisfies the linter
  // and is clearer to read.
  toggleFlag: (questionId) =>
    set((s) => {
      const flagged = new Set(s.flagged);
      if (flagged.has(questionId)) {
        flagged.delete(questionId);
      } else {
        flagged.add(questionId);
      }
      return { flagged };
    }),

  goTo: (index) => set({ currentIndex: index, isGridOpen: false }),

  next: () =>
    set((s) => ({
      currentIndex: Math.min(s.currentIndex + 1, s.questions.length - 1),
    })),

  back: () =>
    set((s) => ({
      currentIndex: Math.max(s.currentIndex - 1, 0),
    })),

  tickTimer: () =>
    set((s) => {
      const next = Math.max(s.timeRemaining - 1, 0);
      const visible = s.isTimerVisible || next <= EXAM_CONFIG.TIMER_WARNING_AT;
      return { timeRemaining: next, isTimerVisible: visible };
    }),

  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setGridOpen: (isGridOpen) => set({ isGridOpen }),
  setTimerVisible: (isTimerVisible) => set({ isTimerVisible }),
  setSubmitModal: (showSubmitModal) => set({ showSubmitModal }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  addViolation: () => set((s) => ({ violationCount: s.violationCount + 1 })),
}));
