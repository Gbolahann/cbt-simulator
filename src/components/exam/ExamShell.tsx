// src/components/exam/ExamShell.tsx
// Client-only SPA shell. Loads session, runs timer, handles autosave.

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
    if (res.ok) {
      router.replace(`/results/${sessionId}`);
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
      .then((data) => {
        if (!data) return;
        if (data.status === "SUBMITTED") {
          router.replace(`/results/${sessionId}`);
          return;
        }
        store.initSession(data);
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
    </div>
  );
}
