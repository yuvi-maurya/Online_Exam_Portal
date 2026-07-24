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
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    socketTimeout: 15_000,
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

async function sendEmail({ html, subject, text, to }) {
  try {
    await getTransporter().sendMail({
      from: `"Exam Portal" <${env.smtp.user ?? 'no-reply@examportal.local'}>`,
      html,
      subject,
      text,
      to,
    })
  } catch {
    throw new AppError('Email delivery is temporarily unavailable', 503, 'EMAIL_DELIVERY_FAILED')
  }
}

function sendOtpEmail({ heading, name, otp, subject, to }) {
  const safeName = escapeHtml(name)

  return sendEmail({
    html: `<p>Hello ${safeName},</p><p>${heading}</p><p><strong>${otp}</strong></p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`,
    subject,
    text: `Hello ${name},\n\n${heading}\n\n${otp}\n\nThis code expires in 10 minutes. If you did not request it, you can ignore this email.`,
    to,
  })
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

export function sendResultReadyEmail({ examTitle, name, percentage, to }) {
  const safeExamTitle = escapeHtml(examTitle)
  const safeName = escapeHtml(name)

  return sendEmail({
    html: `<p>Hello ${safeName},</p><p>Your result for <strong>${safeExamTitle}</strong> is ready.</p><p>You scored <strong>${percentage}%</strong>.</p>`,
    subject: `Your result for ${examTitle} is ready`,
    text: `Hello ${name},\n\nYour result for ${examTitle} is ready — you scored ${percentage}%.`,
    to,
  })
}

export function sendUpcomingExamReminderEmail({ examTitle, name, scheduledStart, to }) {
  const safeExamTitle = escapeHtml(examTitle)
  const safeName = escapeHtml(name)
  const safeScheduledStart = escapeHtml(scheduledStart)

  return sendEmail({
    html: `<p>Hello ${safeName},</p><p>This is a reminder that <strong>${safeExamTitle}</strong> starts at <strong>${safeScheduledStart}</strong>.</p><p>Please sign in before the scheduled start time and be ready to begin.</p>`,
    subject: `Upcoming exam reminder: ${examTitle}`,
    text: `Hello ${name},\n\nThis is a reminder that ${examTitle} starts at ${scheduledStart}.\n\nPlease sign in before the scheduled start time and be ready to begin.`,
    to,
  })
}

export function sendPendingGradingReminderEmail({ examTitle, name, to }) {
  const safeExamTitle = escapeHtml(examTitle)
  const safeName = escapeHtml(name)

  return sendEmail({
    html: `<p>Hello ${safeName},</p><p><strong>${safeExamTitle}</strong> has student answers waiting for manual grading.</p><p>Open Exam Portal to review the pending answers.</p>`,
    subject: `Pending grading reminder: ${examTitle}`,
    text: `Hello ${name},\n\n${examTitle} has student answers waiting for manual grading.\n\nOpen Exam Portal to review the pending answers.`,
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
