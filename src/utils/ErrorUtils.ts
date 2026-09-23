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

/**
 * The HTTP status a failed request carried, when it had one.
 *
 * fetchAdapter attaches `response.status` to the error it throws for a non-ok response; a network
 * failure has no status at all. Callers use this to tell an authorization refusal from a genuine
 * server fault, which read identically through `extractError`.
 */
export function extractStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response
    return typeof response?.status === 'number' ? response.status : undefined
  }
  return undefined
}
