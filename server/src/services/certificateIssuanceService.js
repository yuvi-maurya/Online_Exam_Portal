import { createHash } from 'node:crypto'
import { AttemptResult, AttemptStatus } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { generateCertificatePdf } from '../utils/certificatePdf.js'
import { deleteCertificatePdf, uploadCertificatePdf } from './certificateStorageService.js'

const CERTIFICATE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CERTIFICATE_CODE_LENGTH = 20
const MAX_RECONCILIATION_PASSES = 5
const RECONCILIATION_BATCH_SIZE = 3
const inFlightReconciliations = new Map()

const ATTEMPT_STATE_SELECT = {
  evaluatedAt: true,
  result: true,
  status: true,
}
const CERTIFICATE_SELECT = {
  certificateCode: true,
  examId: true,
  fileUrl: true,
  id: true,
  issuedAt: true,
  studentId: true,
}

function encodeBase32(buffer) {
  let bits = 0
  let output = ''
  let value = 0

  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8

    while (bits >= 5) {
      bits -= 5
      output += CERTIFICATE_CODE_ALPHABET[(value >>> bits) & 31]

      if (output.length === CERTIFICATE_CODE_LENGTH) {
        return output
      }
    }

    value &= (1 << bits) - 1
  }

  throw new Error('Unable to generate a certificate code')
}

function createCertificateCode(attemptId) {
  // The random component of the CUID makes this opaque, while hashing keeps retries deterministic.
  const digest = createHash('sha256').update(`exam-portal-certificate-code:${attemptId}`).digest()

  return encodeBase32(digest)
}

function dateValue(value) {
  return value instanceof Date ? value.getTime() : null
}

function datesMatch(left, right) {
  return dateValue(left) !== null && dateValue(left) === dateValue(right)
}

function evaluationStatesMatch(left, right) {
  if (!left || !right) {
    return left === right
  }

  return (
    left.status === right.status &&
    left.result === right.result &&
    dateValue(left.evaluatedAt) === dateValue(right.evaluatedAt)
  )
}

function loadAttemptState(attemptId, client = prisma) {
  return client.examAttempt.findUnique({
    select: ATTEMPT_STATE_SELECT,
    where: { id: attemptId },
  })
}

function loadCertificateAttempt(attemptId) {
  return prisma.examAttempt.findUnique({
    select: {
      ...ATTEMPT_STATE_SELECT,
      exam: { select: { id: true, title: true } },
      percentage: true,
      score: true,
      student: { select: { id: true, name: true } },
    },
    where: { id: attemptId },
  })
}

function loadCertificate(certificateKey, client = prisma) {
  return client.certificate.findUnique({
    select: CERTIFICATE_SELECT,
    where: { studentId_examId: certificateKey },
  })
}

function runLockedAttemptTransaction(attemptId, operation) {
  return prisma.$transaction(
    async (transaction) => {
      const locked = await transaction.$queryRaw`
        SELECT "id"
        FROM "ExamAttempt"
        WHERE "id" = ${attemptId}
        FOR UPDATE
      `

      if (locked.length === 0) {
        return { kind: 'ATTEMPT_MISSING' }
      }

      const currentAttempt = await loadAttemptState(attemptId, transaction)
      return operation(transaction, currentAttempt)
    },
    {
      maxWait: 5_000,
      timeout: 5_000,
    },
  )
}

async function deleteAssetSafely({ attemptId, evaluatedAt }) {
  try {
    await deleteCertificatePdf({ attemptId, evaluatedAt })
  } catch (error) {
    console.error(`Certificate asset deletion failed for attempt ${attemptId}:`, error)
  }
}

async function revokeCertificate({ attempt, attemptId, certificateKey }) {
  const commit = await runLockedAttemptTransaction(
    attemptId,
    async (transaction, currentAttempt) => {
      if (
        !evaluationStatesMatch(attempt, currentAttempt) ||
        currentAttempt.result !== AttemptResult.FAIL
      ) {
        return { kind: 'STALE' }
      }

      const currentCertificate = await loadCertificate(certificateKey, transaction)

      if (!currentCertificate) {
        return {
          kind: 'CURRENT',
          outcome: { certificate: null, created: false, reason: 'NOT_ISSUED' },
        }
      }

      await transaction.certificate.delete({ where: { id: currentCertificate.id } })
      return {
        deletedCertificate: currentCertificate,
        kind: 'CURRENT',
        outcome: { certificate: null, created: false, reason: 'REVOKED' },
      }
    },
  )

  if (commit.kind === 'STALE' || commit.kind === 'ATTEMPT_MISSING') {
    return {
      outcome: { certificate: null, created: false, reason: 'STATE_CHANGED' },
      retryRequested: commit.kind === 'STALE',
    }
  }

  if (commit.deletedCertificate) {
    await deleteAssetSafely({
      attemptId,
      evaluatedAt: commit.deletedCertificate.issuedAt,
    })
  }

  return { outcome: commit.outcome, retryRequested: false }
}

async function commitPassingCertificate({
  attempt,
  attemptId,
  certificateCode,
  certificateKey,
  fileUrl,
}) {
  return runLockedAttemptTransaction(attemptId, async (transaction, currentAttempt) => {
    if (
      !evaluationStatesMatch(attempt, currentAttempt) ||
      currentAttempt.result !== AttemptResult.PASS
    ) {
      return { kind: 'STALE' }
    }

    const currentCertificate = await loadCertificate(certificateKey, transaction)

    if (currentCertificate && currentCertificate.certificateCode !== certificateCode) {
      return { kind: 'RETRY_WITH_CURRENT_CODE' }
    }

    if (currentCertificate && datesMatch(currentCertificate.issuedAt, attempt.evaluatedAt)) {
      return {
        kind: 'CURRENT',
        outcome: {
          certificate: currentCertificate,
          created: false,
          reason: 'ALREADY_CURRENT',
        },
      }
    }

    if (currentCertificate) {
      const certificate = await transaction.certificate.update({
        data: {
          fileUrl,
          issuedAt: attempt.evaluatedAt,
        },
        select: CERTIFICATE_SELECT,
        where: { id: currentCertificate.id },
      })

      return {
        kind: 'CURRENT',
        outcome: { certificate, created: false, reason: 'UPDATED' },
        previousIssuedAt: currentCertificate.issuedAt,
      }
    }

    const certificate = await transaction.certificate.create({
      data: {
        certificateCode,
        ...certificateKey,
        fileUrl,
        issuedAt: attempt.evaluatedAt,
      },
      select: CERTIFICATE_SELECT,
    })

    return {
      kind: 'CURRENT',
      outcome: { certificate, created: true, reason: 'ISSUED' },
    }
  })
}

async function persistPassingCertificate({
  attempt,
  attemptId,
  certificateKey,
  observedCertificate,
}) {
  if (
    typeof attempt.score !== 'number' ||
    !Number.isFinite(attempt.score) ||
    typeof attempt.percentage !== 'number' ||
    !Number.isFinite(attempt.percentage) ||
    !(attempt.evaluatedAt instanceof Date)
  ) {
    throw new Error('Passing attempt is missing certificate data')
  }

  if (observedCertificate && datesMatch(observedCertificate.issuedAt, attempt.evaluatedAt)) {
    return {
      outcome: {
        certificate: observedCertificate,
        created: false,
        reason: 'ALREADY_CURRENT',
      },
      retryRequested: false,
    }
  }

  const certificateCode = observedCertificate?.certificateCode ?? createCertificateCode(attemptId)
  const pdf = await generateCertificatePdf({
    certificateCode,
    examTitle: attempt.exam.title,
    issuedAt: attempt.evaluatedAt,
    percentage: attempt.percentage,
    score: attempt.score,
    studentName: attempt.student.name,
  })
  const fileUrl = await uploadCertificatePdf({
    attemptId,
    buffer: pdf,
    evaluatedAt: attempt.evaluatedAt,
    overwrite: true,
  })
  const commit = await commitPassingCertificate({
    attempt,
    attemptId,
    certificateCode,
    certificateKey,
    fileUrl,
  })

  if (commit.kind === 'STALE' || commit.kind === 'ATTEMPT_MISSING') {
    await deleteAssetSafely({ attemptId, evaluatedAt: attempt.evaluatedAt })
    return {
      outcome: { certificate: null, created: false, reason: 'STATE_CHANGED' },
      retryRequested: commit.kind === 'STALE',
    }
  }

  if (commit.kind === 'RETRY_WITH_CURRENT_CODE') {
    return {
      outcome: { certificate: null, created: false, reason: 'CODE_CHANGED' },
      retryRequested: true,
    }
  }

  if (commit.previousIssuedAt && !datesMatch(commit.previousIssuedAt, attempt.evaluatedAt)) {
    await deleteAssetSafely({
      attemptId,
      evaluatedAt: commit.previousIssuedAt,
    })
  }

  return { outcome: commit.outcome, retryRequested: false }
}

async function reconcileAttemptCertificateOnce(attemptId) {
  const attempt = await loadCertificateAttempt(attemptId)

  if (!attempt || attempt.status !== AttemptStatus.EVALUATED) {
    return {
      outcome: {
        certificate: null,
        created: false,
        reason: 'ATTEMPT_NOT_EVALUATED',
      },
      retryRequested: false,
      snapshot: attempt,
    }
  }

  const certificateKey = {
    examId: attempt.exam.id,
    studentId: attempt.student.id,
  }
  const observedCertificate = await loadCertificate(certificateKey)
  let execution

  if (attempt.result === AttemptResult.FAIL) {
    execution = await revokeCertificate({
      attempt,
      attemptId,
      certificateKey,
    })
  } else if (attempt.result === AttemptResult.PASS) {
    execution = await persistPassingCertificate({
      attempt,
      attemptId,
      certificateKey,
      observedCertificate,
    })
  } else {
    execution = {
      outcome: {
        certificate: null,
        created: false,
        reason: 'RESULT_UNAVAILABLE',
      },
      retryRequested: false,
    }
  }

  return { ...execution, snapshot: attempt }
}

export async function reconcileAttemptCertificate(attemptId) {
  let lastOutcome

  for (let pass = 1; pass <= MAX_RECONCILIATION_PASSES; pass += 1) {
    const execution = await reconcileAttemptCertificateOnce(attemptId)
    lastOutcome = execution.outcome

    if (execution.retryRequested) {
      continue
    }

    const latestState = await loadAttemptState(attemptId)

    if (evaluationStatesMatch(execution.snapshot, latestState)) {
      return lastOutcome
    }
  }

  throw new Error('Certificate state kept changing during reconciliation')
}

export function reconcileAttemptCertificateSafely(attemptId) {
  const current = inFlightReconciliations.get(attemptId)

  if (current) {
    current.rerunRequested = true
    return current.promise
  }

  const entry = {
    promise: null,
    rerunRequested: false,
  }

  inFlightReconciliations.set(attemptId, entry)
  entry.promise = (async () => {
    try {
      let outcome

      do {
        entry.rerunRequested = false

        try {
          outcome = await reconcileAttemptCertificate(attemptId)
        } catch (error) {
          if (entry.rerunRequested) {
            continue
          }

          throw error
        }
      } while (entry.rerunRequested)

      return outcome
    } catch (error) {
      console.error(`Certificate reconciliation failed for attempt ${attemptId}:`, error)
      return { certificate: null, created: false, reason: 'RECONCILIATION_FAILED' }
    } finally {
      if (inFlightReconciliations.get(attemptId) === entry) {
        inFlightReconciliations.delete(attemptId)
      }
    }
  })()

  return entry.promise
}

export async function reconcileStudentCertificatesSafely(studentId) {
  try {
    const evaluatedAttempts = await prisma.examAttempt.findMany({
      orderBy: [{ evaluatedAt: 'asc' }, { id: 'asc' }],
      select: {
        evaluatedAt: true,
        examId: true,
        id: true,
        result: true,
      },
      where: {
        status: AttemptStatus.EVALUATED,
        studentId,
      },
    })

    if (evaluatedAttempts.length === 0) {
      return
    }

    const existingCertificates = await prisma.certificate.findMany({
      select: { examId: true, issuedAt: true },
      where: {
        examId: { in: evaluatedAttempts.map((attempt) => attempt.examId) },
        studentId,
      },
    })
    const certificateByExamId = new Map(
      existingCertificates.map((certificate) => [certificate.examId, certificate]),
    )
    const candidates = evaluatedAttempts.filter((attempt) => {
      const certificate = certificateByExamId.get(attempt.examId)

      if (attempt.result === AttemptResult.FAIL) {
        return Boolean(certificate)
      }

      return (
        attempt.result === AttemptResult.PASS &&
        (!certificate || !datesMatch(certificate.issuedAt, attempt.evaluatedAt))
      )
    })

    for (let index = 0; index < candidates.length; index += RECONCILIATION_BATCH_SIZE) {
      const batch = candidates.slice(index, index + RECONCILIATION_BATCH_SIZE)
      await Promise.all(batch.map((attempt) => reconcileAttemptCertificateSafely(attempt.id)))
    }
  } catch (error) {
    console.error(`Certificate reconciliation failed for student ${studentId}:`, error)
  }
}
