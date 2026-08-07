/**
 * The generic error body, shared by the root and proxy error handlers (ADR-010).
 * Shared so the two cannot drift into returning different "generic" bodies.
 */
export const GENERIC_ERROR_BODY = { error: 'An unexpected error occurred.' }
