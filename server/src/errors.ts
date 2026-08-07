/**
 * The body the app returns for an error it did not plan for.
 *
 * Shared rather than written out twice. Two scopes answer errors — the root
 * instance and the encapsulated proxy (see ADR-010) — and the whole point of the
 * proxy having its own handler is that the browser cannot tell which of the two
 * failed. A string literal in each place drifts, and the drift is invisible:
 * both still return *a* generic body, just not the same one.
 */
export const GENERIC_ERROR_BODY = { error: 'An unexpected error occurred.' }
