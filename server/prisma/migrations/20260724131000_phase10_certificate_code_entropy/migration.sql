-- Replace temporary migration backfill values with non-enumerable verification codes.
UPDATE "Certificate"
SET "certificateCode" = UPPER(
  SUBSTRING(
    MD5('exam-portal-certificate-code:' || "id")
    FROM 1 FOR 20
  )
)
WHERE "certificateCode" LIKE 'LEGACY%';
