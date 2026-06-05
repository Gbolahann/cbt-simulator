"use client";
// src/hooks/useSecurityMonitor.ts
// Detects tab switches, visibility changes, fullscreen exits.
// Logs each violation to the session audit log and shows a warning modal.

import { useEffect, useRef } from "react";
import { useExamStore } from "@/store/examStore";
import { EXAM_CONFIG } from "../../config/exam.config";

export function useSecurityMonitor(sessionId: string) {
  const { addViolation, violationCount } = useExamStore();
  const warningShownRef = useRef(false);

  async function logViolation(type: string) {
    addViolation();
    await fetch(`/api/sessions/${sessionId}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        timestamp: new Date().toISOString(),
        violationCount: violationCount + 1,
      }),
    });
    if (
      violationCount + 1 >= EXAM_CONFIG.TAB_SWITCH_WARNING_AT &&
      !warningShownRef.current
    ) {
      warningShownRef.current = true;
      alert(
        `⚠ Warning: You have left the exam window ${EXAM_CONFIG.TAB_SWITCH_WARNING_AT} times.\nYour session activity is being recorded.`,
      );
    }
  }

  // Tab visibility detection
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "hidden") {
        logViolation("tab_switch");
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [violationCount]);

  // Prevent right-click
  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // Prevent text selection via CSS
  useEffect(() => {
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    return () => {
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    };
  }, []);

  // Request fullscreen on desktop
  useEffect(() => {
    const tryFullscreen = async () => {
      if (
        window.innerWidth >= 1024 &&
        document.documentElement.requestFullscreen
      ) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    tryFullscreen();

    const handleFullscreenExit = () => {
      if (!document.fullscreenElement && window.innerWidth >= 1024) {
        logViolation("fullscreen_exit");
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenExit);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenExit);
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [violationCount]);
}
