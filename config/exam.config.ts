/**
 * exam.config.ts
 * ─────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for all exam parameters.
 * Import from here everywhere. Never hardcode these values.
 * ─────────────────────────────────────────────────────────────
 */

export const EXAM_CONFIG = {
  // ── Core exam parameters ──────────────────────────────────
  QUESTION_COUNT:        35,           // questions drawn per session
  TIME_LIMIT_SECONDS:    1500,         // 25 minutes × 60
  MARKS_PER_QUESTION:    2,
  MAX_SCORE:             70,           // 35 × 2
  QUESTION_BANK_SIZE:    200,          // per course
  TOTAL_COURSES:         9,
  QUESTION_TYPE:         'MCQ_SINGLE', // one correct answer only

  // ── Passing threshold (D1: CONFIRMED 40/70) ───────────────
  PASSING_SCORE:         40,           // 40/70 = 57.1%
  PASSING_PERCENTAGE:    57.14,

  // ── Timer colour thresholds (seconds remaining) ───────────
  TIMER_WARNING_AT:      300,          // T-5:00 → amber
  TIMER_DANGER_AT:       120,          // T-2:00 → red
  TIMER_FORCE_VISIBLE_AT: 300,         // forced visible at T-5:00

  // ── Server-side time enforcement ──────────────────────────
  // Submissions > GRACE seconds after started_at → HTTP 403
  SUBMISSION_GRACE_SECS: 10,

  // ── Autosave (D3: NO PAUSE — autosave is the only safety net)
  AUTOSAVE_DEBOUNCE_MS:  2000,         // 2s idle before API sync

  // ── Randomization (D2: STRATIFIED by module) ─────────────
  DRAW_MODE:             'STRATIFIED' as const,

  // ── Pause (D3: CONFIRMED — no pause) ─────────────────────
  PAUSE_ENABLED:         false,

  // ── Privacy jurisdiction (D5: NDPR — Nigeria) ────────────
  PRIVACY_JURISDICTION:  'NDPR',
  COOKIE_CONSENT:        true,         // required by NDPR
  DATA_RETENTION_DAYS:   365,          // 1 year; adjust to NDPR guidance
  ACCOUNT_DELETION_GRACE_DAYS: 30,

  // ── Auth token lifetimes ──────────────────────────────────
  ACCESS_TOKEN_EXPIRY_MINS:    60,
  REFRESH_TOKEN_REMEMBER_DAYS: 30,
  REFRESH_TOKEN_DEFAULT_DAYS:  7,
  AUTH_LOCKOUT_ATTEMPTS:       5,
  AUTH_LOCKOUT_WINDOW_MINS:    15,
  PASSWORD_RESET_EXPIRY_MINS:  60,

  // ── Security ──────────────────────────────────────────────
  TAB_SWITCH_WARNING_AT: 3,            // modal warning after N violations
  BCRYPT_ROUNDS:         12,
} as const;

export type DrawMode = typeof EXAM_CONFIG.DRAW_MODE;
