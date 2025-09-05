import React, { useState } from 'react'
import { mount } from 'cypress/react'
import useAsyncCacheFetch from 'src/utils/useAsyncCacheFetch'

type TestAsyncCacheFetchProps<T> = {
  fetchFn: (id: string) => Promise<T>
}

function TestAsyncCacheFetch<T>({ fetchFn }: TestAsyncCacheFetchProps<T>) {
  const { fetchWithCache, clearCache } = useAsyncCacheFetch<string, T>()
  const [result, setResult] = useState<T | null>(null)

  const handleFetch = async () => {
    const data = await fetchWithCache('test', fetchFn)
    setResult(data)
  }

  const handleClear = () => {
    clearCache('test')
    setResult(null)
  }

  return (
    <div>
      <button onClick={handleFetch}>Fetch</button>
      <button onClick={handleClear}>Clear</button>
      <div data-cy="result">{result !== null ? String(result) : ''}</div>
    </div>
  )
}

describe('useAsyncCacheFetch', () => {
  it('fetches and caches data', () => {
    const fetchFn = cy.stub().resolves('fetched-data')
    mount(<TestAsyncCacheFetch fetchFn={fetchFn} />)

    cy.get('button').contains('Fetch').click()
    cy.get('[data-cy=\'result\']').should('have.text', 'fetched-data')

    // second click should use the cache
    cy.get('button').contains('Fetch').click()
    cy.get('[data-cy=\'result\']').should('have.text', 'fetched-data')

    cy.then(() => {
      expect(fetchFn.callCount).to.equal(1)
    })
  })

  it('clears cache and refetches', () => {
    const fetchFn = cy.stub().resolves('fetched-data')
    mount(<TestAsyncCacheFetch fetchFn={fetchFn} />)

    // first fetch
    cy.get('button').contains('Fetch').click()
    cy.get('[data-cy=\'result\']').should('have.text', 'fetched-data')
    cy.then(() => expect(fetchFn.callCount).to.equal(1))

    // clear cache
    cy.get('button').contains('Clear').click()
    cy.get('[data-cy=\'result\']').should('have.text', '')

    // fetch again -> should call fetchFn a second time
    cy.get('button').contains('Fetch').click()
    cy.get('[data-cy=\'result\']').should('have.text', 'fetched-data')
    cy.then(() => expect(fetchFn.callCount).to.equal(2))
  })
})
