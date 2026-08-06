import path from 'node:path'
import { Readable } from 'node:stream'
import ExcelJS from 'exceljs'
import { AppError } from './AppError.js'

const MAX_IMPORT_ROWS = 1_000
const QUESTION_HEADER_ALIASES = new Map([
  ['answer', 'correctAnswerText'],
  ['content', 'content'],
  ['correctanswer', 'correctAnswerText'],
  ['correctanswertext', 'correctAnswerText'],
  ['correctoption', 'correctOption'],
  ['correctoptionindex', 'correctOption'],
  ['difficulty', 'difficulty'],
  ['marks', 'marks'],
  ['options', 'options'],
  ['question', 'content'],
  ['questiontext', 'content'],
  ['questiontype', 'type'],
  ['subjectcode', 'subjectCode'],
  ['subjectid', 'subjectId'],
  ['text', 'content'],
  ['type', 'type'],
])
const STUDENT_HEADER_ALIASES = new Map([
  ['email', 'email'],
  ['name', 'name'],
])

function importFileError(message, code = 'MALFORMED_IMPORT_FILE', details) {
  return new AppError(message, 400, code, details)
}

function normalizeHeader(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
}

function resolveHeader(rawHeader, aliases, { allowOptionColumns = false } = {}) {
  const normalized = normalizeHeader(rawHeader)
  const canonical = aliases.get(normalized)

  if (canonical) {
    return canonical
  }

  if (allowOptionColumns) {
    const match = normalized.match(/^option0*([1-9]\d*)$/)
    const optionNumber = match ? Number.parseInt(match[1], 10) : 0

    if (optionNumber >= 1 && optionNumber <= 100) {
      return `option${optionNumber}`
    }
  }

  throw importFileError(`Unsupported import column: ${rawHeader}`, 'INVALID_IMPORT_HEADERS', {
    field: rawHeader,
  })
}

function getCellText(cell) {
  return cell.text.trim()
}

function findWorksheet(workbook) {
  return workbook.worksheets.find((worksheet) => worksheet.actualRowCount > 0)
}

async function loadWorksheet(file) {
  if (!file?.buffer || file.buffer.length === 0) {
    throw importFileError(
      'A non-empty CSV or Excel file is required in the multipart field named "file"',
      'IMPORT_FILE_REQUIRED',
    )
  }

  const extension = path.extname(file.originalname).toLowerCase()
  const workbook = new ExcelJS.Workbook()

  try {
    if (extension === '.csv') {
      await workbook.csv.read(Readable.from([file.buffer]))
    } else if (extension === '.xlsx') {
      await workbook.xlsx.load(file.buffer)
    } else {
      throw importFileError(
        'Only CSV (.csv) and Excel (.xlsx) files are supported',
        'UNSUPPORTED_IMPORT_FILE',
      )
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw importFileError('The import file could not be parsed as valid CSV or Excel data')
  }

  const worksheet = findWorksheet(workbook)

  if (!worksheet) {
    throw importFileError('The import file is empty', 'EMPTY_IMPORT_FILE')
  }

  return worksheet
}

function parseHeaders(worksheet, aliases, options) {
  const headerRow = worksheet.getRow(1)
  const headers = []
  const seenHeaders = new Set()

  for (let column = 1; column <= headerRow.cellCount; column += 1) {
    const rawHeader = getCellText(headerRow.getCell(column))

    if (!rawHeader) {
      throw importFileError(`Header cell ${column} is empty`, 'INVALID_IMPORT_HEADERS', { column })
    }

    const name = resolveHeader(rawHeader, aliases, options)

    if (seenHeaders.has(name)) {
      throw importFileError(`Import column ${rawHeader} is duplicated`, 'INVALID_IMPORT_HEADERS', {
        field: name,
      })
    }

    seenHeaders.add(name)
    headers.push({ column, name })
  }

  if (headers.length === 0) {
    throw importFileError('The import file must include a header row', 'INVALID_IMPORT_HEADERS')
  }

  return { headers, names: seenHeaders }
}

function assertRequiredHeaders(names, requiredHeaders) {
  const missing = requiredHeaders.filter((header) => !names.has(header))

  if (missing.length > 0) {
    throw importFileError(
      `Missing required import column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
      'INVALID_IMPORT_HEADERS',
      { missing },
    )
  }
}

function parseRows(worksheet, headers) {
  const rows = []
  const headerWidth = worksheet.getRow(1).cellCount

  if (worksheet.actualRowCount > MAX_IMPORT_ROWS + 1 || worksheet.rowCount > MAX_IMPORT_ROWS + 1) {
    throw importFileError(
      `Import files may contain at most ${MAX_IMPORT_ROWS} data rows without sparse row gaps`,
      'IMPORT_ROW_LIMIT_EXCEEDED',
      { maximum: MAX_IMPORT_ROWS },
    )
  }

  worksheet.eachRow({ includeEmpty: false }, (worksheetRow, rowNumber) => {
    if (rowNumber === 1) {
      return
    }

    let unexpectedColumn

    worksheetRow.eachCell({ includeEmpty: false }, (cell, column) => {
      if (column > headerWidth && getCellText(cell)) {
        unexpectedColumn ??= column
      }
    })

    if (unexpectedColumn) {
      throw importFileError(
        `Row ${rowNumber} contains data in column ${unexpectedColumn}, which has no header`,
        'INVALID_IMPORT_ROW',
        { column: unexpectedColumn, row: rowNumber },
      )
    }

    const values = Object.fromEntries(
      headers.map(({ column, name }) => [name, getCellText(worksheetRow.getCell(column))]),
    )

    if (Object.values(values).every((value) => value.length === 0)) {
      return
    }

    rows.push({ rowNumber, values })
  })

  if (rows.length === 0) {
    throw importFileError('The import file has no data rows', 'EMPTY_IMPORT_FILE')
  }

  return rows
}

async function parseImportFile(file, { aliases, allowOptionColumns, requiredHeaders }) {
  const worksheet = await loadWorksheet(file)
  const { headers, names } = parseHeaders(worksheet, aliases, { allowOptionColumns })

  assertRequiredHeaders(names, requiredHeaders)

  return { headers: names, rows: parseRows(worksheet, headers) }
}

export function parseStudentImportFile(file) {
  return parseImportFile(file, {
    aliases: STUDENT_HEADER_ALIASES,
    allowOptionColumns: false,
    requiredHeaders: ['name', 'email'],
  })
}

export async function parseQuestionImportFile(file) {
  const parsed = await parseImportFile(file, {
    aliases: QUESTION_HEADER_ALIASES,
    allowOptionColumns: true,
    requiredHeaders: ['type', 'content', 'difficulty', 'marks'],
  })

  if (!parsed.headers.has('subjectCode') && !parsed.headers.has('subjectId')) {
    throw importFileError(
      'Missing required import column: subjectCode (or subjectId)',
      'INVALID_IMPORT_HEADERS',
      { missing: ['subjectCode'] },
    )
  }

  return parsed
}
