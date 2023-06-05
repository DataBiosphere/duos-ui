import {Storage} from '../libs/storage';
import {includes} from 'lodash/fp';


/**
 * Predefined groups of environments for which certain features might be valid for.
 * The environment hierarchy is:
 *  * prod
 *    * staging
 *      * alpha
 *      * dev
 *      * local
 * @type {{NON_STAGING: string[], NON_PROD: string[]}}
 */
export const envGroups = {
  NON_PROD: ['local', 'dev', 'alpha', 'staging'],
  NON_STAGING: ['local', 'dev', 'alpha'],
  DEV: ['local', 'dev'],
};

/**
 * Returns true if the current application `Storage.ENV` variable exists as an element
 * in the specified environment group or false otherwise. Used to determine if a route
 * should be displayed or not based on current env.
 *
 * @example
 * // returns true when Storage.ENV === 'alpha' || 'dev' || 'local'
 * checkEnv(envGroups.NON_STAGING)
 * // returns false when Storage.ENV === 'staging' || 'prod'
 * checkEnv(envGroups.NON_STAGING)
 * @param envGroup
 * @returns {boolean}
 */
export const checkEnv = (envGroup) => {
  const env = Storage.getEnv();
  return env ? includes(env)(envGroup) : false;
};

/**
 * Returns true if the current environment is development or local.
 *
 * @example
 * // returns true when Storage.ENV === 'local' || 'dev'
 * isDevEnv()
 * @returns {boolean}
 */
export const isDevEnv = () => checkEnv(envGroups.DEV);

export default {
  checkEnv,
  isDevEnv,
  envGroups
};
