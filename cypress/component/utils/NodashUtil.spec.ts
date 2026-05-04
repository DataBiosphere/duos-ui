import { groupBy, isEmpty, isNil } from 'src/utils/NodashUtil'

describe('NodashUtil', () => {
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
