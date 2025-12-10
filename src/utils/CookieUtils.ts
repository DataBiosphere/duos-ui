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

export const getAccepted = () => {
  for (const [key, value] of Object.entries(getCookiePairs())) {
    if (key === 'cookie_control') {
      const control = JSON.parse(value)
      return (control?.accepted === true)
    }
  }
  return false
}

export const setAccepted = () => {
  // Base cookie control object
  const control = { accepted: true, timestamp: Date.now() }
  // 400 - day cookie expiration (days * hours * minutes * seconds)
  const expiration = 400 * 24 * 60 * 60
  document.cookie = `cookie_control=${JSON.stringify(control)}; path=/; max-age=` + expiration
}

export const CookieUtils = {
  getCookiePairs,
  getAccepted,
  setAccepted,
}
