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
    expect(assign({ a: 1 }, { b: 2 }, { a: 3 })).to.deep.equal({ a: 3, b: 2 })
  })

  it('concat appends values and arrays', () => {
    expect(concat([1], 2, [3, 4])).to.deep.equal([1, 2, 3, 4])
  })

  it('every, filter, find, findIndex work with predicates', () => {
    const data = [1, 2, 3, 4]
    expect(every(data, n => n > 0)).to.equal(true)
    expect(filter(data, n => n % 2 === 0)).to.deep.equal([2, 4])
    expect(find(data, n => n > 2)).to.equal(3)
    expect(findIndex(data, n => n === 3)).to.equal(2)
  })

  it('flatMap and flatten flatten values as expected', () => {
    expect(flatMap([1, 2], n => [n, n * 10])).to.deep.equal([1, 10, 2, 20])
    expect(flatten<number>([[1], [2, [3]]], 2)).to.deep.equal([1, 2, 3])
  })

  it('forEach iterates over each element', () => {
    const seen: number[] = []
    forEach([1, 2, 3], n => seen.push(n))
    expect(seen).to.deep.equal([1, 2, 3])
  })

  it('includes handles strings, arrays, and unsupported collections', () => {
    expect(includes('hello', 'ell')).to.equal(true)
    expect(includes([1, 2, 3], 2)).to.equal(true)
    expect(includes({} as never as string, 'x')).to.equal(false)
  })

  it('isArray and isNaN return expected values', () => {
    expect(isArray([1])).to.equal(true)
    expect(isArray({})).to.equal(false)
    expect(isNaN(Number.NaN)).to.equal(true)
    expect(isNaN(1)).to.equal(false)
  })

  it('join, keys, map, toLower, and values work as expected', () => {
    expect(join(['a', 'b'], '-')).to.equal('a-b')
    expect(keys({ a: 1, b: 2 })).to.deep.equal(['a', 'b'])
    expect(map([1, 2], n => n * 2)).to.deep.equal([2, 4])
    expect(toLower('HeLLo')).to.equal('hello')
    expect(toLower(null)).to.equal('')
    expect(values({ a: 1, b: 2 })).to.deep.equal([1, 2])
  })

  it('clone and cloneDeep create copies with expected depth behavior', () => {
    const source = { a: 1, nested: { b: 2 } }
    const shallow = clone(source)
    const deep = cloneDeep(source)

    source.nested.b = 5

    expect(shallow.nested.b).to.equal(5)
    expect(deep.nested.b).to.equal(2)
  })

  it('compact removes falsey values', () => {
    expect(compact([0, 1, false, 2, '', 3, null, undefined])).to.deep.equal([1, 2, 3])
  })

  it('first and head return the first element', () => {
    expect(first([7, 8, 9])).to.equal(7)
    expect(head([7, 8, 9])).to.equal(7)
    expect(first([])).to.equal(undefined)
  })

  it('isFunction, isNil, isNull, isNumber, isString, and isUndefined classify values', () => {
    expect(isFunction(() => true)).to.equal(true)
    expect(isFunction('x')).to.equal(false)
    expect(isNil(null)).to.equal(true)
    expect(isNil(undefined)).to.equal(true)
    expect(isNull(null)).to.equal(true)
    expect(isNumber(1)).to.equal(true)
    expect(isString('x')).to.equal(true)
    expect(isUndefined(undefined)).to.equal(true)
  })

  it('toNumber, uniq, union, and without transform arrays correctly', () => {
    expect(toNumber('42')).to.equal(42)
    expect(uniq([1, 1, 2, 3])).to.deep.equal([1, 2, 3])
    expect(union([1, 2], [2, 3], [3, 4])).to.deep.equal([1, 2, 3, 4])
    expect(without([1, 2, 3], 2)).to.deep.equal([1, 3])
  })

  it('capitalize and chunk format and partition values', () => {
    expect(capitalize('hELLO')).to.equal('Hello')
    expect(capitalize('')).to.equal('')
    expect(chunk([1, 2, 3, 4, 5], 2)).to.deep.equal([[1, 2], [3, 4], [5]])
    expect(chunk([1, 2, 3], 0)).to.deep.equal([])
  })

  it('debounce delays invocation until wait period', () => {
    cy.clock()
    const spy = cy.spy().as('debouncedSpy')
    const fn = debounce(spy, 50)

    fn('a')
    fn('b')
    cy.tick(49)
    cy.get('@debouncedSpy').should('not.have.been.called')
    cy.tick(1)
    cy.get('@debouncedSpy').should('have.been.calledOnceWith', 'b')
  })

  it('difference computes relative complement', () => {
    expect(difference([1, 2, 3, 4], [2], [4, 5])).to.deep.equal([1, 3])
  })

  it('get reads dot and bracket paths with default fallback', () => {
    const obj = { a: { b: [{ c: 5 }] } }
    expect(get(obj, 'a.b[0].c')).to.equal(5)
    expect(get(obj, 'a.b[1].c', 'missing')).to.equal('missing')
  })

  it('groupBy groups by iteratee function and property name', () => {
    const items = [
      { id: 1, type: 'a' },
      { id: 2, type: 'b' },
      { id: 3, type: 'a' },
    ]

    expect(groupBy(items, item => item.type)).to.deep.equal({
      a: [{ id: 1, type: 'a' }, { id: 3, type: 'a' }],
      b: [{ id: 2, type: 'b' }],
    })

    expect(groupBy(items, 'type')).to.deep.equal({
      a: [{ id: 1, type: 'a' }, { id: 3, type: 'a' }],
      b: [{ id: 2, type: 'b' }],
    })
  })

  it('intersection computes common unique values', () => {
    expect(intersection([1, 2, 2, 3], [2, 3], [2, 4])).to.deep.equal([2])
    expect(intersection()).to.deep.equal([])
  })

  it('isEmpty handles nullish, strings, arrays, objects, maps, sets, and primitives', () => {
    expect(isEmpty(null)).to.equal(true)
    expect(isEmpty(undefined)).to.equal(true)
    expect(isEmpty('')).to.equal(true)
    expect(isEmpty('x')).to.equal(false)
    expect(isEmpty([])).to.equal(true)
    expect(isEmpty([1])).to.equal(false)
    expect(isEmpty({})).to.equal(true)
    expect(isEmpty({ a: 1 })).to.equal(false)
    expect(isEmpty(new Map())).to.equal(true)
    expect(isEmpty(new Set([1]))).to.equal(false)
    expect(isEmpty(0)).to.equal(true)
    expect(isEmpty(false)).to.equal(true)
  })

  it('isEqual and matches compare deeply', () => {
    expect(isEqual({ a: { b: 1 } }, { a: { b: 1 } })).to.equal(true)
    expect(isEqual({ a: 1 }, { a: 2 })).to.equal(false)

    const matcher = matches({ a: 1 })
    expect(matcher({ a: 1, b: 2 })).to.equal(true)
    expect(matcher({ a: 2 })).to.equal(false)
  })

  it('kebabCase converts casing and mixed tokens', () => {
    expect(kebabCase('myHTTPServer2Name')).to.equal('my-http-server-2-name')
    expect(kebabCase('')).to.equal('')
  })

  it('merge deep merges source objects', () => {
    const result = merge({ a: { b: 1 }, c: 1 }, { a: { d: 2 } }, { c: 3 })
    expect(result).to.deep.equal({ a: { b: 1, d: 2 }, c: 3 })
  })

  it('omit removes keys from object', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ['b', 'c'])).to.deep.equal({ a: 1 })
  })

  it('orderBy sorts by multiple iteratees with direction', () => {
    const rows = [
      { name: 'b', score: 2 },
      { name: 'a', score: 2 },
      { name: 'c', score: 1 },
    ]

    const result = orderBy(rows, ['score', 'name'], ['desc', 'asc'])
    expect(result).to.deep.equal([
      { name: 'a', score: 2 },
      { name: 'b', score: 2 },
      { name: 'c', score: 1 },
    ])
  })

  it('set creates nested structures and unset removes nested paths', () => {
    const obj: Record<string, unknown> = {}
    set(obj, 'a.b[0].c', 10)
    expect(obj).to.deep.equal({ a: { b: [{ c: 10 }] } })

    expect(unset(obj, 'a.b[0].c')).to.equal(true)
    expect(obj).to.deep.equal({ a: { b: [{}] } })
  })

  it('sortedUniq, xor, and chain support value transformations', () => {
    expect(sortedUniq([1, 1, 2, 3, 3])).to.deep.equal([1, 2, 3])
    expect(xor([1, 2, 3], [2, 3, 4], [3, 5])).to.deep.equal([1, 4, 5])

    const result = chain([1, 2, 2, 3]).uniq().without(2).concat([4]).value()
    expect(result).to.deep.equal([1, 3, 4])
  })
})
