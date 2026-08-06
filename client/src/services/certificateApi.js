import { apiClient } from './apiClient.js'

export async function verifyCertificateCode(certificateCode) {
  const response = await apiClient.get(
    `/certificates/verify/${encodeURIComponent(certificateCode)}`,
  )

  return response?.data ?? null
}
