/**
 * types/index.ts
 * ─────────────────────────────────────────────────────────────
 * Shared TypeScript types for CBT Simulator.
 * These mirror the DB schema but represent API shapes —
 * NOTE: cognitive_level and correct_option are deliberately
 * absent from all client-facing types.
 * ─────────────────────────────────────────────────────────────
 */

import type { OptionOrder } from '../lib/randomizer';

// ── Course ────────────────────────────────────────────────────

export interface CourseCard {
  id:            string;
  code:          string;
  name:          string;
  moduleCount:   number;
  questionCount: number;
  // Populated from user's session history
  attemptCount:  number;
  bestScore:     number | null;
  bestPct:       number | null;
  lastAttemptAt: string | null;
}

// ── Question (client-facing — NO correct_option, NO cognitive_level) ──

export interface QuestionForExam {
  id:       string;
  stem:     string;
  options:  ExamOption[];  // already in shuffled display order
}

export interface ExamOption {
  slot:   'a' | 'b' | 'c' | 'd';  // display slot (A/B/C/D shown to user)
  dbKey:  never;                   // intentionally hidden from client
  text:   string;
}

// Simpler version returned from the API — no dbKey at all
export interface ExamOptionPublic {
  slot: 'a' | 'b' | 'c' | 'd';
  text: string;
}

export interface QuestionPublic {
  id:      string;
  stem:    string;
  options: ExamOptionPublic[];
}

// ── Session ───────────────────────────────────────────────────

export type SessionStatus = 'ACTIVE' | 'SUBMITTED' | 'EXPIRED';

export interface SessionState {
  id:              string;
  courseId:        string;
  courseName:      string;
  questionIds:     string[];           // 35 IDs in order
  answers:         Record<string, string>; // { questionId: displaySlot }
  flagged:         string[];
  status:          SessionStatus;
  startedAt:       string;             // ISO UTC
  timeRemainingMs: number;             // calculated server-side
}

// ── Scoring & Results ─────────────────────────────────────────

export interface ScoreReport {
  sessionId:      string;
  courseId:       string;
  courseName:     string;
  score:          number;              // raw score (correct × 2)
  maxScore:       number;              // always 70
  percentage:     number;
  passed:         boolean;
  passingScore:   number;              // always 40
  timeUsedSecs:   number;
  submittedAt:    string;
  moduleBreakdown: ModuleResult[];
  attemptHistory:  AttemptSummary[];   // last 5 sessions
}

export interface ModuleResult {
  moduleNumber: number;
  moduleName:   string;
  correct:      number;
  total:        number;
  percentage:   number;
}

export interface AttemptSummary {
  sessionId:    string;
  score:        number;
  percentage:   number;
  passed:       boolean;
  timeUsedSecs: number;
  submittedAt:  string;
}

// ── Review ────────────────────────────────────────────────────

export type ReviewFilter = 'all' | 'incorrect' | 'flagged' | 'unanswered';

export interface ReviewQuestion {
  id:             string;
  index:          number;             // 1-based position in session
  stem:           string;
  options:        ExamOptionPublic[]; // in the shuffled display order from session
  userAnswer:     string | null;      // display slot user selected, or null
  correctAnswer:  string;             // display slot of correct answer (resolved)
  isCorrect:      boolean;
  isFlagged:      boolean;
  rationale:      string | null;
  sourceRef:      string | null;
  // NOTE: cognitive_level is intentionally NOT in this type
}

// ── Audit log events ──────────────────────────────────────────

export type AuditEventType =
  | 'session_created'
  | 'question_viewed'
  | 'answer_selected'
  | 'answer_changed'
  | 'tab_switch'
  | 'fullscreen_exit'
  | 'session_submitted'
  | 'time_expired';

export interface AuditEvent {
  type:      AuditEventType;
  timestamp: string;          // ISO UTC
  [key: string]: unknown;     // event-specific payload
}

// ── API response envelope ─────────────────────────────────────

export interface ApiSuccess<T> {
  ok:   true;
  data: T;
}

export interface ApiError {
  ok:      false;
  error:   string;
  code?:   string;    // e.g. 'SESSION_EXPIRED', 'SUBMISSION_TOO_LATE'
  status?: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
