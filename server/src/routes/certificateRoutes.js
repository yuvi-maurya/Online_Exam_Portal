import { Router } from 'express'
import { verifyCertificateCode } from '../controllers/certificateController.js'
import { createRateLimiter } from '../middlewares/rateLimit.js'

const certificateRouter = Router()
const verificationLimiter = createRateLimiter({
  code: 'CERTIFICATE_VERIFICATION_RATE_LIMITED',
  maxRequests: 30,
  message: 'Too many certificate verification attempts. Please try again later.',
  windowMs: 60 * 1_000,
})

certificateRouter.get('/verify/:certificateCode', verificationLimiter, verifyCertificateCode)

export default certificateRouter
