export const getCookiePairs = () => {
  const cookies = document.cookie
  const cookiePairs: Record<string, string> = {}
  cookies
    .split(';')
    .forEach((cookieStr) => {
      const [name, ...rest] = cookieStr.split('=')
      cookiePairs[name.trim()] = decodeURIComponent(rest.join('=').trim())
    })
  return cookiePairs
}

export const getAnalyticsControl = () => {
  for (const [key, value] of Object.entries(getCookiePairs())) {
    if (key === 'cookie_control') {
      const control = JSON.parse(value)
      return (control?.analytics === true)
    }
  }
  return false
}

export const setAnalyticsControl = (allowed: boolean) => {
  // Base cookie control object
  const control = { analytics: allowed }
  // 30 day cookie expiration
  const expiration = 60 * 60 * 24 * 30
  document.cookie = `cookie_control=${JSON.stringify(control)}; path=/; max-age=` + expiration
  // Additionally, if disabling, we may want to clear existing analytics cookies
  if (!allowed) {
    for (const [key, _] of Object.entries(getCookiePairs())) {
      if (key.startsWith('GCP') || key.startsWith('_ga') || key.startsWith('_gid') || key.startsWith('_gat')) {
        const hostname = globalThis.location.hostname
        const parts = hostname.split('.')
        const topLevelDomain = parts.slice(-2).join('.')
        document.cookie = `${key}=; path=/; max-age=0`
        document.cookie = `${key}=; path=/; max-age=0; SameSite=Strict; Secure`
        document.cookie = `${key}=; path=/; max-age=0; domain=.${topLevelDomain}`
        document.cookie = `${key}=; path=/; max-age=0; domain=.${topLevelDomain}; SameSite=None; Secure`
        document.cookie = `${key}=; path=/; max-age=0; domain=.${topLevelDomain}; SameSite=Strict; Secure`
      }
    }
  }
}

export const CookeUtils = {
  getAnalyticsControl,
  setAnalyticsControl,
}
