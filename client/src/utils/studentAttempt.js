const CHOICE_TYPES = new Set(['MCQ', 'TRUE_FALSE'])

export function isChoiceQuestionType(type) {
  return CHOICE_TYPES.has(type)
}

export function isAttemptAnswerComplete(question, answer) {
  return isChoiceQuestionType(question.type)
    ? Boolean(answer.selectedOptionId)
    : Boolean(answer.answerText?.trim())
}
