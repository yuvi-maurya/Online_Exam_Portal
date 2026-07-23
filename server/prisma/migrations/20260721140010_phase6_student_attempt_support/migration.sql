DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ExamAttempt"
    GROUP BY "examId", "studentId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce one attempt per student and exam while duplicate attempts exist';
  END IF;
END $$;

-- AlterTable
ALTER TABLE "ExamAttempt"
ADD COLUMN "timeTakenSeconds" INTEGER,
ADD CONSTRAINT "ExamAttempt_timeTakenSeconds_nonnegative"
CHECK ("timeTakenSeconds" IS NULL OR "timeTakenSeconds" >= 0);

UPDATE "ExamAttempt"
SET "timeTakenSeconds" = LEAST(
  2147483647,
  GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ("submittedAt" - "startedAt")))::BIGINT)
)::INTEGER
WHERE "submittedAt" IS NOT NULL;

-- CreateTable
CREATE TABLE "AttemptQuestion" (
  "attemptId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,

  CONSTRAINT "AttemptQuestion_order_nonnegative" CHECK ("order" >= 0),
  CONSTRAINT "AttemptQuestion_pkey" PRIMARY KEY ("attemptId", "questionId")
);

-- CreateTable
CREATE TABLE "AttemptQuestionOption" (
  "attemptId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "optionId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,

  CONSTRAINT "AttemptQuestionOption_order_nonnegative" CHECK ("order" >= 0),
  CONSTRAINT "AttemptQuestionOption_pkey" PRIMARY KEY ("attemptId", "questionId", "optionId")
);

-- Backfill stable canonical presentation order for any pre-Phase-6 attempts.
INSERT INTO "AttemptQuestion" ("attemptId", "questionId", "order")
SELECT "ExamAttempt"."id", "ExamQuestion"."questionId", "ExamQuestion"."order"
FROM "ExamAttempt"
INNER JOIN "ExamQuestion" ON "ExamQuestion"."examId" = "ExamAttempt"."examId";

INSERT INTO "AttemptQuestionOption" ("attemptId", "questionId", "optionId", "order")
SELECT
  "AttemptQuestion"."attemptId",
  "AttemptQuestion"."questionId",
  "QuestionOption"."id",
  "QuestionOption"."order"
FROM "AttemptQuestion"
INNER JOIN "QuestionOption" ON "QuestionOption"."questionId" = "AttemptQuestion"."questionId";

-- CreateIndex
CREATE INDEX "AttemptQuestion_questionId_idx" ON "AttemptQuestion"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptQuestion_attemptId_order_key" ON "AttemptQuestion"("attemptId", "order");

-- CreateIndex
CREATE INDEX "AttemptQuestionOption_optionId_idx" ON "AttemptQuestionOption"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptQuestionOption_attemptId_questionId_order_key"
ON "AttemptQuestionOption"("attemptId", "questionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttempt_examId_studentId_key" ON "ExamAttempt"("examId", "studentId");

-- AddForeignKey
ALTER TABLE "AttemptQuestion"
ADD CONSTRAINT "AttemptQuestion_attemptId_fkey"
FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptQuestion"
ADD CONSTRAINT "AttemptQuestion_questionId_fkey"
FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptQuestionOption"
ADD CONSTRAINT "AttemptQuestionOption_attemptId_questionId_fkey"
FOREIGN KEY ("attemptId", "questionId")
REFERENCES "AttemptQuestion"("attemptId", "questionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptQuestionOption"
ADD CONSTRAINT "AttemptQuestionOption_optionId_fkey"
FOREIGN KEY ("optionId") REFERENCES "QuestionOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
