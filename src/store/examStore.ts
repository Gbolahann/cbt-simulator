"use client";
// src/store/examStore.ts
// Client-side exam state — timer, answers, navigation, sync status

import { create } from "zustand";
import { EXAM_CONFIG } from "../../config/exam.config";

export interface ExamQuestion {
  id:       string;
  stem:     string;
  imageUrl: string | null;
  options:  { slot: string; text: string }[];
}

// WHY this interface exists:
// initSession previously used "data: any" which ESLint's no-explicit-any
// rule rejects. This interface describes exactly what the session API
// returns so TypeScript can verify shape at compile time.
export interface SessionInitData {
  sessionId:       string;
  courseId:        string;
  questions:       ExamQuestion[];
  startedAt:       string;       // ISO date string from the server
  timeRemainingMs: number;
  answers?:        Record<string, string>;
  flagged?:        string[];
}

type SyncStatus = "saved" | "saving" | "error" | "offline";

interface ExamStore {
  // Session data (set once on load)
  sessionId:   string | null;
  courseId:    string | null;
  questions:   ExamQuestion[];
  startedAt:   number | null;

  // Live state
  currentIndex:    number;
  answers:         Record<string, string>;
  flagged:         Set<string>;
  timeRemaining:   number;
  syncStatus:      SyncStatus;
  violationCount:  number;
  isGridOpen:      boolean;
  isTimerVisible:  boolean;
  isSubmitting:    boolean;
  showSubmitModal: boolean;

  // Actions
  initSession:     (data: SessionInitData) => void;
  selectAnswer:    (questionId: string, slot: string) => void;
  toggleFlag:      (questionId: string) => void;
  goTo:            (index: number) => void;
  next:            () => void;
  back:            () => void;
  tickTimer:       () => void;
  setSyncStatus:   (s: SyncStatus) => void;
  setGridOpen:     (v: boolean) => void;
  setTimerVisible: (v: boolean) => void;
  setSubmitModal:  (v: boolean) => void;
  setSubmitting:   (v: boolean) => void;
  addViolation:    () => void;
}

export const useExamStore = create<ExamStore>((set) => ({
  sessionId:       null,
  courseId:        null,
  questions:       [],
  startedAt:       null,
  currentIndex:    0,
  answers:         {},
  flagged:         new Set(),
  timeRemaining:   EXAM_CONFIG.TIME_LIMIT_SECONDS,
  syncStatus:      "saved",
  violationCount:  0,
  isGridOpen:      false,
  isTimerVisible:  true,
  isSubmitting:    false,
  showSubmitModal: false,

  initSession: (data: SessionInitData) =>
    set({
      sessionId:       data.sessionId,
      courseId:        data.courseId,
      questions:       data.questions,
      startedAt:       new Date(data.startedAt).getTime(),
      timeRemaining:   Math.floor(data.timeRemainingMs / 1000),
      answers:         data.answers ?? {},
      flagged:         new Set(data.flagged ?? []),
      currentIndex:    0,
      isGridOpen:      false,
      isTimerVisible:  true,
      isSubmitting:    false,
      showSubmitModal: false,
      syncStatus:      "saved",
      violationCount:  0,
    }),

  selectAnswer: (questionId, slot) =>
    set((s) => ({
      answers:    { ...s.answers, [questionId]: slot },
      syncStatus: "saving",
    })),

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
    set((s) => ({ currentIndex: Math.max(s.currentIndex - 1, 0) })),

  tickTimer: () =>
    set((s) => {
      const next    = Math.max(s.timeRemaining - 1, 0);
      const visible = s.isTimerVisible || next <= EXAM_CONFIG.TIMER_WARNING_AT;
      return { timeRemaining: next, isTimerVisible: visible };
    }),

  setSyncStatus:   (syncStatus)     => set({ syncStatus }),
  setGridOpen:     (isGridOpen)     => set({ isGridOpen }),
  setTimerVisible: (isTimerVisible) => set({ isTimerVisible }),
  setSubmitModal:  (showSubmitModal)=> set({ showSubmitModal }),
  setSubmitting:   (isSubmitting)   => set({ isSubmitting }),
  addViolation:    ()               => set((s) => ({ violationCount: s.violationCount + 1 })),
}));
