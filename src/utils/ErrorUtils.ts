import { ConsentError } from 'src/types/model'

export function extractError(error: unknown): string {
  const consentError = extractConsentError(error)
  if (consentError?.message) {
    return consentError.message
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Unknown error'
}

export function extractConsentError(error: unknown): ConsentError | undefined {
  // If error is a fetch-based error with a ConsentError shape
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return error as ConsentError
  }
  return undefined
}
