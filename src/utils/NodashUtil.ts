/* eslint-disable @typescript-eslint/no-explicit-any */

export type Dictionary<T> = Record<string, T>

type CollectionKey = number | string
type Collection<T> = T[] | Record<string, T> | null | undefined
type Iteratee<T, U> = ((value: T, key: CollectionKey, collection: Collection<T>) => U) | string
type Predicate<T> = ((value: T, key: CollectionKey, collection: Collection<T>) => any) | Record<string, any> | string
type SortOrder = 'asc' | 'desc'
type Falsey = false | '' | 0 | null | undefined
type Truthy<T> = T extends Falsey ? never : T

const toPath = (path: string | string[]) =>
  Array.isArray(path) ? path : String(path).replaceAll(/\[(\d+)]/g, '.$1').split('.')

const getAtPath = (obj: any, path: string | string[], defaultValue?: any) => {
  if (obj == null) return defaultValue
  const keys = toPath(path)
  let result = obj
  for (const key of keys) {
    result = result?.[key]
    if (result === undefined) return defaultValue
  }
  return result
}

const collectionEntries = <T>(collection: Collection<T>): Array<[CollectionKey, T]> => {
  if (Array.isArray(collection)) return collection.map((value, index) => [index, value] as [number, T])
  if (collection != null && typeof collection === 'object') return Object.entries(collection) as Array<[string, T]>
  return []
}

const collectionValues = <T>(collection: Collection<T>): T[] =>
  collectionEntries(collection).map(([, value]) => value)

const isPlainObject = (value: any): value is Record<string, any> =>
  Object.prototype.toString.call(value) === '[object Object]'

const deepEqual = (value: any, other: any): boolean => {
  if (value === other) return true
  if (value == null || other == null) return value === other
  if (value instanceof Date && other instanceof Date) return value.getTime() === other.getTime()
  if (Array.isArray(value) || Array.isArray(other)) {
    if (!Array.isArray(value) || !Array.isArray(other) || value.length !== other.length) return false
    return value.every((item, index) => deepEqual(item, other[index]))
  }
  if (typeof value !== 'object' || typeof other !== 'object') return false

  const keysA = Object.keys(value)
  const keysB = Object.keys(other)
  if (keysA.length !== keysB.length) return false

  return keysA.every(key => keysB.includes(key) && deepEqual(value[key], other[key]))
}

const property = (path: string) => (value: any) => getAtPath(value, path)

const predicateFor = <T>(predicate: Predicate<T>): ((value: T, key?: CollectionKey, collection?: Collection<T>) => boolean) => {
  if (typeof predicate === 'function') {
    return (value: T, key?: CollectionKey, collection?: Collection<T>) => Boolean(predicate(value, key as CollectionKey, collection as Collection<T>))
  }
  if (typeof predicate === 'string') {
    return (value: T) => Boolean(property(predicate)(value))
  }
  if (predicate != null && typeof predicate === 'object') {
    return (value: T) => Object.entries(predicate).every(([key, expected]) => deepEqual(getAtPath(value, key), expected))
  }
  return Boolean
}

const iterateeFor = <T, U>(iteratee: Iteratee<T, U>) => {
  if (typeof iteratee === 'function') {
    return iteratee
  }
  return (value: T) => property(iteratee)(value) as U
}

const normalizeArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export const assign = Object.assign

export const concat = <T>(arr: T[] | null | undefined, ...values: (T | T[])[]) => (arr ?? []).concat(...values)

export const every = <T>(collection: Collection<T>, predicate: Predicate<T>) => {
  const matches = predicateFor(predicate)
  return collectionEntries(collection).every(([key, value]) => matches(value, key, collection))
}

export const filter = <T>(collection: Collection<T>, predicate: Predicate<T>) => {
  const matches = predicateFor(predicate)
  return collectionEntries(collection)
    .filter(([key, value]) => matches(value, key, collection))
    .map(([, value]) => value)
}

export const find = <T>(collection: Collection<T>, predicate: Predicate<T>) => {
  const matches = predicateFor(predicate)
  return collectionEntries(collection).find(([key, value]) => matches(value, key, collection))?.[1]
}

export const findIndex = <T>(arr: T[], predicate: Predicate<T>) => {
  const matches = predicateFor(predicate)
  return arr.findIndex((value, index, obj) => matches(value, index, obj))
}

export const flatMap = <T, U>(collection: Collection<T>, iteratee: Iteratee<T, U | ReadonlyArray<U>>) => {
  const transform = iterateeFor(iteratee)
  return collectionEntries(collection).flatMap(([key, value]) => transform(value, key, collection))
}

export const flatten = <T = any>(arr: any[] | null | undefined, depth: number = 1): T[] => (arr ?? []).flat(depth) as T[]

export const forEach = <T>(collection: Collection<T>, iteratee: (value: T, key: CollectionKey, collection: Collection<T>) => void) =>
  collectionEntries(collection).forEach(([key, value]) => iteratee(value, key, collection))

export const includes = (collection: any[] | string | null | undefined, target: any, fromIndex?: number) => {
  if (typeof collection === 'string') return collection.includes(target, fromIndex)
  return Array.isArray(collection) ? collection.includes(target, fromIndex) : false
}

export const isArray = Array.isArray

const numberIsNaN = Number.isNaN
export { numberIsNaN as isNaN }

export const join = (arr: any[], separator?: string) => arr.join(separator)

export const keys = (obj: any) => obj == null ? [] : Object.keys(obj)

export const map = <T, U>(collection: Collection<T>, iteratee: Iteratee<T, U>) => {
  const transform = iterateeFor(iteratee)
  return collectionEntries(collection).map(([key, value]) => transform(value, key, collection))
}

export const toLower = (value: any) => (value == null ? '' : String(value).toLowerCase())

export const values = (obj: any) => obj == null ? [] : Object.values(obj)

export const clone = <T>(obj: T): T => {
  if (Array.isArray(obj)) return [...obj] as T
  if (obj != null && typeof obj === 'object') return { ...obj }
  return obj
}

const cloneDeepValue = <T>(obj: T, seen: WeakMap<object, any>): T => {
  if (obj == null || typeof obj !== 'object') return obj
  if (seen.has(obj)) return seen.get(obj)
  if (obj instanceof Date) return new Date(obj.getTime()) as T
  if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags) as T
  if (obj instanceof Map) {
    const result = new Map()
    seen.set(obj, result)
    obj.forEach((value, key) => result.set(cloneDeepValue(key, seen), cloneDeepValue(value, seen)))
    return result as T
  }
  if (obj instanceof Set) {
    const result = new Set()
    seen.set(obj, result)
    obj.forEach(value => result.add(cloneDeepValue(value, seen)))
    return result as T
  }
  if (Array.isArray(obj)) {
    const result: any[] = []
    seen.set(obj, result)
    obj.forEach((value, index) => {
      result[index] = cloneDeepValue(value, seen)
    })
    return result as T
  }
  if (!isPlainObject(obj)) return obj

  const result: Record<PropertyKey, any> = {}
  seen.set(obj, result)
  Reflect.ownKeys(obj).forEach((key) => {
    result[key] = cloneDeepValue((obj as Record<PropertyKey, any>)[key], seen)
  })
  return result as T
}

export const cloneDeep = <T>(obj: T): T => cloneDeepValue(obj, new WeakMap())

export const compact = <T>(arr: T[] | null | undefined) => (arr ?? []).filter(Boolean) as Array<Truthy<T>>

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
  const debounced = function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
  debounced.cancel = () => {
    clearTimeout(timeout)
    timeout = undefined
  }
  return debounced
}

export const difference = <T>(array: T[], ...values: T[][]): T[] => {
  const valuesSet = new Set(values.flat())
  return array.filter(x => !valuesSet.has(x))
}

export const get = getAtPath

export const groupBy = <T>(collection: Collection<T>, iteratee: string | ((value: T) => string | number)): Record<string, T[]> => {
  const getKey = typeof iteratee === 'function' ? iteratee : (item: any) => getAtPath(item, iteratee)
  return collectionValues(collection).reduce((result: Record<string, T[]>, item) => {
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
  return deepEqual(value, other)
}

export const kebabCase = (str: string): string => {
  if (!str) return ''

  const s = String(str)

  // Insert spaces at boundaries where words should be split:
  //  - between lower/number and upper (myHTTP -> my HTTP)
  //  - between an upper sequence and an upper+lower (HTTPServer -> HTTP Server)
  //  - between letters and numbers (Server2 -> Server 2)
  const withSpaces = s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
    .replace(/([0-9])([a-zA-Z])/g, '$1 $2')

  return withSpaces
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

export const matches = (source: any) => predicateFor(source)

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

const compareAny = (a: any, b: any, order: SortOrder) => {
  if (a === b) return 0
  const direction = order === 'asc' ? 1 : -1
  return a < b ? -direction : direction
}

const compareByIteratee = <T>(
  a: T,
  b: T,
  iteratee: string | ((item: T) => any),
  order: SortOrder,
) => {
  const getValue = typeof iteratee === 'function' ? iteratee : (item: any) => getAtPath(item, iteratee)
  return compareAny(getValue(a), getValue(b), order)
}

export const orderBy = <T>(
  collection: Collection<T>,
  iteratees: string | ((item: T) => any) | Array<string | ((item: T) => any)> = value => value,
  orders: SortOrder | SortOrder[] = [],
) => {
  const result = collectionValues(collection)
  const iterateeList = normalizeArray(iteratees)
  const orderList = normalizeArray(orders)
  return result.sort((a: T, b: T) => {
    for (const [index, iteratee] of iterateeList.entries()) {
      const comparison = compareByIteratee(a, b, iteratee, orderList[index] || 'asc')
      if (comparison !== 0) return comparison
    }
    return 0
  })
}

export const sortBy = <T>(
  collection: Collection<T>,
  iteratees: string | ((item: T) => any) | Array<string | ((item: T) => any)> = value => value,
) => orderBy(collection, iteratees)

export const set = (obj: any, path: string | string[], value: any) => {
  if (typeof obj !== 'object' || obj === null) return obj
  const keys = toPath(path)
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
  const keys = toPath(path)
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
  capitalize, chunk, debounce, difference, get, groupBy, intersection, isEmpty, isEqual, kebabCase, matches, merge, omit, orderBy, set, sortBy, sortedUniq, unset, xor,
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
