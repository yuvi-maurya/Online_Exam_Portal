-- AlterTable
ALTER TABLE "Exam"
DROP CONSTRAINT IF EXISTS "Exam_totalMarks_positive",
DROP CONSTRAINT IF EXISTS "Exam_passingMarks_valid",
DROP CONSTRAINT IF EXISTS "Exam_time_window_valid",
ALTER COLUMN "totalMarks" SET DEFAULT 0,
ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL;

ALTER TABLE "Exam"
ADD CONSTRAINT "Exam_totalMarks_nonnegative" CHECK ("totalMarks" >= 0),
ADD CONSTRAINT "Exam_passingMarks_valid" CHECK (
  "passingMarks" >= 0
  AND ("status" = 'DRAFT' OR "passingMarks" <= "totalMarks")
),
ADD CONSTRAINT "Exam_time_window_valid" CHECK (
  ("startTime" IS NULL AND "endTime" IS NULL)
  OR (
    "startTime" IS NOT NULL
    AND "endTime" IS NOT NULL
    AND "endTime" > "startTime"
  )
);

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "correctAnswerText" TEXT;

-- AlterTable
ALTER TABLE "QuestionOption" ADD COLUMN "order" INTEGER;

WITH "RankedQuestionOptions" AS (
  SELECT
    "id",
    (ROW_NUMBER() OVER (PARTITION BY "questionId" ORDER BY "id") - 1)::INTEGER AS "optionOrder"
  FROM "QuestionOption"
)
UPDATE "QuestionOption"
SET "order" = "RankedQuestionOptions"."optionOrder"
FROM "RankedQuestionOptions"
WHERE "QuestionOption"."id" = "RankedQuestionOptions"."id";

ALTER TABLE "QuestionOption"
ALTER COLUMN "order" SET NOT NULL,
ADD CONSTRAINT "QuestionOption_order_nonnegative" CHECK ("order" >= 0);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOption_questionId_order_key" ON "QuestionOption"("questionId", "order");
