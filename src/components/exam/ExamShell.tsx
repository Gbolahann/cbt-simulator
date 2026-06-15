"use client";
// src/components/exam/ExamShell.tsx
/* eslint-disable react-hooks/exhaustive-deps */
// WHY file-level disable for react-hooks/exhaustive-deps:
// Every useEffect in this file intentionally uses an empty dependency array
// combined with useExamStore.getState() to read live Zustand values. This is
// the documented Zustand pattern for setInterval and event listeners — adding
// reactive store values to deps would cause intervals to be torn down and
// recreated on every state change, which would reset the timer on every tick.
// Per-line eslint-disable comments are fragile when lines shift after
// reformatting. A file-level disable is the stable, intentional solution.

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";
import { EXAM_CONFIG } from "../../../config/exam.config";
import ExamHeader from "./ExamHeader";
import QuestionCard from "./QuestionCard";
import QuestionGrid from "./QuestionGrid";
import SubmitModal from "./SubmitModal";
import NetworkStatus from "./NetworkStatus";
import {
  saveSessionLocally,
  loadSessionLocally,
  clearSessionLocally,
} from "@/lib/idb";
import posthog from "@/lib/posthog";

export default function ExamShell({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const store = useExamStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const syncRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoaded = useRef(false);

  // ── Submit ──────────────────────────────────────────────────────────────────
  // WHY submitSession is declared HERE, above the timer useEffect:
  //
  // JavaScript const/let declarations are NOT hoisted to the top of their
  // scope the way function declarations are. A plain `function submitSession`
  // would be available anywhere in the component body, but
  // `const submitSession = useCallback(...)` only exists AFTER that line
  // executes. The timer useEffect at line ~70 calls submitSession(true)
  // inside setInterval. If submitSession is declared below that useEffect,
  // the interval closure captures an undefined value at creation time and
  // throws "Cannot access variable before it is declared" when it fires.
  //
  // Moving submitSession above the timer useEffect means the closure
  // captures the correct, fully-initialised function reference.
  const submitSession = useCallback(
    async (isAutoSubmit = false) => {
      const state = useExamStore.getState();

      const res = await fetch(`/api/sessions/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: state.answers,
          flagged: [...state.flagged],
        }),
      });

      if (res.ok) {
        posthog.capture("exam_submitted", {
          course_id: state.courseId,
          session_id: sessionId,
          answered_count: Object.keys(state.answers).length,
          total_questions: state.questions.length,
          was_auto_submit: isAutoSubmit,
          time_remaining: state.timeRemaining,
        });

        await clearSessionLocally(sessionId);

        // Reset store BEFORE navigating so the next ExamShell mount
        // finds empty state instead of the previous session's data.
        useExamStore.getState().resetSession();

        router.replace(`/results/${sessionId}`);
      } else {
        useExamStore.getState().setSubmitting(false);
        useExamStore.getState().setSubmitModal(false);
      }
    },
    // router and sessionId are the only external values used inside.
    // getState() reads live Zustand values so they are not dependencies.
    [router, sessionId],
  );

  // ── Load session on mount ───────────────────────────────────────────────────

  // WHY empty deps with eslint-disable:
  // This effect must run exactly once — the hasLoaded ref guards against
  // double-invocation in React StrictMode. Including `store` or `router`
  // would re-run the effect on every render because their references
  // change, causing an infinite fetch loop. The hasLoaded guard is the
  // correct pattern here; the disable comment is intentional.
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    fetch(`/api/sessions/${sessionId}`)
      .then((r) => {
        if (r.status === 410) {
          router.replace("/dashboard");
          return null;
        }
        return r.json();
      })
      .then(async (data) => {
        if (!data) return;
        if (data.status === "SUBMITTED") {
          router.replace(`/results/${sessionId}`);
          return;
        }

        // Restore any locally-saved answers if the server has none
        let initData = data;
        if (!data.answers || Object.keys(data.answers).length === 0) {
          const local = await loadSessionLocally(sessionId);
          if (local && Object.keys(local.answers).length > 0) {
            initData = {
              ...data,
              answers: local.answers,
              flagged: local.flagged,
            };
          }
        }

        store.initSession(initData);

        posthog.capture("exam_started", {
          course_id: data.courseId,
          session_id: sessionId,
          question_count: data.questions?.length ?? 0,
        });
      })
      .catch((err) => console.error("[ExamShell] load error:", err));
  }, []); // intentionally empty — guarded by hasLoaded ref

  // ── Countdown timer ─────────────────────────────────────────────────────────
  // WHY useExamStore.getState() instead of reading from the `store` reference:
  //
  // setInterval creates a closure. Any variable read inside the interval
  // callback is captured at the moment setInterval is called — it does not
  // update when React state changes. Reading `store.timeRemaining` inside
  // the interval would always return 1500 (the mount-time value) because
  // that is what the closure captures.
  //
  // useExamStore.getState() bypasses React's rendering cycle entirely and
  // reads the current Zustand store value at the exact moment the interval
  // fires. This is the standard Zustand pattern for reading state inside
  // callbacks that are not re-created on every render.
  //

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const currentTime = useExamStore.getState().timeRemaining;

      if (currentTime <= 0) {
        clearInterval(timerRef.current!);
        const alreadySubmitting = useExamStore.getState().isSubmitting;
        if (!alreadySubmitting) {
          useExamStore.getState().setSubmitting(true);
          posthog.capture("exam_time_expired", {
            course_id: useExamStore.getState().courseId,
            session_id: sessionId,
            answered_count: Object.keys(useExamStore.getState().answers).length,
          });
          submitSession(true);
        }
        return;
      }

      useExamStore.getState().tickTimer();
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []); // intentionally empty — interval must run for component lifetime

  // ── Autosave every 2 seconds ────────────────────────────────────────────────

  useEffect(() => {
    syncRef.current = setInterval(() => {
      const state = useExamStore.getState();
      if (state.syncStatus !== "saving") return;

      const payload = {
        answers: state.answers,
        flagged: [...state.flagged],
      };

      fetch(`/api/sessions/${sessionId}/answers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((r) => {
          useExamStore.getState().setSyncStatus(r.ok ? "saved" : "error");
          if (r.ok) saveSessionLocally(sessionId, payload);
        })
        .catch(() => {
          useExamStore.getState().setSyncStatus("offline");
          saveSessionLocally(sessionId, payload);
        });
    }, EXAM_CONFIG.AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (syncRef.current) clearInterval(syncRef.current);
    };
  }, []); // intentionally empty — interval must run for component lifetime

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const state = useExamStore.getState();
      if (state.showSubmitModal) {
        if (e.key === "Escape") state.setSubmitModal(false);
        return;
      }
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key.toLowerCase()) {
        case "n":
          state.next();
          break;
        case "b":
          state.back();
          break;
        case "f": {
          const qId = state.questions[state.currentIndex]?.id;
          if (qId) state.toggleFlag(qId);
          break;
        }
        case "g":
          state.setGridOpen(!state.isGridOpen);
          break;
        case "h":
          state.setTimerVisible(!state.isTimerVisible);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // intentionally empty — uses getState() for live values

  // ── Render ──────────────────────────────────────────────────────────────────
  if (!store.sessionId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-bg-canvas)" }}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Preparing your session…
        </p>
      </div>
    );
  }

  const currentQuestion = store.questions[store.currentIndex];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-bg-canvas)" }}
    >
      <ExamHeader onSubmitClick={() => store.setSubmitModal(true)} />

      {/* pb-28 ensures the last option is never hidden behind the fixed footer */}
      <main className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 py-6 pb-28">
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            index={store.currentIndex}
            total={store.questions.length}
            selectedSlot={store.answers[currentQuestion.id] ?? null}
            isFlagged={store.flagged.has(currentQuestion.id)}
            onSelect={(slot) => store.selectAnswer(currentQuestion.id, slot)}
            onFlag={() => store.toggleFlag(currentQuestion.id)}
          />
        )}
      </main>

      {/* Fixed navigation footer — never scrolls with content */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-10 border-t px-4 py-3
                   flex items-center justify-between"
        style={{
          backgroundColor: "var(--color-bg-canvas)",
          borderColor: "var(--color-border)",
        }}
      >
        <button
          onClick={store.back}
          disabled={store.currentIndex === 0}
          className="px-5 py-2.5 rounded-lg text-sm font-medium border
                     disabled:opacity-40 transition-opacity min-w-20"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-body)",
          }}
          aria-keyshortcuts="B"
        >
          ← Back
        </button>

        <button
          onClick={() =>
            currentQuestion && store.toggleFlag(currentQuestion.id)
          }
          className="px-4 py-2.5 rounded-lg text-sm border transition-colors"
          style={{
            backgroundColor:
              currentQuestion && store.flagged.has(currentQuestion.id)
                ? "var(--color-accent-flagged)"
                : "transparent",
            borderColor:
              currentQuestion && store.flagged.has(currentQuestion.id)
                ? "var(--color-accent-flagged)"
                : "var(--color-border)",
            color:
              currentQuestion && store.flagged.has(currentQuestion.id)
                ? "#7C5800"
                : "var(--color-text-muted)",
          }}
          aria-keyshortcuts="F"
        >
          {currentQuestion && store.flagged.has(currentQuestion.id)
            ? "🚩 Flagged"
            : "Flag"}
        </button>

        <button
          onClick={store.next}
          disabled={store.currentIndex === store.questions.length - 1}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white
                     disabled:opacity-40 transition-opacity min-w-20"
          style={{ backgroundColor: "var(--color-accent-primary)" }}
          aria-keyshortcuts="N"
        >
          Next →
        </button>
      </nav>

      {store.isGridOpen && <QuestionGrid />}

      {store.showSubmitModal && (
        <SubmitModal
          answeredCount={Object.keys(store.answers).length}
          totalCount={store.questions.length}
          flaggedCount={store.flagged.size}
          onConfirm={() => {
            store.setSubmitting(true);
            submitSession(false);
          }}
          onCancel={() => store.setSubmitModal(false)}
          isSubmitting={store.isSubmitting}
        />
      )}

      <NetworkStatus />
    </div>
  );
}
