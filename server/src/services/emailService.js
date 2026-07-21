import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

let transporter

function getTransporter() {
  if (transporter) {
    return transporter
  }

  if (env.nodeEnv === 'test') {
    transporter = nodemailer.createTransport({ jsonTransport: true })
    return transporter
  }

  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    throw new AppError(
      'Email delivery is temporarily unavailable',
      503,
      'EMAIL_SERVICE_UNAVAILABLE',
    )
  }

  transporter = nodemailer.createTransport({
    auth: {
      pass: env.smtp.pass,
      user: env.smtp.user,
    },
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
  })

  return transporter
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }

    return entities[character]
  })
}

async function sendOtpEmail({ heading, name, otp, subject, to }) {
  const safeName = escapeHtml(name)

  try {
    await getTransporter().sendMail({
      from: `"Exam Portal" <${env.smtp.user ?? 'no-reply@examportal.local'}>`,
      html: `<p>Hello ${safeName},</p><p>${heading}</p><p><strong>${otp}</strong></p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`,
      subject,
      text: `Hello ${name},\n\n${heading}\n\n${otp}\n\nThis code expires in 10 minutes. If you did not request it, you can ignore this email.`,
      to,
    })
  } catch {
    throw new AppError('Email delivery is temporarily unavailable', 503, 'EMAIL_DELIVERY_FAILED')
  }
}

export function sendEmailVerificationOtp({ name, otp, to }) {
  return sendOtpEmail({
    heading: 'Use this verification code to confirm your email address:',
    name,
    otp,
    subject: 'Verify your Exam Portal email',
    to,
  })
}

export function sendPasswordResetOtp({ name, otp, to }) {
  return sendOtpEmail({
    heading: 'Use this verification code to reset your password:',
    name,
    otp,
    subject: 'Reset your Exam Portal password',
    to,
  })
}
