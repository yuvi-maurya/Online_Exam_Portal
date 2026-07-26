import { v2 as cloudinary } from 'cloudinary'
import { AppError } from '../utils/AppError.js'
import { env } from './env.js'

let isConfigured = false

function assertCloudinaryConfiguration() {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    throw new AppError(
      'Certificate storage is temporarily unavailable',
      503,
      'CERTIFICATE_STORAGE_UNAVAILABLE',
    )
  }
}

export function getCloudinaryClient() {
  assertCloudinaryConfiguration()

  if (!isConfigured) {
    cloudinary.config({
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
      cloud_name: env.cloudinary.cloudName,
      secure: true,
    })
    isConfigured = true
  }

  return cloudinary
}
