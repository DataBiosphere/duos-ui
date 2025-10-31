import React from 'react'
import { renderColumnContent } from 'src/utils/RenderUtils'

describe('renderColumnContent', () => {
  it('renders with custom renderer', () => {
    const customRenderers = {
      test: (value: unknown) => <span>{value as string}</span>,
    }
    const result = renderColumnContent('test', 'abc', customRenderers)
    expect(result).to.deep.equal(<span>abc</span>)
  })

  it('renders array of objects', () => {
    const arr = [{ a: 1 }, { b: 2 }]
    const result = renderColumnContent('col', arr)
    expect(result).to.equal(JSON.stringify(arr[0]) + ', ' + JSON.stringify(arr[1]))
  })

  it('renders array of strings', () => {
    const arr = ['a', 'b']
    const result = renderColumnContent('col', arr)
    expect(result).to.equal('a, b')
  })

  it('renders null and undefined', () => {
    expect(renderColumnContent('col', null)).to.equal(null)
    expect(renderColumnContent('col', undefined)).to.equal(null)
  })

  it('renders object', () => {
    expect(renderColumnContent('col', { a: 1 })).to.equal(JSON.stringify({ a: 1 }))
  })

  it('renders string and number', () => {
    expect(renderColumnContent('col', 'abc')).to.equal('abc')
    expect(renderColumnContent('col', 123)).to.equal('123')
  })
})
