// Name of the GDPR cookie-banner preference cookie. The client reads it with
// `document.cookie`, so HttpOnly cannot apply — the other hardening attributes
// below are the full set available to it.
const COOKIE_CONTROL = 'cookie_control'

export const getCookiePairs = () => {
  const cookies = document.cookie
  const cookiePairs: Record<string, string> = {}
  for (const cookieStr of cookies
    .split(';')) {
    const [name, ...rest] = cookieStr.split('=')
    cookiePairs[name.trim()] = decodeURIComponent(rest.join('=').trim())
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
    // The value is user-controlled: anyone can hand-edit the cookie, and an
    // older release wrote it unencoded. A corrupt value must read as "not
    // acknowledged", not throw during render.
    return false
  }
}

export const setAcknowledged = () => {
  // Base cookie control object
  const control = { acknowledged: true, timestamp: Date.now() }
  // 400 - day cookie expiration (days * hours * minutes * seconds)
  const expiration = 400 * 24 * 60 * 60
  // Strict, not Lax: this cookie takes no part in the OAuth callback, so
  // nothing needs it on a cross-site navigation.
  // Secure only over HTTPS — unconditional Secure would make plain-HTTP dev
  // setups drop the cookie silently.
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  // The value is encoded because getCookiePairs() decodes. Raw JSON reads back
  // unchanged today, but the two paths must agree.
  const value = encodeURIComponent(JSON.stringify(control))
  document.cookie = `${COOKIE_CONTROL}=${value}; path=/; max-age=${expiration}; SameSite=Strict${secure}`
}

export const CookieUtils = {
  getCookiePairs,
  getAcknowledged,
  setAcknowledged,
}
