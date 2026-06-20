"use client";
// src/components/exam/ExamShell.tsx

/* eslint-disable react-hooks/exhaustive-deps */
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
import { posthog } from "@/lib/posthog";

function computeRemainingFromStart(): number {
  const { startedAt } = useExamStore.getState();
  if (!startedAt) return EXAM_CONFIG.TIME_LIMIT_SECONDS;
  const elapsedSecs = Math.floor((Date.now() - startedAt) / 1000);
  return Math.max(EXAM_CONFIG.TIME_LIMIT_SECONDS - elapsedSecs, 0);
}

export default function ExamShell({ sessionId }: { sessionId: string }) {
  const router    = useRouter();
  const store     = useExamStore();
  const timerRef  = useRef<NodeJS.Timeout | null>(null);
  const syncRef   = useRef<NodeJS.Timeout | null>(null);
  const hasLoaded = useRef(false);

  const submitSession = useCallback(
    async (isAutoSubmit = false) => {
      const state = useExamStore.getState();

      const res = await fetch(`/api/sessions/${sessionId}/submit`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: state.answers,
          flagged: [...state.flagged],
        }),
      });

      if (res.ok) {
        posthog.capture("exam_submitted", {
          course_id:       state.courseId,
          session_id:      sessionId,
          answered_count:  Object.keys(state.answers).length,
          total_questions: state.questions.length,
          was_auto_submit: isAutoSubmit,
          time_remaining:  state.timeRemaining,
        });

        await clearSessionLocally(sessionId);
        useExamStore.getState().resetSession();
        router.replace(`/results/${sessionId}`);
        return;
      }

      if (res.status === 409) {
        await clearSessionLocally(sessionId);
        useExamStore.getState().resetSession();
        router.replace(`/results/${sessionId}`);
        return;
      }

      if (res.status === 403) {
        await clearSessionLocally(sessionId);
        useExamStore.getState().resetSession();
        alert(
          "This session was open too long and has expired, so it could not be submitted. " +
          "Please start a new practice session — try to keep the app open and the screen " +
          "unlocked while practicing."
        );
        router.replace("/dashboard");
        return;
      }

      useExamStore.getState().setSubmitting(false);
      useExamStore.getState().setSubmitModal(false);
      alert("Could not submit your answers — please check your connection and try again.");
    },
    [router, sessionId],
  );

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    fetch(`/api/sessions/${sessionId}`)
      .then(r => {
        if (r.status === 410) { router.replace("/dashboard"); return null; }
        return r.json();
      })
      .then(async data => {
        if (!data) return;
        if (data.status === "SUBMITTED") {
          router.replace(`/results/${sessionId}`);
          return;
        }

        let initData = data;
        if (!data.answers || Object.keys(data.answers).length === 0) {
          const local = await loadSessionLocally(sessionId);
          if (local && Object.keys(local.answers).length > 0) {
            initData = { ...data, answers: local.answers, flagged: local.flagged };
          }
        }

        store.initSession(initData);

        posthog.capture("exam_started", {
          course_id:      data.courseId,
          session_id:     sessionId,
          question_count: data.questions?.length ?? 0,
        });
      })
      .catch(err => console.error("[ExamShell] load error:", err));
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const remaining = computeRemainingFromStart();
      const state      = useExamStore.getState();

      useExamStore.setState({
        timeRemaining:  remaining,
        isTimerVisible: state.isTimerVisible || remaining <= EXAM_CONFIG.TIMER_WARNING_AT,
      });

      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        if (!useExamStore.getState().isSubmitting) {
          useExamStore.getState().setSubmitting(true);
          posthog.capture("exam_time_expired", {
            course_id:      useExamStore.getState().courseId,
            session_id:     sessionId,
            answered_count: Object.keys(useExamStore.getState().answers).length,
          });
          submitSession(true);
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [submitSession]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;

      const state = useExamStore.getState();
      if (!state.sessionId || state.isSubmitting) return;

      const remaining = computeRemainingFromStart();
      useExamStore.setState({
        timeRemaining:  remaining,
        isTimerVisible: state.isTimerVisible || remaining <= EXAM_CONFIG.TIMER_WARNING_AT,
      });

      if (remaining <= 0 && !useExamStore.getState().isSubmitting) {
        useExamStore.getState().setSubmitting(true);
        submitSession(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [submitSession]);

  useEffect(() => {
    syncRef.current = setInterval(() => {
      const state = useExamStore.getState();
      if (state.syncStatus !== "saving") return;

      const payload = {
        answers: state.answers,
        flagged: [...state.flagged],
      };

      fetch(`/api/sessions/${sessionId}/answers`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })
        .then(r => {
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
  }, []);

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
        case "n": state.next();    break;
        case "b": state.back();    break;
        case "f": {
          const qId = state.questions[state.currentIndex]?.id;
          if (qId) state.toggleFlag(qId);
          break;
        }
        case "g": state.setGridOpen(!state.isGridOpen);       break;
        case "h": state.setTimerVisible(!state.isTimerVisible); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!store.sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ backgroundColor: "var(--color-bg-canvas)" }}>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Preparing your session…
        </p>
      </div>
    );
  }

  const currentQuestion = store.questions[store.currentIndex];

  return (
    <div className="min-h-screen flex flex-col"
         style={{ backgroundColor: "var(--color-bg-canvas)" }}>

      <ExamHeader onSubmitClick={() => store.setSubmitModal(true)} />

      <main className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 py-6 pb-28">
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            index={store.currentIndex}
            total={store.questions.length}
            selectedSlot={store.answers[currentQuestion.id] ?? null}
            isFlagged={store.flagged.has(currentQuestion.id)}
            onSelect={slot => store.selectAnswer(currentQuestion.id, slot)}
            onFlag={() => store.toggleFlag(currentQuestion.id)}
          />
        )}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-10 border-t px-4"
        style={{
          backgroundColor: "var(--color-bg-canvas)",
          borderColor:     "var(--color-border)",
          paddingBottom:   "calc(0.75rem + env(safe-area-inset-bottom))",
          paddingTop:      "0.75rem",
        }}
      >
        <div className="flex items-center justify-between max-w-2xl mx-auto w-full">
          <button
            onClick={store.back}
            disabled={store.currentIndex === 0}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border
                       disabled:opacity-40 transition-opacity min-w-[80px]"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-body)" }}
            aria-keyshortcuts="B">
            ← Back
          </button>

          <button
            onClick={() => currentQuestion && store.toggleFlag(currentQuestion.id)}
            className="px-4 py-2.5 rounded-lg text-sm border transition-colors"
            style={{
              backgroundColor: currentQuestion && store.flagged.has(currentQuestion.id)
                ? "color-mix(in srgb, var(--color-accent-flagged) 25%, transparent)"
                : "transparent",
              borderColor: currentQuestion && store.flagged.has(currentQuestion.id)
                ? "var(--color-accent-flagged)" : "var(--color-border)",
              color: currentQuestion && store.flagged.has(currentQuestion.id)
                ? "var(--color-accent-flagged)" : "var(--color-text-muted)",
            }}
            aria-keyshortcuts="F">
            {currentQuestion && store.flagged.has(currentQuestion.id) ? "🚩 Flagged" : "Flag"}
          </button>

          <button
            onClick={store.next}
            disabled={store.currentIndex === store.questions.length - 1}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white
                       disabled:opacity-40 transition-opacity min-w-[80px]"
            style={{ backgroundColor: "var(--color-accent-primary)" }}
            aria-keyshortcuts="N">
            Next →
          </button>
        </div>
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
