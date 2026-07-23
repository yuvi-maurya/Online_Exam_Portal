-- CreateEnum
CREATE TYPE "AttemptResult" AS ENUM ('PASS', 'FAIL');

-- AlterTable
ALTER TABLE "ExamAttempt" ADD COLUMN     "evaluatedAt" TIMESTAMP(3),
ADD COLUMN     "result" "AttemptResult",
ADD CONSTRAINT "ExamAttempt_score_nonnegative" CHECK ("score" IS NULL OR "score" >= 0);

UPDATE "ExamAttempt"
SET
  "evaluatedAt" = COALESCE("ExamAttempt"."submittedAt", "ExamAttempt"."createdAt"),
  "result" = CASE
    WHEN "ExamAttempt"."score" >= "Exam"."passingMarks" THEN 'PASS'::"AttemptResult"
    ELSE 'FAIL'::"AttemptResult"
  END
FROM "Exam"
WHERE
  "ExamAttempt"."examId" = "Exam"."id"
  AND "ExamAttempt"."status" = 'EVALUATED'
  AND "ExamAttempt"."score" IS NOT NULL;

-- AlterTable
ALTER TABLE "StudentAnswer"
ADD COLUMN "needsManualReview" BOOLEAN NOT NULL DEFAULT false,
ADD CONSTRAINT "StudentAnswer_marksAwarded_nonnegative"
CHECK ("marksAwarded" IS NULL OR "marksAwarded" >= 0);

-- CreateIndex
CREATE INDEX "ExamAttempt_examId_status_score_submittedAt_idx" ON "ExamAttempt"("examId", "status", "score", "submittedAt");

-- CreateIndex
CREATE INDEX "StudentAnswer_attemptId_needsManualReview_idx" ON "StudentAnswer"("attemptId", "needsManualReview");
