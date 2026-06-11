import { describe, it, expect, vi } from 'vitest'
import {
  assign,
  capitalize,
  chain,
  chunk,
  clone,
  cloneDeep,
  compact,
  concat,
  debounce,
  difference,
  every,
  filter,
  find,
  findIndex,
  first,
  flatMap,
  flatten,
  forEach,
  get,
  groupBy,
  head,
  includes,
  intersection,
  isArray,
  isEmpty,
  isEqual,
  isFunction,
  isNaN,
  isNil,
  isNull,
  isNumber,
  isString,
  isUndefined,
  join,
  kebabCase,
  keys,
  map,
  matches,
  merge,
  omit,
  orderBy,
  set,
  sortBy,
  sortedUniq,
  toLower,
  toNumber,
  union,
  uniq,
  unset,
  values,
  without,
  xor,
} from 'src/utils/NodashUtil'

describe('NodashUtil', () => {
  it('assign merges source objects into target', () => {
    expect(assign({ a: 1 }, { b: 2 }, { a: 3 })).toEqual({ a: 3, b: 2 })
  })

  it('concat appends values and arrays', () => {
    expect(concat([1], 2, [3, 4])).toEqual([1, 2, 3, 4])
  })

  it('every, filter, find, findIndex work with predicates', () => {
    const data = [1, 2, 3, 4]
    expect(every(data, n => n > 0)).toBe(true)
    expect(filter(data, n => n % 2 === 0)).toEqual([2, 4])
    expect(find(data, n => n > 2)).toBe(3)
    expect(findIndex(data, n => n === 3)).toBe(2)
  })

  it('filter, find, and map support lodash-style shorthands and objects', () => {
    const rows = [
      { id: 1, active: true, role: { name: 'Admin' } },
      { id: 2, active: false, role: { name: 'Member' } },
    ]
    const rowMap = { a: rows[0], b: rows[1] }

    expect(filter(rows, { active: true })).toEqual([rows[0]])
    expect(find(rows, { role: { name: 'Member' } })).toEqual(rows[1])
    expect(map(rows, 'id')).toEqual([1, 2])
    expect(map(rowMap, (row, key) => [key, row.id])).toEqual([['a', 1], ['b', 2]])
  })

  it('flatMap and flatten flatten values as expected', () => {
    expect(flatMap([1, 2], n => [n, n * 10])).toEqual([1, 10, 2, 20])
    expect(flatten<number>([[1], [2, [3]]], 2)).toEqual([1, 2, 3])
  })

  it('forEach iterates over each element', () => {
    const seen: number[] = []
    forEach([1, 2, 3], n => seen.push(n))
    expect(seen).toEqual([1, 2, 3])
  })

  it('includes handles strings, arrays, and unsupported collections', () => {
    expect(includes('hello', 'ell')).toBe(true)
    expect(includes([1, 2, 3], 2)).toBe(true)
    expect(includes({} as never as string, 'x')).toBe(false)
  })

  it('isArray and isNaN return expected values', () => {
    expect(isArray([1])).toBe(true)
    expect(isArray({})).toBe(false)
    expect(isNaN(Number.NaN)).toBe(true)
    expect(isNaN(1)).toBe(false)
  })

  it('join, keys, map, toLower, and values work as expected', () => {
    expect(join(['a', 'b'], '-')).toBe('a-b')
    expect(keys({ a: 1, b: 2 })).toEqual(['a', 'b'])
    expect(map([1, 2], n => n * 2)).toEqual([2, 4])
    expect(toLower('HeLLo')).toBe('hello')
    expect(toLower(null)).toBe('')
    expect(values({ a: 1, b: 2 })).toEqual([1, 2])
  })

  it('clone and cloneDeep create copies with expected depth behavior', () => {
    const fn = () => true
    const source = { a: 1, nested: { b: 2 }, fn }
    const shallow = clone(source)
    const deep = cloneDeep(source)

    source.nested.b = 5

    expect(shallow.nested.b).toBe(5)
    expect(deep.nested.b).toBe(2)
    expect(deep.fn).toBe(fn)
  })

  it('compact removes falsey values', () => {
    expect(compact([0, 1, false, 2, '', 3, null, undefined])).toEqual([1, 2, 3])
  })

  it('first and head return the first element', () => {
    expect(first([7, 8, 9])).toBe(7)
    expect(head([7, 8, 9])).toBe(7)
    expect(first([])).toBe(undefined)
  })

  it('isFunction, isNil, isNull, isNumber, isString, and isUndefined classify values', () => {
    expect(isFunction(() => true)).toBe(true)
    expect(isFunction('x')).toBe(false)
    expect(isNil(null)).toBe(true)
    expect(isNil(undefined)).toBe(true)
    expect(isNull(null)).toBe(true)
    expect(isNumber(1)).toBe(true)
    expect(isString('x')).toBe(true)
    expect(isUndefined(undefined)).toBe(true)
  })

  it('toNumber, uniq, union, and without transform arrays correctly', () => {
    expect(toNumber('42')).toBe(42)
    expect(uniq([1, 1, 2, 3])).toEqual([1, 2, 3])
    expect(union([1, 2], [2, 3], [3, 4])).toEqual([1, 2, 3, 4])
    expect(without([1, 2, 3], 2)).toEqual([1, 3])
  })

  it('capitalize and chunk format and partition values', () => {
    expect(capitalize('hELLO')).toBe('Hello')
    expect(capitalize('')).toBe('')
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk([1, 2, 3], 0)).toEqual([])
  })

  it('debounce delays invocation until wait period and supports cancel', () => {
    vi.useFakeTimers()
    const spy = vi.fn()
    const fn = debounce(spy, 50)

    fn('a')
    fn('b')

    vi.advanceTimersByTime(49)
    expect(spy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('b')

    fn('c')
    fn.cancel()
    vi.advanceTimersByTime(50)
    expect(spy).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('difference computes relative complement', () => {
    expect(difference([1, 2, 3, 4], [2], [4, 5])).toEqual([1, 3])
  })

  it('get reads dot and bracket paths with default fallback', () => {
    const obj = { a: { b: [{ c: 5 }] } }
    expect(get(obj, 'a.b[0].c')).toBe(5)
    expect(get(obj, 'a.b[1].c', 'missing')).toBe('missing')
  })

  it('groupBy groups by iteratee function and property name', () => {
    const items = [
      { id: 1, type: 'a' },
      { id: 2, type: 'b' },
      { id: 3, type: 'a' },
    ]

    expect(groupBy(items, item => item.type)).toEqual({
      a: [{ id: 1, type: 'a' }, { id: 3, type: 'a' }],
      b: [{ id: 2, type: 'b' }],
    })

    expect(groupBy(items, 'type')).toEqual({
      a: [{ id: 1, type: 'a' }, { id: 3, type: 'a' }],
      b: [{ id: 2, type: 'b' }],
    })
  })

  it('intersection computes common unique values', () => {
    expect(intersection([1, 2, 2, 3], [2, 3], [2, 4])).toEqual([2])
    expect(intersection()).toEqual([])
  })

  it('isEmpty handles nullish, strings, arrays, objects, maps, sets, and primitives', () => {
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
    expect(isEmpty('')).toBe(true)
    expect(isEmpty('x')).toBe(false)
    expect(isEmpty([])).toBe(true)
    expect(isEmpty([1])).toBe(false)
    expect(isEmpty({})).toBe(true)
    expect(isEmpty({ a: 1 })).toBe(false)
    expect(isEmpty(new Map())).toBe(true)
    expect(isEmpty(new Set([1]))).toBe(false)
    expect(isEmpty(0)).toBe(true)
    expect(isEmpty(false)).toBe(true)
  })

  it('isEqual and matches compare deeply', () => {
    expect(isEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true)
    expect(isEqual({ a: 1 }, { a: 2 })).toBe(false)

    const matcher = matches({ a: 1 })
    expect(matcher({ a: 1, b: 2 })).toBe(true)
    expect(matcher({ a: 2 })).toBe(false)
  })

  it('kebabCase converts casing and mixed tokens', () => {
    expect(kebabCase('myHTTPServer2Name')).toBe('my-http-server-2-name')
    expect(kebabCase('')).toBe('')
  })

  it('merge deep merges source objects', () => {
    const result = merge({ a: { b: 1 }, c: 1 }, { a: { d: 2 } }, { c: 3 })
    expect(result).toEqual({ a: { b: 1, d: 2 }, c: 3 })
  })

  it('omit removes keys from object', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ['b', 'c'])).toEqual({ a: 1 })
  })

  it('orderBy sorts by multiple iteratees with direction', () => {
    const rows = [
      { name: 'b', score: 2 },
      { name: 'a', score: 2 },
      { name: 'c', score: 1 },
    ]

    const result = orderBy(rows, ['score', 'name'], ['desc', 'asc'])
    expect(result).toEqual([
      { name: 'a', score: 2 },
      { name: 'b', score: 2 },
      { name: 'c', score: 1 },
    ])
    expect(orderBy(['b', 'a'], value => value, 'asc')).toEqual(['a', 'b'])
    expect(sortBy(rows, 'name')).toEqual([
      { name: 'a', score: 2 },
      { name: 'b', score: 2 },
      { name: 'c', score: 1 },
    ])
  })

  it('set creates nested structures and unset removes nested paths', () => {
    const obj: Record<string, unknown> = {}
    set(obj, 'a.b[0].c', 10)
    expect(obj).toEqual({ a: { b: [{ c: 10 }] } })

    expect(unset(obj, 'a.b[0].c')).toBe(true)
    expect(obj).toEqual({ a: { b: [{}] } })
  })

  it('sortedUniq, xor, and chain support value transformations', () => {
    expect(sortedUniq([1, 1, 2, 3, 3])).toEqual([1, 2, 3])
    expect(xor([1, 2, 3], [2, 3, 4], [3, 5])).toEqual([1, 4, 5])

    const result = chain([1, 2, 2, 3]).uniq().without(2).concat([4]).value()
    expect(result).toEqual([1, 3, 4])
  })
})
