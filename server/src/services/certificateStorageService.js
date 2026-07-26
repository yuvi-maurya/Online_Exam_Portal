import { createHash } from 'node:crypto'
import { getCloudinaryClient } from '../config/cloudinary.js'

function certificatePublicId(attemptId, evaluatedAt) {
  if (!(evaluatedAt instanceof Date) || Number.isNaN(evaluatedAt.getTime())) {
    throw new TypeError('Certificate evaluation time must be a valid Date')
  }

  const digest = createHash('sha256')
    .update(`exam-portal-certificate:${attemptId}:${evaluatedAt.toISOString()}`)
    .digest('hex')
    .slice(0, 32)

  return `exam-portal/certificates/${digest}.pdf`
}

export function uploadCertificatePdf({ attemptId, buffer, evaluatedAt, overwrite = false }) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new TypeError('Certificate PDF must be a non-empty Buffer')
  }

  const cloudinary = getCloudinaryClient()
  const publicId = certificatePublicId(attemptId, evaluatedAt)

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        overwrite,
        public_id: publicId,
        resource_type: 'raw',
        timeout: 15_000,
        type: 'upload',
        unique_filename: false,
        use_filename: false,
      },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }

        const fileUrl =
          result?.secure_url ??
          cloudinary.url(publicId, {
            resource_type: 'raw',
            secure: true,
            type: 'upload',
          })

        if (!fileUrl) {
          reject(new Error('Cloudinary did not return a secure certificate URL'))
          return
        }

        resolve(fileUrl)
      },
    )

    upload.end(buffer)
  })
}

export async function deleteCertificatePdf({ attemptId, evaluatedAt }) {
  const result = await getCloudinaryClient().uploader.destroy(
    certificatePublicId(attemptId, evaluatedAt),
    {
      invalidate: true,
      resource_type: 'raw',
      timeout: 15_000,
      type: 'upload',
    },
  )

  if (!['not found', 'ok'].includes(result?.result)) {
    throw new Error('Cloudinary did not confirm certificate deletion')
  }
}
