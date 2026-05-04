export const isNil = (value: unknown): value is null | undefined => value === null || value === undefined

export const isFunction = (value: unknown): value is (...args: unknown[]) => unknown => typeof value === 'function'

export const isArray = (value: unknown): value is unknown[] => Array.isArray(value)

export const isString = (value: unknown): value is string => typeof value === 'string'

export const isEmpty = (value: unknown): boolean => {
  if (isNil(value)) return true
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

export const groupBy = <T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> =>
  arr.reduce((acc: Record<string, T[]>, item) => {
    const key = keyFn(item)
    acc[key] = acc[key] ? [...acc[key], item] : [item]
    return acc
  }, {})
