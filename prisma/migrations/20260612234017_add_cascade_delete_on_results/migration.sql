-- DropForeignKey
ALTER TABLE "session_question_results" DROP CONSTRAINT "session_question_results_session_id_fkey";

-- AddForeignKey
ALTER TABLE "session_question_results" ADD CONSTRAINT "session_question_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
