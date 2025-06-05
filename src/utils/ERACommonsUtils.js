import {Buffer} from 'buffer';
//import EnvironmentUtils, {envGroups} from '../utils/EnvironmentUtils.js';

export const rasEnabled = () => {
  //return EnvironmentUtils.checkEnv(envGroups.DEV);
  return false;
}

export const nihAccountLabel = () => {
  return rasEnabled() ? 'RAS' : 'eRA Commons';
}

export const nihAccountInstructions = () => {
  return rasEnabled() ? 'https://datascience.nih.gov/researcher-auth-service-initiative' : 'https://www.era.nih.gov/register-accounts/understanding-era-commons-accounts.htm';
}

/**
 * This function is used to verify the raw NIH token and return the decoded data.
 * It takes in a base64 encoded token, splits it into the following components:
 * {"alg":"RS256","typ":"JWT"}
 * {"eraCommonsUsername":"USERNAME","iat":1709307111,"exp":1709310711}
 * <... a chunk of binary data we don't care about ...>
 * all in a single concatenated string. We then split the string into the parts we
 * care about and parse the era commons part as a JSON object.
 * @param token
 * @returns JSON Object in the form of: {'eraCommonsUsername':String,'iat':Integer,'exp':Integer}
 */
export const decodeNihToken = async (token) => {
  const rawToken = token['nih-username-token'] || null;
  if (rawToken === null) {
    return null;
  }
  try {
    const bufferString = Buffer.from(rawToken, 'base64').toString('utf8');
    // We want the JSON components, so introduce a delimiter to split on
    const splittableBufferString = bufferString.replaceAll('}', '}|');
    const parts = splittableBufferString.split('|');
    // Something is wrong if we don't have at least 2 parts
    if (parts.length < 2) {
      return null;
    }
    return JSON.parse(parts[1]);
  } catch (_error) {
    return null;
  }
};

/**
 * This function takes in a date and returns the number of days until that date.
 * @param expDate
 * @returns {number}
 */
export const expirationCountFromDate = (expDate) => {
  let result = -1;
  if (expDate !== null && expDate !== undefined) {
    const currentDate = new Date().getTime();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const count = (treatAsUTC(parseInt(expDate, 10)) - treatAsUTC(currentDate)) / millisecondsPerDay;
    if (count > 0) {
      result = Math.round(count);
    }
  }
  return result;
};

/**
 * This function takes in a date and returns a new date object with the timezone offset removed.
 * @param date
 * @returns {Date}
 */
export const treatAsUTC = (date) => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
  return result;
};

/**
 * This function generates a summation of common ERA Commons values from a user object
 *
 * @param user The user to derive era authentication state from
 */
export const extractEraAuthenticationState = (user) => {
  const properties = user.properties;
  const authProp = properties?.find(p => p.propertyKey === 'eraAuthorized');
  const expProp = properties?.find(p => p.propertyKey === 'eraExpiration');
  const isAuthorized = authProp?.propertyValue ?? false;
  const expirationCount = expProp?.propertyValue ? expirationCountFromDate(expProp.propertyValue) : 0;
  const nihValid = isAuthorized && expirationCount > 0;
  return {
    isAuthorized,
    expirationCount,
    nihValid,
    eraCommonsId: user.eraCommonsId
  };
};
