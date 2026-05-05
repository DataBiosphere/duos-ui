/* eslint-disable @typescript-eslint/no-explicit-any */

export const assign = Object.assign

export const concat = <T>(arr: T[], ...values: (T | T[])[]) => arr.concat(...values)

export const every = <T>(arr: T[], predicate: (value: T, index: number, array: T[]) => any) =>
  arr.every((value, index, array) => Boolean(predicate(value, index, array)))

export const filter = <T>(arr: T[], predicate: (value: T, index: number, array: T[]) => any) =>
  arr.filter((value, index, array) => Boolean(predicate(value, index, array)))

export const find = <T>(arr: T[], predicate: (value: T, index: number, obj: T[]) => any) =>
  arr.find((value, index, obj) => Boolean(predicate(value, index, obj)))

export const findIndex = <T>(arr: T[], predicate: (value: T, index: number, obj: T[]) => any) =>
  arr.findIndex((value, index, obj) => Boolean(predicate(value, index, obj)))

export const flatMap = <T, U>(arr: T[], iteratee: (value: T, index: number, array: T[]) => U | ReadonlyArray<U>) =>
  arr.flatMap((value, index, array) => iteratee(value, index, array))

export const flatten = <T>(arr: any[], depth: number = 1): T[] => arr.flat(depth)

export const forEach = <T>(arr: T[], iteratee: (value: T, index: number, array: T[]) => void) =>
  arr.forEach((value, index, array) => iteratee(value, index, array))

export const includes = (collection: any[] | string, target: any, fromIndex?: number) => {
  if (typeof collection === 'string') return collection.includes(target, fromIndex)
  return Array.isArray(collection) ? collection.includes(target, fromIndex) : false
}

export const isArray = Array.isArray

const numberIsNaN = Number.isNaN
export { numberIsNaN as isNaN }

export const join = (arr: any[], separator?: string) => arr.join(separator)

export const keys = Object.keys

export const map = <T, U>(arr: T[], iteratee: (value: T, index: number, array: T[]) => U) =>
  arr.map((value, index, array) => iteratee(value, index, array))

export const toLower = (value: any) => (value == null ? '' : String(value).toLowerCase())

export const values = Object.values

export const clone = <T>(obj: T): T => (Array.isArray(obj) ? [...obj] : { ...obj }) as T

export const cloneDeep = <T>(obj: T): T => structuredClone(obj)

export const compact = <T>(arr: (T | null | undefined | false | '' | 0)[]) => arr.filter(Boolean) as T[]

export const first = <T>(arr: T[]): T | undefined => arr?.[0]
export const head = first

export const isFunction = (value: any): value is (...args: any[]) => any => typeof value === 'function'

export const isNil = (value: any): value is null | undefined => value == null

export const isNull = (value: any): value is null => value === null

export const isNumber = (value: any): value is number => typeof value === 'number'

export const isString = (value: any): value is string => typeof value === 'string'

export const isUndefined = (value: any): value is undefined => value === undefined

export const toNumber = Number

export const uniq = <T>(arr: T[]) => [...new Set(arr)]

export const union = <T>(...arrays: T[][]) => [...new Set(arrays.flat())]

export const without = <T>(arr: T[], ...values: T[]) => arr.filter(item => !values.includes(item))

export const capitalize = (str: string) => {
  if (!str) return ''
  str = String(str)
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const chunk = <T>(array: T[], size: number = 1): T[][] => {
  size = Math.max(Number(size), 0)
  if (!size || size < 1) return []
  let index = 0
  let resIndex = 0
  const result = new Array(Math.ceil(array.length / size))
  while (index < array.length) {
    const end = index + size
    result[resIndex++] = array.slice(index, end)
    index = end
  }
  return result
}

export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeout: any
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

export const difference = <T>(array: T[], ...values: T[][]): T[] => {
  const valuesSet = new Set(values.flat())
  return array.filter(x => !valuesSet.has(x))
}

export const get = (obj: any, path: string | string[], defaultValue?: any) => {
  if (obj == null) return defaultValue
  const keys = Array.isArray(path) ? path : String(path).replaceAll(/\[(\d+)]/g, '.$1').split('.')
  let result = obj
  for (const key of keys) {
    result = result?.[key]
    if (result === undefined) return defaultValue
  }
  return result
}

export const groupBy = <T>(collection: T[], iteratee: string | ((value: T) => string | number)) => {
  const getKey = typeof iteratee === 'function' ? iteratee : (item: any) => item[iteratee]
  return collection.reduce((result: any, item) => {
    const key = getKey(item);
    (result[key] || (result[key] = [])).push(item)
    return result
  }, {})
}

export const intersection = <T>(...arrays: T[][]): T[] => {
  if (arrays.length === 0) return []
  const [first, ...rest] = arrays
  const otherSets = rest.map(arr => new Set(arr))
  return [...new Set(first.filter(item => otherSets.every(set => set.has(item))))]
}

export const isEmpty = (value: any): boolean => {
  if (value == null) return true
  if (Array.isArray(value) || typeof value === 'string') return value.length === 0
  if (value instanceof Map || value instanceof Set) return value.size === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return true
}

export const isEqual = (value: any, other: any): boolean => {
  if (value === other) return true
  if (value == null || other == null || typeof value !== 'object' || typeof other !== 'object') return false

  const keysA = Object.keys(value)
  const keysB = Object.keys(other)
  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key) || !isEqual(value[key], other[key])) return false
  }
  return true
}

export const kebabCase = (str: string): string => {
  const result: string[] = []

  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    const p = str.at(i - 1) ?? ''
    const n = str.at(i + 1) ?? ''

    const space = /[\s_]/.test(c)
    const sep = space || (/[A-Z]/.test(c) && (/[a-z0-9]/.test(p) || (/[A-Z]/.test(p) && /[a-z]/.test(n)))) || (/\d/.test(c) && /[a-zA-Z]/.test(p)) || (/[a-z]/.test(c) && /\d/.test(p))

    if (sep && (result.length === 0 || result.at(-1) !== '-')) result.push('-')
    if (!space) result.push(c.toLowerCase())
  }

  return result.join('').replaceAll(/-+/g, '-').replaceAll(/^-|-$/g, '')
}

export const matches = (source: any) => (object: any) => isEqual(object, source) || (typeof source === 'object' && Object.keys(source).every(key => isEqual(object?.[key], source[key])))

const isPlainObject = (value: any): value is Record<string, any> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const mergeInto = (target: Record<string, any>, source: Record<string, any>) => {
  Object.entries(source).forEach(([key, sourceValue]) => {
    if (isPlainObject(sourceValue)) {
      const existing = target[key]
      const targetValue = isPlainObject(existing) ? existing : {}
      target[key] = mergeInto(targetValue, sourceValue)
      return
    }

    target[key] = sourceValue
  })

  return target
}

export const merge = (object: any, ...sources: any[]): any => {
  if (!isPlainObject(object)) return object

  sources.forEach((source) => {
    if (isPlainObject(source)) {
      mergeInto(object, source)
    }
  })

  return object
}

export const omit = (obj: any, keys: string[]) => {
  if (obj == null) return {}
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

const compareAny = (a: any, b: any, order: 'asc' | 'desc') => {
  if (a === b) return 0
  const direction = order === 'asc' ? 1 : -1
  return a < b ? -direction : direction
}

const compareByIteratee = <T>(
  a: T,
  b: T,
  iteratee: string | ((item: T) => any),
  order: 'asc' | 'desc',
) => {
  const getValue = typeof iteratee === 'function' ? iteratee : (item: any) => item[iteratee]
  return compareAny(getValue(a), getValue(b), order)
}

export const orderBy = <T>(collection: T[], iteratees: (string | ((item: T) => any))[], orders: ('asc' | 'desc')[] = []) => {
  const result = [...collection]
  return result.sort((a: T, b: T) => {
    for (const [index, iteratee] of iteratees.entries()) {
      const comparison = compareByIteratee(a, b, iteratee, orders[index] || 'asc')
      if (comparison !== 0) return comparison
    }
    return 0
  })
}

export const set = (obj: any, path: string | string[], value: any) => {
  if (typeof obj !== 'object' || obj === null) return obj
  const keys = Array.isArray(path) ? path : String(path).replaceAll(/\[(\d+)]/g, '.$1').split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current)) {
      // Look ahead to determine if we need an array or object
      current[key] = /^\d+$/.test(keys[i + 1]) ? [] : {}
    }
    current = current[key]
  }
  const lastKey = keys.at(-1)
  if (lastKey === undefined) return obj
  current[lastKey] = value
  return obj
}

export const sortedUniq = uniq

export const unset = (obj: any, path: string | string[]) => {
  if (obj == null) return true
  const keys = Array.isArray(path) ? path : String(path).replaceAll(/\[(\d+)]/g, '.$1').split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]]
    if (current == null) return true
  }
  const lastKey = keys.at(-1)
  if (lastKey !== undefined) {
    delete current[lastKey]
  }
  return true
}

export const xor = <T>(...arrays: T[][]): T[] => {
  const combined = arrays.flatMap(arr => [...new Set(arr)])
  const counts = new Map<T, number>()
  for (const val of combined) {
    counts.set(val, (counts.get(val) || 0) + 1)
  }
  const result: T[] = []
  for (const val of combined) {
    if (counts.get(val) === 1) {
      result.push(val)
    }
  }
  // Result should be unique
  return [...new Set(result)]
}

// Collect all functions into a single object for the chain wrapper
const _allMethods = {
  assign, concat, every, filter, find, findIndex, flatMap, flatten, forEach, includes, isArray, isNaN: numberIsNaN, join, keys, map, toLower, values,
  clone, cloneDeep, compact, first, head, isFunction, isNil, isNull, isNumber, isString, isUndefined, toNumber, uniq, union, without,
  capitalize, chunk, debounce, difference, get, groupBy, intersection, isEmpty, isEqual, kebabCase, matches, merge, omit, orderBy, set, sortedUniq, unset, xor,
}

export const chain = (value: any) => {
  let result = value
  const wrapper: any = {
    value: () => result,
  }

  // Add all methods to the wrapper
  Object.entries(_allMethods).forEach(([name, func]) => {
    wrapper[name] = (...args: any[]) => {
      result = (func as (...args: any[]) => any)(result, ...args)
      return wrapper
    }
  })

  return wrapper
}
