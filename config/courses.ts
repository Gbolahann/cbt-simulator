/**
 * courses.ts
 * ─────────────────────────────────────────────────────────────
 * Course registry — single source of truth for all 9 courses.
 * Course IDs here must match the course_id values in the
 * questions table exactly.
 * ─────────────────────────────────────────────────────────────
 */

export interface Course {
  id:           string;   // matches course_id in questions table
  code:         string;   // display code e.g. "PSY 202"
  name:         string;   // full display name
  moduleCount:  number;   // total modules in this course
  questionBank: number;   // always 200
  seedFile:     string;   // filename of per-course JSON (from parser output)
}

export const COURSES: Course[] = [
  {
    id:           'psy202',
    code:         'PSY 202',
    name:         'Physiological Psychology',
    moduleCount:  12,
    questionBank: 200,
    seedFile:     'psy202_questions.json',
  },
  {
    id:           'psy204',
    code:         'PSY 204',
    name:         'Social Psychology',
    moduleCount:  5,
    questionBank: 200,
    seedFile:     'psy204_questions.json',
  },
  {
    id:           'psy206',
    code:         'PSY 206',
    name:         'Developmental Psychology II (Adulthood and Aging)',
    moduleCount:  5,
    questionBank: 200,
    seedFile:     'psy206_questions.json',
  },
  {
    id:           'psy208',
    code:         'PSY 208',
    name:         'Positive Psychology',
    moduleCount:  6,
    questionBank: 200,
    seedFile:     'psy208_questions.json',
  },
  {
    id:           'psy262',
    code:         'OOU-PSY 262',
    name:         'Psychology of Individual Differences',
    moduleCount:  10,
    questionBank: 200,
    seedFile:     'psy262_questions.json',
  },
  {
    id:           'psy264',
    code:         'OOU-PSY 264',
    name:         'Abnormal Psychology',
    moduleCount:  8,
    questionBank: 200,
    seedFile:     'psy264_questions.json',
  },
  {
    id:           'ssc202',
    code:         'SSC 202',
    name:         'Introduction to Computer and Its Application',
    moduleCount:  6,
    questionBank: 200,
    seedFile:     'ssc202_questions.json',
  },
  {
    id:           'gst112',
    code:         'GST 112',
    name:         'Nigerian People and Culture',
    moduleCount:  8,
    questionBank: 200,
    seedFile:     'gst112_questions.json',
  },
  {
    id:           'gst212',
    code:         'GST 212',
    name:         'Philosophy, Logic and Human Existence',
    moduleCount:  5,
    questionBank: 200,
    seedFile:     'gst212_questions.json',
  },
];

/** Look up a course by its ID. Throws if not found. */
export function getCourse(id: string): Course {
  const course = COURSES.find(c => c.id === id);
  if (!course) throw new Error(`Unknown course_id: "${id}"`);
  return course;
}

/** All valid course IDs as a string union type. */
export type CourseId = typeof COURSES[number]['id'];
