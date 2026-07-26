import { Writable } from 'node:stream'
import {
  AttemptResult,
  AttemptStatus,
  ExamStatus,
  ExamType,
  Role,
} from '@prisma/client'
import { v2 as cloudinary } from 'cloudinary'
import { prisma } from './src/config/prisma.js'
import {
  reconcileAttemptCertificate,
  reconcileAttemptCertificateSafely,
} from './src/services/certificateIssuanceService.js'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function deferred() {
  let resolve
  const promise = new Promise((fulfill) => {
    resolve = fulfill
  })

  return { promise, resolve }
}

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`
const uploadedPublicIds = []
const deletedPublicIds = []
let heldUpload = null

cloudinary.uploader.upload_stream = (options, callback) => {
  const chunks = []
  const stream = new Writable({
    write(chunk, _encoding, done) {
      chunks.push(chunk)
      done()
    },
  })

  stream.on('finish', async () => {
    uploadedPublicIds.push({
      bytes: Buffer.concat(chunks).length,
      overwrite: options.overwrite,
      publicId: options.public_id,
    })

    if (heldUpload) {
      const gate = heldUpload
      heldUpload = null
      gate.started.resolve()
      await gate.release.promise
    }

    callback(null, {
      secure_url: `https://certificate.test/${options.public_id}`,
    })
  })

  return stream
}

cloudinary.uploader.destroy = async (publicId) => {
  deletedPublicIds.push(publicId)
  return { result: 'ok' }
}

let teacher
let student
let subject
let exam
let attempt

async function setEvaluation({ evaluatedAt, percentage, result, score }) {
  return prisma.examAttempt.update({
    data: {
      evaluatedAt,
      percentage,
      result,
      score,
      status: AttemptStatus.EVALUATED,
    },
    where: { id: attempt.id },
  })
}

async function holdNextUpload() {
  heldUpload = {
    release: deferred(),
    started: deferred(),
  }
  const gate = heldUpload
  return gate
}

try {
  teacher = await prisma.user.create({
    data: {
      email: `phase10-teacher-${suffix}@example.test`,
      isEmailVerified: true,
      name: 'Phase 10 Teacher',
      password: 'not-used',
      role: Role.TEACHER,
    },
  })
  student = await prisma.user.create({
    data: {
      email: `phase10-student-${suffix}@example.test`,
      isEmailVerified: true,
      name: 'Phase 10 Student',
      password: 'not-used',
      role: Role.STUDENT,
    },
  })
  subject = await prisma.subject.create({
    data: {
      code: `P10-${suffix}`,
      createdById: teacher.id,
      name: 'Phase 10 Concurrency',
    },
  })
  exam = await prisma.exam.create({
    data: {
      createdById: teacher.id,
      durationMinutes: 30,
      examType: ExamType.QUIZ,
      passingMarks: 5,
      status: ExamStatus.PUBLISHED,
      subjectId: subject.id,
      title: 'Phase 10 Certificate Concurrency',
      totalMarks: 10,
    },
  })
  attempt = await prisma.examAttempt.create({
    data: {
      evaluatedAt: new Date('2026-07-24T10:00:00.000Z'),
      examId: exam.id,
      percentage: 100,
      result: AttemptResult.PASS,
      score: 10,
      status: AttemptStatus.EVALUATED,
      studentId: student.id,
      submittedAt: new Date('2026-07-24T09:59:00.000Z'),
    },
  })

  const sameProcessGate = await holdNextUpload()
  const initialPassingReconciliation = reconcileAttemptCertificateSafely(attempt.id)
  await sameProcessGate.started.promise
  await setEvaluation({
    evaluatedAt: new Date('2026-07-24T10:01:00.000Z'),
    percentage: 0,
    result: AttemptResult.FAIL,
    score: 0,
  })
  const newerFailingReconciliation = reconcileAttemptCertificateSafely(attempt.id)
  sameProcessGate.release.resolve()
  await Promise.all([initialPassingReconciliation, newerFailingReconciliation])

  assert(
    (await prisma.certificate.count({ where: { examId: exam.id } })) === 0,
    'A stale same-process PASS reconciliation created a certificate after FAIL',
  )

  await setEvaluation({
    evaluatedAt: new Date('2026-07-24T10:02:00.000Z'),
    percentage: 100,
    result: AttemptResult.PASS,
    score: 10,
  })
  const crossProcessGate = await holdNextUpload()
  const stalePassingProcess = reconcileAttemptCertificate(attempt.id)
  await crossProcessGate.started.promise
  await setEvaluation({
    evaluatedAt: new Date('2026-07-24T10:03:00.000Z'),
    percentage: 0,
    result: AttemptResult.FAIL,
    score: 0,
  })
  const currentFailingProcess = reconcileAttemptCertificate(attempt.id)
  crossProcessGate.release.resolve()
  await Promise.all([stalePassingProcess, currentFailingProcess])

  assert(
    (await prisma.certificate.count({ where: { examId: exam.id } })) === 0,
    'A stale cross-process PASS reconciliation created a certificate after FAIL',
  )

  await setEvaluation({
    evaluatedAt: new Date('2026-07-24T10:04:00.000Z'),
    percentage: 60,
    result: AttemptResult.PASS,
    score: 6,
  })
  const oldPassGate = await holdNextUpload()
  const oldPassingProcess = reconcileAttemptCertificate(attempt.id)
  await oldPassGate.started.promise
  const newestEvaluatedAt = new Date('2026-07-24T10:05:00.000Z')
  await setEvaluation({
    evaluatedAt: newestEvaluatedAt,
    percentage: 90,
    result: AttemptResult.PASS,
    score: 9,
  })
  const newestPassingProcess = reconcileAttemptCertificate(attempt.id)
  await newestPassingProcess
  oldPassGate.release.resolve()
  await oldPassingProcess

  const finalCertificate = await prisma.certificate.findUnique({
    where: {
      studentId_examId: {
        examId: exam.id,
        studentId: student.id,
      },
    },
  })
  assert(finalCertificate, 'The newest PASS did not create a certificate')
  assert(
    finalCertificate.issuedAt.getTime() === newestEvaluatedAt.getTime(),
    'The stale PASS replaced the newest certificate version',
  )

  const uploadsBeforeIdempotencyCheck = uploadedPublicIds.length
  await reconcileAttemptCertificate(attempt.id)
  assert(
    uploadedPublicIds.length === uploadsBeforeIdempotencyCheck,
    'An unchanged finalized attempt uploaded its certificate twice',
  )
  assert(
    new Set(uploadedPublicIds.map(({ publicId }) => publicId)).size >= 4,
    'Evaluation versions did not receive distinct Cloudinary public IDs',
  )
  assert(
    uploadedPublicIds.every(({ bytes }) => bytes > 0),
    'A Cloudinary upload received an empty PDF',
  )

  console.log(
    JSON.stringify({
      crossProcessStalePassRejected: true,
      deletedAssets: deletedPublicIds.length,
      finalVersionWon: true,
      idempotentRecheck: true,
      sameProcessStalePassRejected: true,
      uploads: uploadedPublicIds.length,
    }),
  )
} finally {
  if (exam) {
    await prisma.certificate.deleteMany({ where: { examId: exam.id } })
    await prisma.examAttempt.deleteMany({ where: { examId: exam.id } })
    await prisma.exam.deleteMany({ where: { id: exam.id } })
  }

  if (subject) {
    await prisma.subject.deleteMany({ where: { id: subject.id } })
  }

  if (student || teacher) {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [student?.id, teacher?.id].filter(Boolean),
        },
      },
    })
  }

  await prisma.$disconnect()
}
