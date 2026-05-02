import { Storage } from 'src/libs/storage'

export type AppEnvironment = 'prod' | 'staging' | 'local' | 'dev'

/**
 * Predefined groups of environments for which certain features might be valid for.
 * The environment hierarchy is:
 *  * prod
 *    * staging
 *      * alpha
 *      * dev
 *      * local
 */
export const envGroups = {
  PROD_STAGING: ['prod', 'staging'],
  NON_PROD: ['local', 'dev', 'staging'],
  NON_STAGING: ['local', 'dev'],
  DEV: ['local', 'dev'],
} as const satisfies Record<string, readonly AppEnvironment[]>

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
export const checkEnv = (envGroup: readonly string[]): boolean => {
  const env = Storage.getEnv()
  return env === null ? false : envGroup.includes(env)
}

/**
 * Returns true if the current environment is development or local.
 *
 * @example
 * // returns true when Storage.ENV === 'local' || 'dev'
 * isDevEnv()
 * @returns {boolean}
 */
export const isDevEnv = (): boolean => checkEnv(envGroups.DEV)

export default {
  checkEnv,
  isDevEnv,
  envGroups,
}
