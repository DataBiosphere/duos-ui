const VALID_HTTP_PROTOCOLS = new Set(['http:', 'https:'])

export const validateHttpUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return undefined
  }

  try {
    const url = new URL(trimmedValue)
    return VALID_HTTP_PROTOCOLS.has(url.protocol) ? trimmedValue : undefined
  }
  catch {
    return undefined
  }
}

export const isValidHttpUrl = (value: unknown): boolean => validateHttpUrl(value) !== undefined
