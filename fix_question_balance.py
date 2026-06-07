#!/usr/bin/env python3
"""
fix_question_balance.py
═══════════════════════════════════════════════════════════════════
CBT Simulator — MCQ Length Bias Fixer
Supports: Google Gemini (FREE) · Groq (FREE) · Anthropic (paid)
═══════════════════════════════════════════════════════════════════

FREE SETUP — PICK ONE:

  OPTION 1 — Google Gemini (recommended):
  ─────────────────────────────────────────
  1. Go to https://aistudio.google.com
  2. Sign in with any Google account
  3. Click "Get API key" → "Create API key"
  4. Copy the key (starts with AIza...)
  5. Run:
     python fix_question_balance.py --provider gemini --api-key AIza...

  OPTION 2 — Groq (fastest):
  ─────────────────────────────────────────
  1. Go to https://console.groq.com
  2. Sign up free (no credit card)
  3. Click "API Keys" → "Create API Key"
  4. Copy the key (starts with gsk_...)
  5. Run:
     python fix_question_balance.py --provider groq --api-key gsk_...

INSTALL REQUIREMENTS:
  pip install requests

USAGE:
  # Dry run first — see which questions are flagged, no API calls:
  python fix_question_balance.py --dry-run

  # Run with Gemini (free):
  python fix_question_balance.py --provider gemini --api-key YOUR_KEY

  # Run with Groq (free):
  python fix_question_balance.py --provider groq --api-key YOUR_KEY

  # Fix one course only (test before doing all 9):
  python fix_question_balance.py --provider gemini --api-key KEY --course psy202

OUTPUT:
  Corrected files → prisma/data-fixed/
  Re-seed DB with: npx prisma db seed
═══════════════════════════════════════════════════════════════════
"""

import json
import os
import sys
import time
import argparse
import requests
from pathlib import Path

# ─────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────

LENGTH_IMBALANCE_THRESHOLD = 0.35   # flag if correct is 35%+ longer
RAW_GAP_THRESHOLD          = 55     # or 55+ char gap between options
BATCH_SIZE                 = 5      # questions per API call (speeds things up)

INPUT_DIR  = Path("./prisma/data")
OUTPUT_DIR = Path("./prisma/data-fixed")

COURSE_FILES = [
    "psy202_questions.json", "psy204_questions.json",
    "psy206_questions.json", "psy208_questions.json",
    "psy262_questions.json", "psy264_questions.json",
    "ssc202_questions.json", "gst112_questions.json",
    "gst212_questions.json",
]

# ─────────────────────────────────────────────────────────────────
# PROVIDER CONFIGS
# ─────────────────────────────────────────────────────────────────

PROVIDERS = {
    "gemini": {
        "name":    "Google Gemini 2.0 Flash (FREE)",
        "rpm":     14,      # stay under 15 RPM free limit
        "url":     "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    },
    "groq": {
        "name":    "Groq Llama 3.3 70B (FREE)",
        "rpm":     28,      # stay under 30 RPM free limit
        "url":     "https://api.groq.com/openai/v1/chat/completions",
        "model":   "llama-3.3-70b-versatile",
    },
    "anthropic": {
        "name":    "Anthropic Claude Sonnet (paid)",
        "rpm":     45,
        "url":     "https://api.anthropic.com/v1/messages",
        "model":   "claude-sonnet-4-20250514",
    },
}

# ─────────────────────────────────────────────────────────────────
# ANALYSIS
# ─────────────────────────────────────────────────────────────────

def get_imbalance(q):
    correct = q.get("correct_option","").lower()
    if correct not in ("a","b","c","d"):
        return 0.0, 0
    lens = {k: len(q.get(f"option_{k}","")) for k in "abcd"}
    dist_avg = sum(v for k,v in lens.items() if k != correct) / 3
    imbalance = (lens[correct] - dist_avg) / dist_avg if dist_avg else 0
    raw_gap   = max(lens.values()) - min(lens.values())
    return imbalance, raw_gap

def needs_fix(q):
    imb, gap = get_imbalance(q)
    return imb >= LENGTH_IMBALANCE_THRESHOLD or gap >= RAW_GAP_THRESHOLD

def analyse_all(files):
    results = []
    for fname in files:
        path = INPUT_DIR / fname
        if not path.exists():
            continue
        questions = json.loads(path.read_text(encoding="utf-8"))
        flagged   = [q for q in questions if needs_fix(q)]
        worst     = max((get_imbalance(q)[0] for q in questions), default=0)
        results.append({
            "file": fname, "questions": questions,
            "flagged": flagged, "total": len(questions), "worst": worst,
        })
    return results

def print_report(results):
    total = flagged = 0
    print("\n" + "═"*66)
    print("  MCQ LENGTH BIAS REPORT")
    print("─"*66)
    print(f"  {'File':<32} {'Total':>5} {'Flagged':>8} {'%':>6}  Worst")
    print("─"*66)
    for r in results:
        n, f = r["total"], len(r["flagged"])
        print(f"  {r['file']:<32} {n:>5} {f:>8} {f/n*100:>5.1f}%  +{r['worst']*100:.0f}%")
        total += n; flagged += f
    print("─"*66)
    print(f"  {'TOTAL':<32} {total:>5} {flagged:>8} {flagged/total*100:>5.1f}%")
    print("═"*66)

# ─────────────────────────────────────────────────────────────────
# PROMPT
# ─────────────────────────────────────────────────────────────────

def make_prompt(batch):
    questions_text = ""
    for i, q in enumerate(batch):
        questions_text += f"""
QUESTION {i+1} (ID: {q['id']}, correct={q['correct_option'].upper()}):
Stem: {q['stem'][:200]}
A ({len(q['option_a'])}ch): {q['option_a']}
B ({len(q['option_b'])}ch): {q['option_b']}
C ({len(q['option_c'])}ch): {q['option_c']}
D ({len(q['option_d'])}ch): {q['option_d']}
"""

    return f"""You are an expert MCQ editor for Nigerian university examinations.

Rebalance these {len(batch)} questions so all four options (A/B/C/D) are approximately the same length. Follow these rules strictly:

RULES:
1. Do NOT change which answer is correct (shown above each question)
2. All four options should be within 15 characters of each other in length
3. Keep options grammatically parallel
4. Preserve key terminology and concepts — just trim or expand wording
5. Distractors must remain plausible but incorrect
6. No "all of the above" or "none of the above"
7. University level (PSY/GST/SSC 200-level)

{questions_text}

Respond ONLY with a JSON array — no explanation, no markdown fences:
[
  {{"id": "q_id_1", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "..."}},
  {{"id": "q_id_2", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "..."}}
]"""

# ─────────────────────────────────────────────────────────────────
# API CALLERS
# ─────────────────────────────────────────────────────────────────

def call_gemini(api_key, prompt):
    url = PROVIDERS["gemini"]["url"] + f"?key={api_key}"
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2048}}
    r = requests.post(url, json=body, timeout=60)
    r.raise_for_status()
    return r.json()["candidates"][0]["content"]["parts"][0]["text"]

def call_groq(api_key, prompt):
    url = PROVIDERS["groq"]["url"]
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    body = {"model": PROVIDERS["groq"]["model"],
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3, "max_tokens": 2048}
    r = requests.post(url, headers=headers, json=body, timeout=60)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]

def call_anthropic(api_key, prompt):
    url = PROVIDERS["anthropic"]["url"]
    headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01",
               "content-type": "application/json"}
    body = {"model": PROVIDERS["anthropic"]["model"], "max_tokens": 2048,
            "messages": [{"role": "user", "content": prompt}]}
    r = requests.post(url, headers=headers, json=body, timeout=60)
    r.raise_for_status()
    return r.json()["content"][0]["text"]

CALLERS = {"gemini": call_gemini, "groq": call_groq, "anthropic": call_anthropic}

def parse_response(text):
    text = text.strip()
    # Strip markdown fences
    if "```" in text:
        parts = text.split("```")
        for p in parts:
            p = p.strip()
            if p.startswith("json"): p = p[4:].strip()
            if p.startswith("["):
                text = p; break
    # Find JSON array
    start = text.find("[")
    end   = text.rfind("]") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON array found in response")
    return json.loads(text[start:end])

# ─────────────────────────────────────────────────────────────────
# MAIN PROCESSING
# ─────────────────────────────────────────────────────────────────

def process_batch(caller, api_key, batch, retries=3):
    prompt = make_prompt(batch)
    for attempt in range(retries):
        try:
            text   = caller(api_key, prompt)
            parsed = parse_response(text)
            # Build id → options map
            result = {item["id"]: item for item in parsed}
            return result
        except Exception as e:
            print(f"      ⚠  Attempt {attempt+1} failed: {str(e)[:60]}")
            time.sleep(3 * (attempt + 1))
    return {}

def fix_course(caller, api_key, result, rpm, output_dir):
    questions    = result["questions"]
    flagged_qs   = result["flagged"]
    delay        = 60 / rpm  # seconds between calls

    # Build lookup for flagged questions
    flagged_ids = {q["id"] for q in flagged_qs}

    # Process flagged questions in batches
    fixed_map  = {}
    total_batches = (len(flagged_qs) + BATCH_SIZE - 1) // BATCH_SIZE
    failed_ids = set()

    print(f"    {len(flagged_qs)} questions → {total_batches} batches of {BATCH_SIZE}...")

    for i in range(0, len(flagged_qs), BATCH_SIZE):
        batch     = flagged_qs[i : i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        print(f"    Batch {batch_num:>3}/{total_batches} ", end="", flush=True)

        result_map = process_batch(caller, api_key, batch)

        fixed = 0
        for q in batch:
            if q["id"] in result_map:
                fixed_map[q["id"]] = result_map[q["id"]]
                fixed += 1
            else:
                failed_ids.add(q["id"])

        print(f"✓ {fixed}/{len(batch)}")
        time.sleep(delay)

    # Apply fixes to the question list
    updated = []
    n_fixed = n_failed = n_skipped = 0
    for q in questions:
        if q["id"] not in flagged_ids:
            updated.append(q)
            n_skipped += 1
        elif q["id"] in fixed_map:
            fix = fixed_map[q["id"]]
            updated.append({**q,
                "option_a": fix.get("option_a", q["option_a"]),
                "option_b": fix.get("option_b", q["option_b"]),
                "option_c": fix.get("option_c", q["option_c"]),
                "option_d": fix.get("option_d", q["option_d"]),
            })
            n_fixed += 1
        else:
            updated.append(q)
            n_failed += 1

    # Write output
    out_path = output_dir / result["file"]
    out_path.write_text(json.dumps(updated, ensure_ascii=False, indent=2),
                        encoding="utf-8")

    return n_fixed, n_failed, n_skipped

# ─────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--provider", choices=["gemini","groq","anthropic"],
                        default="gemini")
    parser.add_argument("--api-key", type=str)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--course",  type=str,
                        help="e.g. psy202 — test one course first")
    args = parser.parse_args()

    files = COURSE_FILES
    if args.course:
        files = [f for f in COURSE_FILES if args.course in f]
        if not files:
            print(f"No file found for course '{args.course}'"); sys.exit(1)

    if not INPUT_DIR.exists():
        print(f"❌ Cannot find {INPUT_DIR}")
        print("   Run this script from your project root (where package.json is)")
        sys.exit(1)

    print("\nLoading and analysing question banks...")
    results = analyse_all(files)
    if not results:
        print("No files found."); sys.exit(1)

    print_report(results)

    total_flagged = sum(len(r["flagged"]) for r in results)

    if args.dry_run:
        cfg = PROVIDERS[args.provider]
        rpm = cfg["rpm"]
        est_calls = (total_flagged + BATCH_SIZE - 1) // BATCH_SIZE
        est_mins  = round(est_calls / rpm + (est_calls * 1.5 / 60), 0)
        print(f"\n  Provider : {cfg['name']}")
        print(f"  Questions to fix  : {total_flagged}")
        print(f"  API calls needed  : {est_calls} (batches of {BATCH_SIZE})")
        print(f"  Estimated runtime : ~{est_mins:.0f} minutes")
        print(f"\n  Run without --dry-run to apply fixes.\n")
        return

    api_key = args.api_key or os.environ.get("ANTHROPIC_API_KEY") or \
              os.environ.get("GEMINI_API_KEY") or os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("❌ No API key. Use --api-key YOUR_KEY"); sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    caller = CALLERS[args.provider]
    rpm    = PROVIDERS[args.provider]["rpm"]
    cfg_name = PROVIDERS[args.provider]["name"]

    print(f"\n  Provider : {cfg_name}")
    print(f"  Total fixes needed : {total_flagged}")
    print(f"  Output → {OUTPUT_DIR.resolve()}\n")
    print("═"*66)

    grand_fixed = grand_failed = grand_skipped = 0

    for r in results:
        if not r["flagged"]:
            # No issues — just copy file
            out = OUTPUT_DIR / r["file"]
            out.write_text(json.dumps(r["questions"], ensure_ascii=False, indent=2),
                           encoding="utf-8")
            print(f"\n  {r['file']} — clean, copied unchanged")
            grand_skipped += r["total"]
            continue

        print(f"\n  {r['file']} ({len(r['flagged'])} flagged)")
        fixed, failed, skipped = fix_course(caller, api_key, r, rpm, OUTPUT_DIR)
        grand_fixed   += fixed
        grand_failed  += failed
        grand_skipped += skipped
        print(f"    ✅ Fixed: {fixed}  ❌ Failed: {failed}  — Skipped: {skipped}")

    print("\n" + "═"*66)
    print("  COMPLETE")
    print(f"  Fixed   : {grand_fixed}")
    print(f"  Failed  : {grand_failed}  (originals kept)")
    print(f"  Skipped : {grand_skipped}  (no fix needed)")
    print(f"\n  Corrected files → {OUTPUT_DIR.resolve()}")
    print("\n  NEXT STEPS:")
    print("  1. Check a few questions in prisma/data-fixed/ to verify quality")
    print("  2. Replace prisma/data/ with prisma/data-fixed/")
    print("  3. Re-seed: npx prisma db seed")
    print("  4. Restart dev server: npm run dev\n")
    print("═"*66)

if __name__ == "__main__":
    main()
