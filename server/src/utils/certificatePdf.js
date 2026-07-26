import PDFDocument from 'pdfkit'

const COLORS = Object.freeze({
  accent: '#C4963A',
  border: '#1D3557',
  muted: '#5D6875',
  text: '#17212B',
})
const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
  year: 'numeric',
})

function requireText(value, field) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${field} must be a non-empty string`)
  }

  return value.trim()
}

function requireNumber(value, field, { maximum = Number.POSITIVE_INFINITY } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > maximum) {
    throw new TypeError(`${field} must be a finite number between 0 and ${maximum}`)
  }

  return value
}

function requireDate(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new TypeError('issuedAt must be a valid Date')
  }

  return value
}

function fitSingleLineText(document, text, maximumWidth, preferredSize, minimumSize) {
  let fontSize = preferredSize

  while (fontSize > minimumSize) {
    document.fontSize(fontSize)

    if (document.widthOfString(text) <= maximumWidth) {
      return { fontSize, text }
    }

    fontSize -= 1
  }

  document.fontSize(minimumSize)

  if (document.widthOfString(text) <= maximumWidth) {
    return { fontSize: minimumSize, text }
  }

  const suffix = '...'
  let lowerBound = 0
  let upperBound = text.length

  while (lowerBound < upperBound) {
    const midpoint = Math.ceil((lowerBound + upperBound) / 2)
    const candidate = `${text.slice(0, midpoint).trimEnd()}${suffix}`

    if (document.widthOfString(candidate) <= maximumWidth) {
      lowerBound = midpoint
    } else {
      upperBound = midpoint - 1
    }
  }

  return {
    fontSize: minimumSize,
    text: `${text.slice(0, lowerBound).trimEnd()}${suffix}`,
  }
}

function drawCenteredSingleLine(document, text, options) {
  const {
    color = COLORS.text,
    font = 'Helvetica',
    maximumWidth,
    minimumSize,
    preferredSize,
    y,
  } = options
  const x = (document.page.width - maximumWidth) / 2

  document.font(font).fillColor(color)
  const fitted = fitSingleLineText(document, text, maximumWidth, preferredSize, minimumSize)

  document.fontSize(fitted.fontSize).text(fitted.text, x, y, {
    align: 'center',
    lineBreak: false,
    width: maximumWidth,
  })
}

function formatNumber(value) {
  return Number(value.toFixed(2)).toString()
}

export function generateCertificatePdf({
  certificateCode,
  examTitle,
  issuedAt,
  percentage,
  score,
  studentName,
}) {
  const data = {
    certificateCode: requireText(certificateCode, 'certificateCode'),
    examTitle: requireText(examTitle, 'examTitle'),
    issuedAt: requireDate(issuedAt),
    percentage: requireNumber(percentage, 'percentage', { maximum: 100 }),
    score: requireNumber(score, 'score'),
    studentName: requireText(studentName, 'studentName'),
  }

  return new Promise((resolve, reject) => {
    const chunks = []
    const document = new PDFDocument({
      info: {
        Author: 'Exam Portal',
        CreationDate: data.issuedAt,
        Creator: 'Exam Portal',
        ModDate: data.issuedAt,
        Subject: 'Certificate of Achievement',
        Title: `Certificate for ${data.studentName}`,
      },
      layout: 'landscape',
      margin: 0,
      size: 'A4',
    })

    document.on('data', (chunk) => chunks.push(chunk))
    document.on('end', () => resolve(Buffer.concat(chunks)))
    document.on('error', reject)

    const { height, width } = document.page

    document.rect(0, 0, width, height).fill('#FFFFFF')
    document
      .lineWidth(4)
      .strokeColor(COLORS.border)
      .rect(18, 18, width - 36, height - 36)
      .stroke()
    document
      .lineWidth(1)
      .strokeColor(COLORS.accent)
      .rect(27, 27, width - 54, height - 54)
      .stroke()

    document
      .moveTo(225, 124)
      .lineTo(width - 225, 124)
      .lineWidth(2)
      .strokeColor(COLORS.accent)
      .stroke()

    drawCenteredSingleLine(document, 'CERTIFICATE OF ACHIEVEMENT', {
      color: COLORS.border,
      font: 'Helvetica-Bold',
      maximumWidth: width - 120,
      minimumSize: 27,
      preferredSize: 34,
      y: 67,
    })
    drawCenteredSingleLine(document, 'Exam Portal', {
      color: COLORS.accent,
      font: 'Helvetica',
      maximumWidth: width - 180,
      minimumSize: 13,
      preferredSize: 15,
      y: 108,
    })
    drawCenteredSingleLine(document, 'This certificate is presented to', {
      color: COLORS.muted,
      maximumWidth: width - 180,
      minimumSize: 14,
      preferredSize: 16,
      y: 158,
    })
    drawCenteredSingleLine(document, data.studentName, {
      color: COLORS.text,
      font: 'Helvetica-Bold',
      maximumWidth: width - 160,
      minimumSize: 24,
      preferredSize: 40,
      y: 193,
    })
    drawCenteredSingleLine(document, 'for successfully completing', {
      color: COLORS.muted,
      maximumWidth: width - 180,
      minimumSize: 14,
      preferredSize: 16,
      y: 251,
    })
    drawCenteredSingleLine(document, data.examTitle, {
      color: COLORS.border,
      font: 'Helvetica-Bold',
      maximumWidth: width - 170,
      minimumSize: 16,
      preferredSize: 30,
      y: 286,
    })

    const scoreText = `Score: ${formatNumber(data.score)}`
    const percentageText = `Percentage: ${formatNumber(data.percentage)}%`

    document
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(COLORS.text)
      .text(scoreText, 190, 358, { align: 'center', lineBreak: false, width: 205 })
      .text(percentageText, width - 395, 358, {
        align: 'center',
        lineBreak: false,
        width: 205,
      })

    document
      .moveTo(width / 2, 349)
      .lineTo(width / 2, 383)
      .lineWidth(1)
      .strokeColor('#D6DBE1')
      .stroke()

    document
      .font('Helvetica')
      .fontSize(12)
      .fillColor(COLORS.muted)
      .text('Issued on', 125, 437, { align: 'center', lineBreak: false, width: 250 })
      .text('Certificate code', width - 375, 437, {
        align: 'center',
        lineBreak: false,
        width: 250,
      })
      .font('Helvetica-Bold')
      .fontSize(15)
      .fillColor(COLORS.text)
      .text(DATE_FORMATTER.format(data.issuedAt), 125, 459, {
        align: 'center',
        lineBreak: false,
        width: 250,
      })
      .text(data.certificateCode, width - 375, 459, {
        align: 'center',
        characterSpacing: 1,
        lineBreak: false,
        width: 250,
      })

    document
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text('Verify this certificate using the code shown above.', 90, height - 66, {
        align: 'center',
        lineBreak: false,
        width: width - 180,
      })

    document.end()
  })
}
