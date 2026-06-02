-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'SUBMITTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module_count" INTEGER NOT NULL,
    "question_count" INTEGER NOT NULL DEFAULT 200,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "module_number" INTEGER NOT NULL,
    "module_name" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "cognitive_level" TEXT NOT NULL,
    "stem" TEXT NOT NULL,
    "option_a" TEXT NOT NULL,
    "option_b" TEXT NOT NULL,
    "option_c" TEXT NOT NULL,
    "option_d" TEXT NOT NULL,
    "correct_option" CHAR(1) NOT NULL,
    "rationale" TEXT,
    "source_ref" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "course_id" TEXT NOT NULL,
    "question_ids" TEXT[],
    "display_orders" JSONB NOT NULL DEFAULT '{}',
    "answers" JSONB NOT NULL DEFAULT '{}',
    "flagged" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "score" INTEGER,
    "percentage" DECIMAL(5,2),
    "passed" BOOLEAN,
    "time_used_secs" INTEGER,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ,
    "audit_log" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_question_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_option" CHAR(1),
    "is_correct" BOOLEAN NOT NULL,
    "time_spent_secs" INTEGER,
    "module_number" INTEGER NOT NULL,
    "cognitive_level" TEXT NOT NULL,

    CONSTRAINT "session_question_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "questions_course_id_idx" ON "questions"("course_id");

-- CreateIndex
CREATE INDEX "questions_course_id_module_number_idx" ON "questions"("course_id", "module_number");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_course_id_idx" ON "sessions"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "session_question_results_session_id_idx" ON "session_question_results"("session_id");

-- CreateIndex
CREATE INDEX "session_question_results_question_id_idx" ON "session_question_results"("question_id");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_question_results" ADD CONSTRAINT "session_question_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_question_results" ADD CONSTRAINT "session_question_results_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
