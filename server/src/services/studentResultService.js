import { AttemptResult, AttemptStatus, QuestionType } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { assertAttemptOwner } from './studentAttemptSupport.js'

const CHOICE_QUESTION_TYPES = new Set([QuestionType.MCQ, QuestionType.TRUE_FALSE])
const VALID_ATTEMPT_RESULTS = new Set(Object.values(AttemptResult))
const MINIMUM_FLOAT_TOLERANCE = 1e-9

function resultNotEvaluatedError() {
  return new AppError('This exam attempt is not yet evaluated', 409, 'ATTEMPT_NOT_EVALUATED')
}

function resultDataInvalidError(reason) {
  return new AppError('The evaluated result data is invalid', 500, 'RESULT_DATA_INVALID', {
    reason,
  })
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function numbersMatch(left, right) {
  const relativeTolerance = Number.EPSILON * 16 * Math.max(1, Math.abs(left), Math.abs(right))

  return Math.abs(left - right) <= Math.max(MINIMUM_FLOAT_TOLERANCE, relativeTolerance)
}

function assertValidAggregate(attempt) {
  const { exam } = attempt

  if (!Number.isSafeInteger(exam.totalMarks) || exam.totalMarks <= 0) {
    throw resultDataInvalidError('Exam total marks must be a positive integer')
  }

  if (
    !Number.isSafeInteger(exam.passingMarks) ||
    exam.passingMarks < 0 ||
    exam.passingMarks > exam.totalMarks
  ) {
    throw resultDataInvalidError('Exam passing marks are outside the exam marks range')
  }

  if (!isFiniteNumber(attempt.score) || attempt.score < 0 || attempt.score > exam.totalMarks) {
    throw resultDataInvalidError('Score is missing or outside the exam marks range')
  }

  if (!isFiniteNumber(attempt.percentage) || attempt.percentage < 0 || attempt.percentage > 100) {
    throw resultDataInvalidError('Percentage is missing or outside the valid range')
  }

  const expectedPercentage = (attempt.score / exam.totalMarks) * 100

  if (!numbersMatch(attempt.percentage, expectedPercentage)) {
    throw resultDataInvalidError('Percentage does not match the stored score')
  }

  if (!VALID_ATTEMPT_RESULTS.has(attempt.result)) {
    throw resultDataInvalidError('Pass/fail result is missing')
  }

  const expectedResult =
    attempt.score >= exam.passingMarks ? AttemptResult.PASS : AttemptResult.FAIL

  if (attempt.result !== expectedResult) {
    throw resultDataInvalidError('Pass/fail result does not match the stored score')
  }

  if (!Number.isSafeInteger(attempt.rank) || attempt.rank < 1) {
    throw resultDataInvalidError('Rank is missing or invalid')
  }

  if (!(attempt.evaluatedAt instanceof Date)) {
    throw resultDataInvalidError('Evaluation time is missing')
  }

  if (!Number.isSafeInteger(attempt.timeTakenSeconds) || attempt.timeTakenSeconds < 0) {
    throw resultDataInvalidError('Time taken is missing or invalid')
  }
}

function buildAttachmentMap(exam) {
  const attachments = new Map()

  for (const attachment of exam.questions) {
    if (attachments.has(attachment.questionId)) {
      throw resultDataInvalidError('The exam contains a duplicate question attachment')
    }

    attachments.set(attachment.questionId, attachment)
  }

  return attachments
}

function buildAnswerMap(answers, questionIds) {
  const answerByQuestion = new Map()

  for (const answer of answers) {
    if (!questionIds.has(answer.questionId)) {
      throw resultDataInvalidError('An answer references a question outside the attempt')
    }

    if (answerByQuestion.has(answer.questionId)) {
      throw resultDataInvalidError('The attempt contains duplicate answers for a question')
    }

    answerByQuestion.set(answer.questionId, answer)
  }

  return answerByQuestion
}

function buildQuestionResult({ answer, attachment, attemptQuestion }) {
  const { question } = attemptQuestion
  const maxMarks = attachment.marksOverride ?? question.marks

  if (!Number.isSafeInteger(maxMarks) || maxMarks <= 0) {
    throw resultDataInvalidError('A question has invalid maximum marks')
  }

  const optionById = new Map()
  const correctOptions = []

  for (const attemptOption of attemptQuestion.options) {
    const { option } = attemptOption

    if (option.questionId !== question.id || optionById.has(option.id)) {
      throw resultDataInvalidError('The saved option presentation is invalid')
    }

    optionById.set(option.id, option)

    if (option.isCorrect) {
      correctOptions.push(option)
    }
  }

  const isChoiceQuestion = CHOICE_QUESTION_TYPES.has(question.type)

  if (isChoiceQuestion && correctOptions.length !== 1) {
    throw resultDataInvalidError('A choice question does not have exactly one correct option')
  }

  if (isChoiceQuestion && question.correctAnswerText !== null) {
    throw resultDataInvalidError('A choice question contains an open-ended correct answer')
  }

  if (!isChoiceQuestion && attemptQuestion.options.length > 0) {
    throw resultDataInvalidError('An open-ended question contains choice options')
  }

  if (
    !isChoiceQuestion &&
    (typeof question.correctAnswerText !== 'string' ||
      question.correctAnswerText.trim().length === 0)
  ) {
    throw resultDataInvalidError('An open-ended question is missing its correct answer')
  }

  let answerText = null
  let isCorrect = false
  let marksAwarded = 0
  let selectedOption = null

  if (answer) {
    if (
      !isFiniteNumber(answer.marksAwarded) ||
      answer.marksAwarded < 0 ||
      answer.marksAwarded > maxMarks ||
      typeof answer.isCorrect !== 'boolean'
    ) {
      throw resultDataInvalidError('A graded answer contains invalid marks or correctness data')
    }

    if (answer.isCorrect !== numbersMatch(answer.marksAwarded, maxMarks)) {
      throw resultDataInvalidError('Answer correctness does not match the awarded marks')
    }

    if (isChoiceQuestion) {
      if (answer.answerText !== null || answer.selectedOptionId === null) {
        throw resultDataInvalidError('A choice answer has an invalid representation')
      }

      const selected = optionById.get(answer.selectedOptionId)

      if (!selected) {
        throw resultDataInvalidError('The selected option is outside the saved attempt')
      }

      selectedOption = { id: selected.id, text: selected.text }
    } else {
      if (
        answer.selectedOptionId !== null ||
        typeof answer.answerText !== 'string' ||
        answer.answerText.trim().length === 0
      ) {
        throw resultDataInvalidError('An open-ended answer has an invalid representation')
      }

      answerText = answer.answerText
    }

    isCorrect = answer.isCorrect
    marksAwarded = answer.marksAwarded
  }

  const [correctOption] = correctOptions

  return {
    answerText,
    content: question.text,
    correctAnswerText: question.correctAnswerText,
    correctOption: correctOption ? { id: correctOption.id, text: correctOption.text } : null,
    isCorrect,
    marksAwarded,
    maxMarks,
    order: attemptQuestion.order,
    questionId: question.id,
    selectedOption,
    type: question.type,
  }
}

export async function getStudentAttemptResult({ attemptId, studentId }) {
  const access = await prisma.examAttempt.findUnique({
    select: { id: true, status: true, studentId: true },
    where: { id: attemptId },
  })

  assertAttemptOwner(access, studentId)

  if (access.status !== AttemptStatus.EVALUATED) {
    throw resultNotEvaluatedError()
  }

  const attempt = await prisma.examAttempt.findFirst({
    select: {
      answers: {
        select: {
          answerText: true,
          isCorrect: true,
          marksAwarded: true,
          questionId: true,
          selectedOptionId: true,
        },
      },
      attemptQuestions: {
        orderBy: { order: 'asc' },
        select: {
          options: {
            orderBy: { order: 'asc' },
            select: {
              option: {
                select: {
                  id: true,
                  isCorrect: true,
                  questionId: true,
                  text: true,
                },
              },
            },
          },
          order: true,
          question: {
            select: {
              correctAnswerText: true,
              id: true,
              marks: true,
              text: true,
              type: true,
            },
          },
          questionId: true,
        },
      },
      evaluatedAt: true,
      exam: {
        select: {
          id: true,
          passingMarks: true,
          questions: {
            select: {
              marksOverride: true,
              questionId: true,
            },
          },
          title: true,
          totalMarks: true,
        },
      },
      id: true,
      percentage: true,
      rank: true,
      result: true,
      score: true,
      timeTakenSeconds: true,
    },
    where: {
      id: attemptId,
      status: AttemptStatus.EVALUATED,
      studentId,
    },
  })

  if (!attempt) {
    throw new AppError(
      'The evaluated result changed while it was being loaded. Please retry.',
      409,
      'ATTEMPT_RESULT_STATE_CONFLICT',
    )
  }

  assertValidAggregate(attempt)

  const attachmentByQuestion = buildAttachmentMap(attempt.exam)
  const questionIds = new Set(
    attempt.attemptQuestions.map((attemptQuestion) => attemptQuestion.questionId),
  )

  if (
    questionIds.size !== attempt.attemptQuestions.length ||
    attachmentByQuestion.size !== attempt.exam.questions.length ||
    questionIds.size !== attachmentByQuestion.size
  ) {
    throw resultDataInvalidError('The saved question presentation is inconsistent with the exam')
  }

  const answerByQuestion = buildAnswerMap(attempt.answers, questionIds)
  const questions = attempt.attemptQuestions.map((attemptQuestion) => {
    const attachment = attachmentByQuestion.get(attemptQuestion.questionId)

    if (!attachment || attemptQuestion.question.id !== attemptQuestion.questionId) {
      throw resultDataInvalidError('The saved question presentation is invalid')
    }

    return buildQuestionResult({
      answer: answerByQuestion.get(attemptQuestion.questionId),
      attachment,
      attemptQuestion,
    })
  })
  const breakdownScore = questions.reduce((total, question) => total + question.marksAwarded, 0)

  if (!numbersMatch(breakdownScore, attempt.score)) {
    throw resultDataInvalidError('The question breakdown does not match the stored score')
  }

  return {
    attemptId: attempt.id,
    evaluatedAt: attempt.evaluatedAt,
    exam: {
      id: attempt.exam.id,
      title: attempt.exam.title,
    },
    percentage: attempt.percentage,
    questions,
    rank: attempt.rank,
    result: attempt.result,
    score: attempt.score,
    timeTakenSeconds: attempt.timeTakenSeconds,
    totalMarks: attempt.exam.totalMarks,
  }
}
