const COOKIE_CONTROL = 'cookie_control'

// decodeURIComponent throws URIError on a malformed sequence, and any cookie can
// hold one (a raw '%', or a legacy unencoded value). Fall back to the raw text so
// one bad cookie cannot break the whole document.cookie read.
const decodeValue = (value: string) => {
  try {
    return decodeURIComponent(value)
  }
  catch {
    return value
  }
}

export const getCookiePairs = () => {
  const cookies = document.cookie
  const cookiePairs: Record<string, string> = {}
  for (const cookieStr of cookies
    .split(';')) {
    const [name, ...rest] = cookieStr.split('=')
    cookiePairs[name.trim()] = decodeValue(rest.join('=').trim())
  }
  return cookiePairs
}

export const getAcknowledged = () => {
  const value = getCookiePairs()[COOKIE_CONTROL]
  if (value === undefined) {
    return false
  }
  try {
    const control = JSON.parse(value)
    return (control?.acknowledged === true)
  }
  catch {
    // Treat malformed or legacy values as unacknowledged.
    return false
  }
}

export const setAcknowledged = () => {
  // Base cookie control object
  const control = { acknowledged: true, timestamp: Date.now() }
  // 400 - day cookie expiration (days * hours * minutes * seconds)
  const expiration = 400 * 24 * 60 * 60
  // Unlike the session cookie, this preference is not needed on cross-site redirects.
  // Add Secure only when HTTPS is available; local development may use HTTP.
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  const value = encodeURIComponent(JSON.stringify(control))
  document.cookie = `${COOKIE_CONTROL}=${value}; path=/; max-age=${expiration}; SameSite=Strict${secure}`
}

export const CookieUtils = {
  getCookiePairs,
  getAcknowledged,
  setAcknowledged,
}
