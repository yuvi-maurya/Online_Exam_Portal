require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { createHmac } = require('crypto')

const OTP_DIGEST_CONTEXT = 'exam-portal:otp:v1'

async function main() {
  const [, , email, otp] = process.argv
  if (!email || !otp) {
    console.error('Usage: node insert-verification-token.cjs <email> <otp>')
    process.exit(2)
  }

  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      console.error('User not found:', email)
      process.exit(2)
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('JWT_SECRET missing in .env')
      process.exit(2)
    }

    const purpose = 'EMAIL_VERIFICATION'
    const digest = createHmac('sha256', jwtSecret)
      .update(`${OTP_DIGEST_CONTEXT}\0${purpose}\0${user.id}\0${otp}`)
      .digest('hex')

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.verificationToken.create({
      data: { userId: user.id, code: digest, purpose, expiresAt },
    })
    console.log('Inserted verification token for', email)
  } catch (err) {
    console.error(err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
