import EnvironmentUtils, { envGroups } from 'src/utils/EnvironmentUtils'
import { DuosUser } from 'src/types/model'

export const rasEnabled = (): boolean => {
  return EnvironmentUtils.checkEnv(envGroups.NON_PROD)
}

export const nihAccountLabel = () => {
  return rasEnabled() ? 'RAS' : 'eRA Commons'
}

export const nihAccountInstructions = () => {
  return rasEnabled() ? 'https://datascience.nih.gov/researcher-auth-service-initiative' : 'https://www.era.nih.gov/register-accounts/understanding-era-commons-accounts.htm'
}

export const extractEraAuthenticationState = (user: DuosUser) => {
  const authProp = user.properties?.find(p => p.propertyKey === 'eraAuthorized')
  const expProp = user.properties?.find(p => p.propertyKey === 'eraExpiration')
  const isAuthorized = authProp?.propertyValue === 'true' || false
  const expirationCount = expProp?.propertyValue ? expirationCountFromDate(expProp.propertyValue) : 0
  const nihValid = isAuthorized && expirationCount > 0
  return {
    isAuthorized,
    expirationCount,
    nihValid,
    eraCommonsId: user.eraCommonsId,
  }
}

// Determine the number of days until expiration from the given epoch time string
const expirationCountFromDate = (expDate: string) => {
  let result = -1
  if (expDate !== null && expDate !== undefined) {
    const currentDate = new Date()
    const millisecondsPerDay = 24 * 60 * 60 * 1000
    const parsedExpDate = new Date(parseInt(expDate, 10))
    const count = (treatAsUTC(parsedExpDate).getTime() - treatAsUTC(currentDate).getTime()) / millisecondsPerDay
    if (count > 0) {
      result = Math.round(count)
    }
  }
  return result
}

const treatAsUTC = (date: Date) => {
  const result = new Date(date)
  result.setMinutes(result.getMinutes() - result.getTimezoneOffset())
  return result
}
