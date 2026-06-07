"use client";
// src/components/exam/ExamShell.tsx
// Client-only SPA shell. Loads session, runs timer, handles autosave.
import NetworkStatus from "./NetworkStatus";
import { posthog } from "@/lib/posthog";
import {
  saveSessionLocally,
  loadSessionLocally,
  clearSessionLocally,
} from "@/lib/idb";
import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";
import { EXAM_CONFIG } from "../../../config/exam.config";
import ExamHeader from "./ExamHeader";
import QuestionCard from "./QuestionCard";
import QuestionGrid from "./QuestionGrid";
import SubmitModal from "./SubmitModal";

export default function ExamShell({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const store = useExamStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const syncRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoaded = useRef(false);

  // ── Submit session (declare before useEffect) ─────────────
  const submitSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: store.answers,
        flagged: [...store.flagged],
      }),
    });
    posthog.capture("exam_submitted", {
      course_id: store.courseId,
      session_id: sessionId,
      answered_count: Object.keys(store.answers).length,
      total_questions: store.questions.length,
      time_remaining: store.timeRemaining,
      was_auto_submit: store.timeRemaining === 0,
    });
    if (res.ok) {
      router.replace(`/results/${sessionId}`);
      // After router.replace(`/results/${sessionId}`):
      await clearSessionLocally(sessionId);
    } else {
      store.setSubmitting(false);
      store.setSubmitModal(false);
    }
  }, [sessionId, store, router]);

  // ── Auto-submit when time expires ─────────────────────────
  const handleAutoSubmit = useCallback(async () => {
    if (store.isSubmitting) return;
    store.setSubmitting(true);
    await submitSession();
  }, [store, submitSession]);
  posthog.capture("exam_time_expired", {
    course_id: store.courseId,
    session_id: sessionId,
    answered_count: Object.keys(store.answers).length,
  });

  // ── Load session on mount ─────────────────────────────────
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
        store.initSession(data);
        // After store.initSession(data), add:
        // If server returned no answers (fresh session) check IndexedDB
        // for locally saved answers from a previous interrupted session
        if (!data.answers || Object.keys(data.answers).length === 0) {
          const local = await loadSessionLocally(sessionId);
          if (local && Object.keys(local.answers).length > 0) {
            store.initSession({
              ...data,
              answers: local.answers,
              flagged: local.flagged,
            });
            posthog.capture("exam_started", {
              course_id: data.courseId,
              session_id: sessionId,
              question_count: data.questions.length,
            });
          }
        }
      });
  }, [sessionId, router, store]);

  // ── Countdown timer ───────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      store.tickTimer();
      if (store.timeRemaining <= 1) {
        clearInterval(timerRef.current!);
        handleAutoSubmit();
      }
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [store, handleAutoSubmit]);

  // ── Autosave every 2 seconds ──────────────────────────────
  useEffect(() => {
    syncRef.current = setInterval(() => {
      if (store.syncStatus !== "saving") return;
      store.setSyncStatus("saving");

      fetch(`/api/sessions/${sessionId}/answers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: store.answers,
          flagged: [...store.flagged],
        }),
      })
        .then((r) => store.setSyncStatus(r.ok ? "saved" : "error"))
        .catch(() => store.setSyncStatus("offline"));
    }, EXAM_CONFIG.AUTOSAVE_DEBOUNCE_MS);
    // Inside the autosave interval, update the fetch block to also save locally:
    fetch(`/api/sessions/${sessionId}/answers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: store.answers,
        flagged: [...store.flagged],
      }),
    })
      .then((r) => {
        store.setSyncStatus(r.ok ? "saved" : "error");
        if (r.ok) {
          // Also persist locally so offline recovery works
          saveSessionLocally(sessionId, {
            answers: store.answers,
            flagged: [...store.flagged],
          });
        }
      })
      .catch(() => {
        store.setSyncStatus("offline");
        // Save locally even when server is unreachable
        saveSessionLocally(sessionId, {
          answers: store.answers,
          flagged: [...store.flagged],
        });
      });

    return () => clearInterval(syncRef.current!);
  }, [sessionId, store, store.answers, store.flagged, store.syncStatus]);

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (store.showSubmitModal) {
        if (e.key === "Escape") store.setSubmitModal(false);
        return;
      }
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key.toLowerCase()) {
        case "n":
          store.next();
          break;
        case "b":
          store.back();
          break;
        case "f": {
          const qId = store.questions[store.currentIndex]?.id;
          if (qId) store.toggleFlag(qId);
          break;
        }
        case "g":
          store.setGridOpen(!store.isGridOpen);
          break;
        case "h":
          store.setTimerVisible(!store.isTimerVisible);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [store]);

  if (!store.sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--color-text-muted)" }}>
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

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            index={store.currentIndex}
            total={store.questions.length}
            selectedSlot={store.answers[currentQuestion.id] ?? null}
            isFlagged={store.flagged.has(currentQuestion.id)}
            onSelect={(slot: string) =>
              store.selectAnswer(currentQuestion.id, slot)
            }
            onFlag={() => store.toggleFlag(currentQuestion.id)}
            onNext={store.next}
            onBack={store.back}
          />
        )}
      </main>

      {store.isGridOpen && <QuestionGrid />}

      {store.showSubmitModal && (
        <SubmitModal
          answeredCount={Object.keys(store.answers).length}
          totalCount={store.questions.length}
          flaggedCount={store.flagged.size}
          onConfirm={() => {
            store.setSubmitting(true);
            submitSession();
          }}
          onCancel={() => store.setSubmitModal(false)}
          isSubmitting={store.isSubmitting}
        />
      )}
      <NetworkStatus />
    </div>
  );
}
