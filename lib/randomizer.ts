/**
 * lib/randomizer.ts
 * ─────────────────────────────────────────────────────────────
 * Stratified question draw for CBT sessions.
 * Decision D2: STRATIFIED — draws proportionally from each module
 * so no session is dominated by one module.
 *
 * Also handles per-question option display order shuffling
 * (correct answer tracks through the shuffle).
 * ─────────────────────────────────────────────────────────────
 */

import crypto from 'crypto';
import { EXAM_CONFIG } from '../config/exam.config';

// ── Types ─────────────────────────────────────────────────────

export interface QuestionSlim {
  id:           string;
  moduleNumber: number;
  correctOption: string; // 'a'|'b'|'c'|'d'
}

/**
 * Per-question shuffled display order.
 * e.g. ['b','d','a','c'] means:
 *   display slot 0 (shown as "A") → DB option B
 *   display slot 1 (shown as "B") → DB option D
 *   display slot 2 (shown as "C") → DB option A
 *   display slot 3 (shown as "D") → DB option C
 */
export type OptionOrder = ['a'|'b'|'c'|'d', 'a'|'b'|'c'|'d', 'a'|'b'|'c'|'d', 'a'|'b'|'c'|'d'];

export interface SessionDraw {
  questionIds:    string[];             // 35 locked IDs in display order
  displayOrders:  Record<string, OptionOrder>; // per-question option shuffle
}

// ── Fisher-Yates shuffle (crypto-seeded) ─────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    // Use crypto for uniform distribution
    const j = crypto.randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Stratified draw ───────────────────────────────────────────

/**
 * Draw EXAM_CONFIG.QUESTION_COUNT (35) questions from a pool of 200,
 * distributed proportionally across modules.
 *
 * Algorithm:
 *   1. Group all 200 questions by module_number
 *   2. For each module, allocate slots proportional to its size
 *   3. Use largest-remainder method to hit exactly 35
 *   4. Fisher-Yates shuffle within each module, take allocated count
 *   5. Combine and shuffle the final 35
 */
export function drawStratified(allQuestions: QuestionSlim[]): string[] {
  const TARGET = EXAM_CONFIG.QUESTION_COUNT; // 35

  // Group by module
  const byModule = new Map<number, QuestionSlim[]>();
  for (const q of allQuestions) {
    const mod = q.moduleNumber ?? 0;
    if (!byModule.has(mod)) byModule.set(mod, []);
    byModule.get(mod)!.push(q);
  }

  const modules = [...byModule.entries()];
  const total   = allQuestions.length; // should be 200

  // ── Largest-remainder proportional allocation ─────────────
  const exact = modules.map(([mod, qs]) => ({
    mod,
    qs,
    exact:   (qs.length / total) * TARGET,
    floor:   Math.floor((qs.length / total) * TARGET),
    remainder: 0,
  }));

  for (const e of exact) e.remainder = e.exact - e.floor;

  let allocated = exact.reduce((s, e) => s + e.floor, 0);
  const deficit = TARGET - allocated;

  // Give remainder slots to modules with largest fractional parts
  exact
    .sort((a, b) => b.remainder - a.remainder)
    .slice(0, deficit)
    .forEach(e => e.floor++);

  // ── Draw from each module ─────────────────────────────────
  const drawn: string[] = [];
  for (const { mod, qs, floor: count } of exact) {
    if (count === 0) continue;
    const shuffled = shuffleArray(qs);
    drawn.push(...shuffled.slice(0, count).map(q => q.id));
  }

  // ── Final shuffle of the 35 drawn questions ───────────────
  return shuffleArray(drawn);
}

// ── Option order shuffle ──────────────────────────────────────

/**
 * For each of the 35 question IDs, produce a shuffled display
 * order for options A–D. This prevents correct answer positions
 * being predictable across sessions.
 *
 * The correctOption field in the DB is fixed ('a'–'d').
 * The display order determines what the user sees at each slot.
 *
 * Stored in session.displayOrders as:
 *   { [questionId]: ['b','d','a','c'] }
 */
export function buildDisplayOrders(
  questionIds: string[],
): Record<string, OptionOrder> {
  const orders: Record<string, OptionOrder> = {};
  const base: OptionOrder = ['a','b','c','d'];
  for (const id of questionIds) {
    orders[id] = shuffleArray([...base]) as OptionOrder;
  }
  return orders;
}

/**
 * Resolve the correct display-slot letter from a stored display order.
 *
 * Example:
 *   displayOrder = ['b','d','a','c']
 *   correctOption = 'a' (stored in DB)
 *   → 'a' appears at index 2 of the display order
 *   → display slot index 2 = shown as "C" to user
 *   → correctDisplayLetter = 'c'
 *
 * Used server-side during scoring to match user's submitted answer
 * (which references the display slot) against the DB correctOption.
 */
export function resolveCorrectDisplayLetter(
  displayOrder: OptionOrder,
  correctOption: string,
): string {
  const idx = displayOrder.indexOf(correctOption as 'a'|'b'|'c'|'d');
  return ['a','b','c','d'][idx];
}

// ── Full session draw ─────────────────────────────────────────

/**
 * Master function: given all 200 questions for a course,
 * returns the complete session draw — 35 locked IDs + display orders.
 */
export function createSessionDraw(allQuestions: QuestionSlim[]): SessionDraw {
  const questionIds   = drawStratified(allQuestions);
  const displayOrders = buildDisplayOrders(questionIds);
  return { questionIds, displayOrders };
}
