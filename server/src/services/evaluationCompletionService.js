import { logger } from '../config/logger.js'
import { reconcileAttemptCertificateSafely } from './certificateIssuanceService.js'
import { publishResultNotificationSafely } from './notificationDeliveryService.js'

export async function runEvaluationPostCommitEffectsSafely({
  certificateAttemptId,
  notificationAttemptId,
}) {
  const effects = []

  if (notificationAttemptId) {
    effects.push(publishResultNotificationSafely(notificationAttemptId))
  }

  if (certificateAttemptId) {
    effects.push(reconcileAttemptCertificateSafely(certificateAttemptId))
  }

  const outcomes = await Promise.allSettled(effects)

  for (const outcome of outcomes) {
    if (outcome.status === 'rejected') {
      logger.error({ err: outcome.reason }, 'A post-evaluation effect failed')
    }
  }
}
