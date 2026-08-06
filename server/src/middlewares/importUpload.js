import path from 'node:path'
import multer from 'multer'
import { AppError } from '../utils/AppError.js'

const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024
const SUPPORTED_EXTENSIONS = new Set(['.csv', '.xlsx'])

const upload = multer({
  fileFilter(_request, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase()

    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      callback(
        new AppError(
          'Only CSV (.csv) and Excel (.xlsx) files are supported',
          400,
          'UNSUPPORTED_IMPORT_FILE',
        ),
      )
      return
    }

    callback(null, true)
  },
  limits: {
    fileSize: MAX_IMPORT_FILE_BYTES,
    fields: 0,
    files: 1,
    parts: 1,
  },
  storage: multer.memoryStorage(),
})

function translateMulterError(error) {
  if (error instanceof AppError) {
    return error
  }

  if (!(error instanceof multer.MulterError)) {
    return new AppError('The multipart import upload is malformed', 400, 'INVALID_IMPORT_UPLOAD')
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError('Import file must not exceed 5 MB', 400, 'IMPORT_FILE_TOO_LARGE')
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError(
      'Upload exactly one file using the multipart field named "file"',
      400,
      'INVALID_IMPORT_UPLOAD',
    )
  }

  return new AppError('The import upload is invalid', 400, 'INVALID_IMPORT_UPLOAD')
}

export function uploadImportFile(request, response, next) {
  upload.single('file')(request, response, (error) => {
    if (error) {
      next(translateMulterError(error))
      return
    }

    next()
  })
}
