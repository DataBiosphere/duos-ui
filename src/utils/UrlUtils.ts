const SAFE_HTTP_PROTOCOLS = new Set(['http:', 'https:'])

export const getSafeHttpUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return undefined
  }

  try {
    const url = new URL(trimmedValue)
    return SAFE_HTTP_PROTOCOLS.has(url.protocol) ? trimmedValue : undefined
  }
  catch {
    return undefined
  }
}

export const isSafeHttpUrl = (value: unknown): boolean => getSafeHttpUrl(value) !== undefined
