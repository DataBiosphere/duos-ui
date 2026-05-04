import { groupBy, isArray, isEmpty, isFunction, isNil, isString } from 'src/utils/NodashUtil'

describe('NodashUtil', () => {
  describe('isFunction', () => {
    it('returns true for function values', () => {
      expect(isFunction(() => true)).to.equal(true)
      expect(isFunction(function namedFn() {
        return false
      })).to.equal(true)
    })

    it('returns false for non-function values', () => {
      expect(isFunction(null)).to.equal(false)
      expect(isFunction(undefined)).to.equal(false)
      expect(isFunction({})).to.equal(false)
      expect(isFunction('value')).to.equal(false)
    })
  })

  describe('isArray', () => {
    it('returns true for arrays', () => {
      expect(isArray([])).to.equal(true)
      expect(isArray([1, 2, 3])).to.equal(true)
    })

    it('returns false for non-array values', () => {
      expect(isArray({})).to.equal(false)
      expect(isArray('value')).to.equal(false)
      expect(isArray(123)).to.equal(false)
      expect(isArray(null)).to.equal(false)
    })
  })

  describe('isString', () => {
    it('returns true for string values', () => {
      expect(isString('')).to.equal(true)
      expect(isString('value')).to.equal(true)
    })

    it('returns false for non-string values', () => {
      expect(isString(1)).to.equal(false)
      expect(isString(false)).to.equal(false)
      expect(isString([])).to.equal(false)
      expect(isString(null)).to.equal(false)
    })
  })

  describe('isNil', () => {
    it('returns true for null and undefined', () => {
      expect(isNil(null)).to.equal(true)
      expect(isNil(undefined)).to.equal(true)
    })

    it('returns false for non-nil values', () => {
      expect(isNil('')).to.equal(false)
      expect(isNil(0)).to.equal(false)
      expect(isNil(false)).to.equal(false)
      expect(isNil([])).to.equal(false)
      expect(isNil({})).to.equal(false)
    })
  })

  describe('isEmpty', () => {
    it('returns true for nil values', () => {
      expect(isEmpty(null)).to.equal(true)
      expect(isEmpty(undefined)).to.equal(true)
    })

    it('returns true for empty strings and arrays', () => {
      expect(isEmpty('')).to.equal(true)
      expect(isEmpty([])).to.equal(true)
    })

    it('returns false for non-empty strings and arrays', () => {
      expect(isEmpty('value')).to.equal(false)
      expect(isEmpty([1])).to.equal(false)
    })

    it('returns true for empty objects and false for objects with keys', () => {
      expect(isEmpty({})).to.equal(true)
      expect(isEmpty({ a: 1 })).to.equal(false)
    })

    it('returns false for numbers and booleans', () => {
      expect(isEmpty(0)).to.equal(false)
      expect(isEmpty(false)).to.equal(false)
    })
  })

  describe('groupBy', () => {
    it('groups items by key function', () => {
      const grouped = groupBy([
        { id: 1, type: 'a' },
        { id: 2, type: 'b' },
        { id: 3, type: 'a' },
      ], item => item.type)

      expect(Object.keys(grouped)).to.have.lengthOf(2)
      expect(grouped.a).to.deep.equal([
        { id: 1, type: 'a' },
        { id: 3, type: 'a' },
      ])
      expect(grouped.b).to.deep.equal([{ id: 2, type: 'b' }])
    })

    it('returns empty object for empty input', () => {
      expect(groupBy([], _item => 'key')).to.deep.equal({})
    })
  })
})
