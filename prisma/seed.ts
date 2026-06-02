/**
 * prisma/seed.ts
 * ─────────────────────────────────────────────────────────────
 * Seeds the database with:
 *   1. 9 course rows
 *   2. 1,800 questions (200 per course) from parsed JSON files
 *
 * Run:  npx prisma db seed
 * Or:   npx ts-node prisma/seed.ts
 *
 * Place your parsed JSON files in: prisma/data/
 * (copy the *_questions.json files output by the parser)
 * ─────────────────────────────────────────────────────────────
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { COURSES } from '../config/courses';

const prisma = new PrismaClient();

interface QuestionRecord {
  id:             string;
  course_id:      string;
  course_name:    string;
  module_number:  number | null;
  module_name:    string;
  concept:        string;
  cognitive_level: string;
  stem:           string;
  option_a:       string;
  option_b:       string;
  option_c:       string;
  option_d:       string;
  correct_option: string;
  rationale:      string;
  source_ref:     string;
  image_url:      string | null;
}

async function main() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  CBT Simulator — Database Seed');
  console.log('═══════════════════════════════════════════════\n');

  // ── 1. Seed courses table ─────────────────────────────────
  console.log('Seeding courses...');
  for (const course of COURSES) {
    await prisma.course.upsert({
      where:  { id: course.id },
      update: { code: course.code, name: course.name, moduleCount: course.moduleCount },
      create: {
        id:            course.id,
        code:          course.code,
        name:          course.name,
        moduleCount:   course.moduleCount,
        questionCount: course.questionBank,
      },
    });
    console.log(`  ✅ ${course.code} — ${course.name}`);
  }

  // ── 2. Seed questions table ───────────────────────────────
  console.log('\nSeeding questions...');
  const DATA_DIR = join(__dirname, 'data');
  let grandTotal = 0;

  for (const course of COURSES) {
    const filePath = join(DATA_DIR, course.seedFile);
    let questions: QuestionRecord[];

    try {
      questions = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch (err) {
      console.error(`  ❌ Cannot read ${course.seedFile} — skipping (${err})`);
      continue;
    }

    let count = 0;
    for (const q of questions) {
      // Skip if any required field is empty
      if (!q.stem || !q.correct_option || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
        console.warn(`  ⚠  Skipping ${q.id}: missing required field`);
        continue;
      }

      await prisma.question.upsert({
        where:  { id: q.id },
        update: {
          moduleNumber:   q.module_number ?? 0,
          moduleName:     q.module_name,
          concept:        q.concept,
          cognitiveLevel: q.cognitive_level,
          stem:           q.stem,
          optionA:        q.option_a,
          optionB:        q.option_b,
          optionC:        q.option_c,
          optionD:        q.option_d,
          correctOption:  q.correct_option,
          rationale:      q.rationale || null,
          sourceRef:      q.source_ref || null,
          imageUrl:       q.image_url || null,
        },
        create: {
          id:             q.id,
          courseId:       q.course_id,
          moduleNumber:   q.module_number ?? 0,
          moduleName:     q.module_name,
          concept:        q.concept,
          cognitiveLevel: q.cognitive_level,
          stem:           q.stem,
          optionA:        q.option_a,
          optionB:        q.option_b,
          optionC:        q.option_c,
          optionD:        q.option_d,
          correctOption:  q.correct_option,
          rationale:      q.rationale || null,
          sourceRef:      q.source_ref || null,
          imageUrl:       q.image_url || null,
        },
      });
      count++;
    }

    const status = count === 200 ? '✅' : '⚠ ';
    console.log(`  ${status} ${course.code}: ${count} questions`);
    grandTotal += count;
  }

  // ── 3. Verification ───────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  Grand total: ${grandTotal} questions seeded`);
  console.log(`  Target:      1800 questions  ${grandTotal === 1800 ? '✅' : '❌'}`);

  console.log('\n  Verification query (GROUP BY course_id):');
  const counts = await prisma.$queryRaw<{ course_id: string; count: bigint }[]>`
    SELECT course_id, COUNT(*) as count
    FROM questions
    GROUP BY course_id
    ORDER BY course_id
  `;
  for (const row of counts) {
    const ok = Number(row.count) === 200 ? '✅' : '❌';
    console.log(`    ${row.course_id.padEnd(12)} | ${String(row.count).padStart(3)}  ${ok}`);
  }
  console.log('═══════════════════════════════════════════════\n');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
