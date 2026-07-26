-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN "certificateCode" TEXT;

-- Preserve any certificates issued before verification codes were introduced.
WITH "legacyCertificates" AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "id") AS "sequence"
  FROM "Certificate"
)
UPDATE "Certificate" AS "certificate"
SET "certificateCode" = 'LEGACY' || LPAD("legacy"."sequence"::TEXT, 14, '0')
FROM "legacyCertificates" AS "legacy"
WHERE "certificate"."id" = "legacy"."id";

ALTER TABLE "Certificate" ALTER COLUMN "certificateCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateCode_key" ON "Certificate"("certificateCode");
