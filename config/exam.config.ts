// config/exam.config.ts
// Single source of truth for all exam parameters

export const EXAM_CONFIG = {
  QUESTION_COUNT:          35,
  TIME_LIMIT_SECONDS:      1500,      // 25 minutes
  MARKS_PER_QUESTION:      2,
  MAX_SCORE:               70,
  QUESTION_BANK_SIZE:      200,
  TOTAL_COURSES:           9,
  PASSING_SCORE:           40,        // D1: 40/70 = 57%
  PASSING_PERCENTAGE:      57.14,
  TIMER_WARNING_AT:        300,       // amber at T-5:00
  TIMER_DANGER_AT:         120,       // red at T-2:00
  TIMER_FORCE_VISIBLE_AT:  300,
  SUBMISSION_GRACE_SECS:   10,
  AUTOSAVE_DEBOUNCE_MS:    2000,
  DRAW_MODE:               "STRATIFIED" as const,
  PAUSE_ENABLED:           false,
  PRIVACY_JURISDICTION:    "NDPR",
  COOKIE_CONSENT:          true,
  DATA_RETENTION_DAYS:     365,
  ACCOUNT_DELETION_GRACE_DAYS: 30,
  ACCESS_TOKEN_EXPIRY_MINS:    60,
  REFRESH_TOKEN_REMEMBER_DAYS: 30,
  REFRESH_TOKEN_DEFAULT_DAYS:  7,
  AUTH_LOCKOUT_ATTEMPTS:       5,
  AUTH_LOCKOUT_WINDOW_MINS:    15,
  PASSWORD_RESET_EXPIRY_MINS:  60,
  TAB_SWITCH_WARNING_AT:       3,
  BCRYPT_ROUNDS:               12,
} as const;
